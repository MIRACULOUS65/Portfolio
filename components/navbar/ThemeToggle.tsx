"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { motion } from "motion/react";
import type { Transition, Variants } from "motion/react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/shared/Button";
import { DEFAULT_THEME, type Theme } from "@/components/theme/theme";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useTheme } from "@/hooks/useTheme";
import { DURATION, EASING } from "@/lib/motion";
import { cn } from "@/utils/cn";

/**
 * The Navbar's theme switch (Requirement 3.5, Component_Specification §4,
 * Animation_Guidelines §17).
 *
 * One icon-only button that flips between the two themes and cross-fades a
 * sun/moon pair as it does. It owns no theme state: `hooks/useTheme.ts` reads
 * the current theme and `next-themes` performs the persistence and the class
 * swap on `<html>` (Requirements 3.3, 3.4), so this component is purely the
 * control surface.
 *
 * ## Why Framer Motion rather than a CSS transition
 *
 * `ActiveSectionIndicator` in this folder animates with an enumerated CSS
 * `transition-[...]` list, and the same approach would normally be the cheaper
 * choice here. It cannot work for this control: `ThemeProvider` passes
 * `disableTransitionOnChange` to `next-themes`, which injects
 * `*,*::before,*::after{transition:none!important}` for the frame in which the
 * theme class changes (it exists to stop every colour token in the page from
 * cross-fading into a half-themed frame). A CSS transition triggered by that
 * same class change is therefore suppressed and the icons would jump. Framer
 * Motion drives `opacity`/`transform` from JavaScript instead of a CSS
 * transition, so the cross-fade survives the suppression — and Requirement 24.1
 * names Framer Motion as the engine for state-change animations anyway.
 *
 * {@link THEME_ICON_VARIANTS} is consequently a named, exported object
 * registered in `lib/motionVariantsRegistry.ts`, which is what lets Property 21
 * (Requirement 24.4) check it. It animates `opacity`, `rotate`, and `scale`
 * only — no layout-triggering property — and both icons are absolutely
 * positioned inside one fixed `size-5` box, so neither state can change the
 * button's geometry (no CLS).
 *
 * ## Timing
 *
 * `DURATION.standard` (250ms) and `EASING.out` from `@/lib/motion`, never inline
 * numbers (Requirement 24.2). Animation_Guidelines §17 asks for 200ms, which is
 * not one of the three timing tokens Requirement 24.2 mandates
 * (150/250/350ms); `standard` is the token documented for cross-fades and is
 * the nearest step, so the cross-fade snaps to it.
 *
 * ## Reduced motion
 *
 * Under `prefers-reduced-motion: reduce` the transition becomes `duration: 0`
 * ({@link REDUCED_THEME_ICON_TRANSITION}), matching how
 * `components/shared/RevealOnView.tsx` degrades. The icon swap still happens
 * — it is essential state feedback — it simply happens instantly instead of
 * rotating and fading (Requirement 24.5). The variants are untouched, so there
 * is exactly one variants object to keep transform-safe.
 *
 * ## The pre-hydration frame
 *
 * `next-themes` reads `localStorage` in a `useState` initialiser, so its theme
 * is already correct on the *first* client render but is `undefined` during the
 * server render. Gating on `useTheme`'s `isResolved` alone would therefore
 * produce different markup on the server and on the first client render — a
 * hydration mismatch rather than a fix. This component adds an explicit
 * hydration gate ({@link useIsHydrated}) and combines the two:
 *
 * - Server render and first client render both use {@link DEFAULT_THEME}, so
 *   the two agree exactly and nothing mismatches. That is also the theme
 *   `styles/globals.css` paints with no class at all, so the fallback markup
 *   and the fallback stylesheet cannot disagree.
 * - Once hydrated, the real theme drives the icons. A visitor who explicitly
 *   chose light sees the moon cross-fade into the sun immediately after
 *   hydration — a deliberate animated correction rather than a jump, a blank
 *   control, or a hydration error.
 *
 * `data-theme` is absent until the theme is known, which makes the two phases
 * observable in tests without exposing an extra prop.
 *
 * ## Accessible name
 *
 * `size="icon"` makes `aria-label` mandatory at the type level, and the label
 * names the *action* the button performs — "Switch to light theme" — which is
 * what tells a screen-reader user both what will happen and, implicitly, which
 * theme is active (audited in task 44.3). Before hydration the theme is not
 * known, so the label is the theme-neutral {@link PENDING_THEME_TOGGLE_LABEL}
 * rather than a possibly-wrong claim. No `aria-pressed`: this is a two-way
 * switch between two equal themes, not a toggle with an on state, and a
 * pressed state that contradicted the label would be worse than none. The
 * icons are decorative (`aria-hidden`) and the focus ring comes from `Button`.
 */

/** The theme a click selects, given the one currently applied. */
export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

/** Whether an icon is the one being shown. */
export type ThemeIconState = "visible" | "hidden";

/**
 * Which state a given icon should be in.
 *
 * Pure and exported so "exactly one icon is visible for any theme" is testable
 * without a DOM: the two icons are keyed to the two themes, and equality
 * against a single `activeTheme` can only ever be true for one of them.
 */
export function themeIconState(
  iconTheme: Theme,
  activeTheme: Theme,
): ThemeIconState {
  return iconTheme === activeTheme ? "visible" : "hidden";
}

