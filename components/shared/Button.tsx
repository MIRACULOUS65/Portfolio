import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/utils/cn";

/**
 * Button geometry, tones, and interaction states (Design_System §10, §19,
 * Component_Specification §3, Animation_Guidelines §15).
 *
 * ## Transform-safe interaction (Requirement 24.4)
 *
 * Every animated state here touches **transform and opacity only**:
 *
 * - `hover:` changes colour utilities, which are paint-only.
 * - `active:scale-[0.98]` is the pressed feedback — a transform, exactly the
 *   0.98 scale Animation_Guidelines §15 asks for.
 * - `disabled:opacity-50` is the disabled treatment — opacity.
 * - The transition property list is enumerated explicitly instead of using
 *   `transition-all`, so no layout-triggering property (`width`, `height`,
 *   `top`, `left`, margin/padding) and no `box-shadow` can ever be animated,
 *   not even accidentally by a later edit. This is why this component does not
 *   build on `components/ui/button.tsx`, whose base class contains
 *   `transition-all` (see the note on `Button` below). `translate` and `scale`
 *   are named alongside `transform` because Tailwind v4 emits the standalone
 *   `translate:` / `scale:` properties rather than a composed `transform:`;
 *   they are the same compositor-only transforms, just addressed individually.
 * - Sizing (`h-*`, `px-*`, `size-*`) is static per size variant: no state
 *   changes a box dimension, so nothing here can trigger layout or CLS.
 *
 * Duration mirrors `DURATION.fast` (150ms) from `@/lib/motion` and easing
 * mirrors `EASING.out`; the tokens themselves are Framer Motion-shaped numbers,
 * while these states are pure CSS, so the CSS utilities are the mirror rather
 * than the source (Requirement 24.2, Design_System §10 "150–200ms").
 * `motion-reduce:` variants drop the transition and the press scale for
 * visitors who asked for reduced motion, while colour feedback — the essential
 * state signal — is preserved (Requirement 24.5).
 *
 * ## Alpha-modified colour tokens
 *
 * Solid variants tint their own background on hover (`hover:bg-primary/90`),
 * the same language `components/ui/button.tsx` uses, so the two button
 * implementations feel identical (Design_System §23). The modifier really does
 * composite even though the palette is mapped as `var(--token)` strings:
 * Tailwind v4 emits `color-mix(in oklab, var(--primary) 90%, transparent)`
 * inside an `@supports (color: color-mix(...))` block and keeps the bare
 * `var(--primary)` as the pre-`color-mix()` fallback for browsers without it.
 * `styles/globals.test.ts` asserts that from a real Tailwind compile, so the
 * behaviour cannot silently regress.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent font-medium whitespace-nowrap select-none",
    "transition-[transform,translate,scale,opacity,color,background-color,border-color] duration-150 ease-out will-change-transform",
    // Design_System §19: focus is always visible and never removed. The ring is
    // token-driven so it stays legible in both themes.
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "active:scale-[0.98]",
    // Covers both `disabled` and the loading state, which sets `disabled`.
    "disabled:pointer-events-none disabled:opacity-50",
    "motion-reduce:transition-none motion-reduce:active:scale-100",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      // `size` is declared before `variant` so the `link` variant's own
      // padding/height reset (in `compoundVariants`) is emitted last and wins.
      size: {
        sm: "h-9 gap-1.5 px-3 text-small",
        // 44px — the minimum touch target from Design_System §21, so the
        // default button is finger-friendly on mobile with no override.
        md: "h-11 px-5 text-small",
        lg: "h-12 px-6 text-body",
        icon: "size-11 p-0",
      },
      variant: {
        // Solid surfaces tint their own background on hover — a paint-only
        // `background-color` change, already on the transition list above.
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border-border bg-transparent text-foreground hover:border-muted-foreground hover:bg-accent hover:text-accent-foreground",
        ghost:
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        // Text-only affordance: no box, no press scale, and an underline on
        // hover (text-decoration is paint-only, per Animation_Guidelines §16).
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        class: "h-auto rounded-sm px-0 py-0 active:scale-100",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>["variant"]
>;

export type ButtonSize = NonNullable<
  VariantProps<typeof buttonVariants>["size"]
>;

type ButtonOwnProps = {
  /** Label, and optionally Lucide icons, rendered inside the button. */
  children?: ReactNode;
  /** Visual tone. Defaults to `primary`. */
  variant?: ButtonVariant;
  /**
   * Marks the action as in flight: renders a spinner, sets `aria-busy`, and
   * disables the button so the action cannot be triggered twice.
   */
  loading?: boolean;
  /** Extra utilities merged onto the button; conflicting classes win (see `cn`). */
  className?: string;
};

/**
 * Accessibility guard enforced by the type system (audited in task 44.3): an
 * icon-only button has no text node to name it, so `size="icon"` requires an
 * explicit `aria-label`. Every other size names itself from `children`, where
 * `aria-label` stays optional.
 */
type ButtonSizeProps =
  | { size?: Exclude<ButtonSize, "icon">; "aria-label"?: string }
  | { size: "icon"; "aria-label": string };

export type ButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-label" | "children" | "className"
> &
  ButtonOwnProps &
  ButtonSizeProps;

/**
 * The design-system button: the one place the site's button language — variants
 * `primary | secondary | outline | ghost | link`, the default/hover/active/
 * focus/disabled/loading states, sizing, and focus treatment — is defined
 * (Design_System §10, §23 "all reusable components share hover language, focus
 * behavior, transition timing").
 *
 * **Standalone, not a wrapper around `components/ui/button.tsx`.** The shadcn
 * primitive exists for the overlay/interactive primitives that depend on it
 * (Requirement 1.5) and is what `EmptyState`/`ErrorState` currently compose,
 * but it is deliberately not the base here for two reasons: its variant set is
 * shadcn's (`default | destructive | ...`) rather than the spec's, and its base
 * class animates with `transition-all`, which would put `box-shadow` and box
 * dimensions on the animated property list and violate Requirement 24.4.
 * Keeping this component standalone means the design-system contract is
 * enumerated in one file and cannot drift when the primitive is regenerated.
 * (Follow-up, intentionally out of scope for this task: migrate
 * `EmptyState`/`ErrorState` from `ui/button`'s `buttonVariants` onto this one.)
 *
 * **Icons** come from Lucide React, the project's exclusive icon library
 * (Requirement 1.6) — both the built-in loading spinner and any icon passed as
 * a child, which the base class sizes and makes non-interactive automatically.
 *
 * **Rendering a link that looks like a button**: compose `buttonVariants` with
 * `next/link` (`className={buttonVariants({ variant: "outline" })}`) rather
 * than nesting an anchor in a button. `ExploreMoreButton` is the shared
 * component that does this for cross-route navigation.
 *
 * Server Component: all six states are expressed in CSS (`hover:`, `active:`,
 * `focus-visible:`, `disabled:`) and the loading state is driven by a prop, so
 * nothing here needs `"use client"`. Callers that attach an `onClick` handler
 * supply their own Client Component boundary.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || loading;

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      type={type}
      disabled={isDisabled}
      // Announces "busy" without changing the accessible name, so the label a
      // caller passed still identifies the action while it is in flight.
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        // Essential state feedback, so it keeps spinning under reduced motion
        // (Requirement 24.5); `animate-spin` is a transform-only animation.
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : null}
      {/* An icon-only button shows the spinner in place of its icon rather than
          beside it, so its square footprint never changes (Requirement 24.4). */}
      {loading && size === "icon" ? null : children}
    </button>
  );
}

export { buttonVariants };