/** Accessible name once the applied theme is known. */
export function themeToggleLabel(theme: Theme): string {
  return `Switch to ${nextTheme(theme)} theme`;
}

/** Accessible name for the render before hydration, when no theme is known. */
export const PENDING_THEME_TOGGLE_LABEL = "Toggle theme";

/* Hydration gate, in the shape `useSyncExternalStore` already gives us: there
   is nothing to subscribe to, so the "store" never changes and the only thing
   that matters is the pair of snapshots. React reads `getServerSnapshot` for
   the server render *and* the hydrating render, then `getSnapshot` from the
   first post-hydration render onwards — which is exactly the signal needed
   here, without a `setState` inside an effect. Mirrors how
   `hooks/usePrefersReducedMotion.ts` reads its own snapshot-based value. */
const subscribeToNothing = () => () => {};
const hydrated = () => true;
const notHydrated = () => false;

/** `false` on the server and during hydration, `true` from the next render on. */
function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribeToNothing, hydrated, notHydrated);
}

/**
 * The sun/moon cross-fade (Animation_Guidelines §17: icon rotation plus a
 * cross-fade).
 *
 * `opacity`, `rotate`, and `scale` only — all compositor-only, no
 * layout-triggering property anywhere (Requirement 24.4, checked by
 * Property 21, which is why this object is named, exported, and registered in
 * `lib/motionVariantsRegistry.ts`). The outgoing icon rotates away and shrinks
 * as it fades while the incoming one arrives along the same path, so the pair
 * reads as one rotating swap rather than two independent fades.
 */
export const THEME_ICON_VARIANTS = {
  visible: { opacity: 1, rotate: 0, scale: 1 },
  hidden: { opacity: 0, rotate: -90, scale: 0.6 },
} satisfies Variants;

/** Cross-fade timing from the shared tokens (Requirement 24.2). */
export const THEME_ICON_TRANSITION: Transition = {
  duration: DURATION.standard,
  ease: EASING.out,
};

/** `duration: 0` — the swap still happens, it just is not animated. */
export const REDUCED_THEME_ICON_TRANSITION: Transition = { duration: 0 };

/**
 * Maps the binary reduced-motion signal onto one of exactly two transitions
 * (Requirement 24.5). Returns whole objects rather than merging fields, so a
 * partially-reduced third timing cannot exist.
 */
export function resolveThemeIconTransition(
  prefersReducedMotion: boolean,
): Transition {
  return prefersReducedMotion
    ? REDUCED_THEME_ICON_TRANSITION
    : THEME_ICON_TRANSITION;
}

interface ThemeIconProps {
  /** The theme this icon stands for. */
  iconTheme: Theme;
  /** The theme currently applied, or `DEFAULT_THEME` before hydration. */
  activeTheme: Theme;
  transition: Transition;
  /** The Lucide icon to render. */
  children: ReactNode;
}

/**
 * One layer of the cross-fade: an absolutely positioned icon that is either
 * shown or rotated out.
 *
 * `initial` is pinned to the `DEFAULT_THEME` state — the same value `animate`
 * has on the mount render — so mounting never animates and the server markup is
 * deterministic. Later theme changes move `animate` alone, which is what
 * produces the cross-fade.
 */
function ThemeIcon({
  iconTheme,
  activeTheme,
  transition,
  children,
}: ThemeIconProps) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="theme-toggle-icon"
      data-icon-theme={iconTheme}
      data-icon-state={themeIconState(iconTheme, activeTheme)}
      className="absolute inset-0 flex items-center justify-center"
      initial={themeIconState(iconTheme, DEFAULT_THEME)}
      animate={themeIconState(iconTheme, activeTheme)}
      variants={THEME_ICON_VARIANTS}
      transition={transition}
    >
      {children}
    </motion.span>
  );
}

export interface ThemeToggleProps {
  /**
   * Extra utilities merged onto the button; conflicting classes win (see `cn`).
   * Use it for placement inside the Navbar, not for geometry — the 44px touch
   * target comes from `Button`'s `icon` size.
   */
  className?: string;
}

/**
 * The theme toggle rendered in the Navbar (Requirement 3.5). See the module doc
 * for the animation, hydration, and accessibility decisions.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, isResolved } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isHydrated = useIsHydrated();

  const isThemeKnown = isHydrated && isResolved;
  const activeTheme = isThemeKnown ? theme : DEFAULT_THEME;
  const transition = resolveThemeIconTransition(prefersReducedMotion);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        isThemeKnown ? themeToggleLabel(theme) : PENDING_THEME_TOGGLE_LABEL
      }
      data-slot="theme-toggle"
      data-theme={isThemeKnown ? theme : undefined}
      className={cn("text-foreground", className)}
      onClick={() => {
        setTheme(nextTheme(theme));
      }}
    >
      {/* Fixed square that both icons stack inside, so switching themes cannot
          change the button's geometry (Requirement 24.4, no CLS). */}
      <span className="relative block size-5">
        <ThemeIcon
          iconTheme="dark"
          activeTheme={activeTheme}
          transition={transition}
        >
          <Moon className="size-5" />
        </ThemeIcon>
        <ThemeIcon
          iconTheme="light"
          activeTheme={activeTheme}
          transition={transition}
        >
          <Sun className="size-5" />
        </ThemeIcon>
      </span>
    </Button>
  );
}
