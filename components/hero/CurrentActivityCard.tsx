"use client";

import { useEffect, useState } from "react";
import {
  Code,
  Globe,
  icons as lucideIcons,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Card } from "@/components/shared/Card";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useCurrentActivity } from "@/hooks/useCurrentActivity";
import { DURATION } from "@/lib/motion";
import type { CurrentActivity } from "@/types";
import { cn } from "@/utils/cn";

/**
 * Canned icon+phrase pairs `CurrentActivityCard` rotates through whenever the
 * displayed activity is the static/fallback one (`activity.source ===
 * "static"`) rather than live Lanyard data. Each phrase is verb-prefixed,
 * Discord-Rich-Presence style ("Playing Valorant", not just "Valorant"), and
 * paired with the icon that matches it — rotating the icon and text together
 * rather than just the text, so the glyph never contradicts the verb.
 * Purely a demo/decorative rotation independent of the real live-data path —
 * if live data resolves, the card shows that instead and this rotation does
 * not apply.
 *
 * ## Real brand logos via the Simple Icons CDN
 *
 * "Playing Valorant" and "Listening to Spotify" render the real Valorant and
 * Spotify brand marks as plain `<img>` tags pointed at
 * `https://cdn.simpleicons.org/<slug>`, the same externally-hosted-image
 * pattern `GitHubContributionCard`'s `ghchart.rshah.org` embed and
 * `image-auto-slider.tsx`'s Unsplash images already establish in this
 * codebase. `simpleIconSlug` is `undefined` for an entry that keeps its
 * Lucide fallback instead (see below). Every CDN icon in this rotation
 * (and the GitHub/LinkedIn marks rendered elsewhere, e.g. `SocialLinks`)
 * is forced to monochrome via {@link BRAND_ICON_FILTER} rather than shown in
 * its native brand colour, so it reads as a neutral white/grey glyph against
 * the dark theme instead of a stray splash of green/black brand colour.
 *
 * `"Grinding VS Code"` keeps the neutral Lucide `Code` glyph: Simple Icons
 * ships no Visual Studio Code mark at all (the same trademark-driven gap
 * `lucide-react`'s own dropped brand icons already document elsewhere in this
 * file), so there is no CDN slug to point at for that entry.
 *
 * `"Browsing Portfolio"` replaces the earlier "Offline" entry (which itself
 * had replaced a literal "Discord" phrase) — this is a portfolio site, so a
 * neutral Lucide `Globe` glyph reads as "exploring this site" without
 * borrowing any other product's brand mark.
 */
const STATIC_ACTIVITY_PHRASES: ReadonlyArray<{
  /** Lucide fallback glyph, used when there is no `simpleIconSlug` at all. */
  readonly icon: LucideIcon;
  /** Simple Icons CDN slug for a real brand logo, when one exists. */
  readonly simpleIconSlug?: string;
  readonly text: string;
}> = [
  { icon: Code, simpleIconSlug: "valorant", text: "Playing Valorant" },
  { icon: Code, simpleIconSlug: "spotify", text: "Listening to Spotify" },
  { icon: Code, text: "Grinding VS Code" },
  { icon: Globe, text: "Browsing Portfolio" },
];

/**
 * CSS filter forcing a colour CDN icon (Simple Icons brand marks) to render
 * monochrome — grayscale, then brightened — so it reads as a neutral
 * white/grey glyph against this project's dark theme instead of its native
 * brand colour (e.g. Spotify green, GitHub's near-black mark). Applied via
 * inline `style` rather than Tailwind's `grayscale` utility alone, because
 * `grayscale` desaturates but does not lighten — a desaturated-but-still-dark
 * brand mark (GitHub's logo in particular) would stay hard to see against
 * `--background: #0a0a0a` without the accompanying brightness boost.
 */
const BRAND_ICON_FILTER = { filter: "grayscale(1) brightness(1.6)" } as const;

/** Milliseconds each static phrase stays visible before crossfading to the next. */
const ROTATION_INTERVAL_MS = 1500;

/**
 * The HeroSection's Current Activity widget (Requirements 7.3, 8.1, 8.3, 8.4,
 * 8.6, 26.9, Component_Specification §5, design.md § CurrentActivityWidget
 * Data-Fetching Design).
 *
 * ## Discord-style one-liner
 *
 * Matches Discord's Rich Presence style: a small platform icon on the left,
 * then a single line of verb+detail text ("Playing Valorant", "Grinding VS
 * Code") — never a wide box. The card caps its own width (`w-fit`) so it hugs
 * its content instead of stretching to fill its flex-1 layout slot.
 *
 * ## Client Component, and why only this one card is
 *
 * `useCurrentActivity` performs a client fetch against Lanyard on mount
 * (Requirement 8.6), so this card is the one Client boundary inside the
 * otherwise server-rendered `HeroSection`. It receives the server-computed
 * `fallback` snapshot as a prop rather than resolving one itself, so the very
 * first paint — before any client JS has run — already carries meaningful
 * content with no client-only data dependency.
 *
 * ## The `aria-busy` window (Requirement 26.9)
 *
 * `useCurrentActivity` always returns a defined `CurrentActivity` on every
 * render — `fallback`, or the hard-coded `"Offline"` default when `fallback`
 * is itself `undefined` — so there is no render where the card has literally
 * nothing to show. Requirement 26.9 still applies: until the very first
 * resolution of the async Lanyard fetch (success or failure) has occurred,
 * what is on screen is *provisional* fallback content that may be replaced.
 * That window is tracked by a `hasResolved` flag that starts `false` and is
 * flipped permanently `true` the first time this component re-renders with a
 * new `activity` value — which happens exactly once, whenever
 * `useCurrentActivity`'s internal fetch settles (whether or not it found live
 * data), because `resolveCurrentActivity` is otherwise a pure function of its
 * two arguments and neither changes again after mount.
 *
 * While `hasResolved` is `false`, the card sets `aria-busy="true"` silently —
 * no separate loading text is rendered alongside the one-liner, so nothing
 * clutters the Discord-style status bar. The fallback's own title stays
 * visible underneath the whole time, so a visitor never sees a blank card
 * while the fetch is in flight; `aria-busy` alone communicates the transient
 * state to assistive tech.
 *
 * Purely presentational otherwise: no data access beyond the hooks, no
 * effects beyond the local rotation timer for the static-phrase demo.
 */
export interface CurrentActivityCardProps {
  /**
   * The server-computed static fallback (`data/current-activity.ts`), passed
   * straight through to `useCurrentActivity`. May be `undefined`, in which
   * case the hook's hard-coded `"Offline"` default applies immediately.
   */
  fallback: CurrentActivity | undefined;
  /** Extra utilities merged onto the card; conflicting classes win (see `cn`). */
  className?: string;
}

export function CurrentActivityCard({
  fallback,
  className,
}: CurrentActivityCardProps) {
  const activity = useCurrentActivity(fallback);
  // Starts `false` on every mount (including hydration) and flips to `true`
  // exactly once, the first time a render observes a resolved activity value
  // — see the module doc above for why one flip is all this needs.
  const [hasResolved, setHasResolved] = useState(false);
  const [lastActivity, setLastActivity] = useState(activity);

  if (activity !== lastActivity) {
    setLastActivity(activity);
    setHasResolved(true);
  }

  const isLoading = !hasResolved;
  const isStatic = activity.source === "static";

  // Rotation index for the static-phrase demo. Lifted into local state here
  // (rather than inside `RotatingText`, which only exposes a text-cycling
  // `phrases` prop) so the icon and text advance together on every tick —
  // `RotatingText` itself is not used for this card; it renders string
  // phrases only and has no seam to swap an icon alongside the text.
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!isStatic || prefersReducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setPhraseIndex(
        (current) => (current + 1) % STATIC_ACTIVITY_PHRASES.length,
      );
    }, ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isStatic, prefersReducedMotion]);

  const safePhraseIndex = phraseIndex % STATIC_ACTIVITY_PHRASES.length;
  const currentPhrase = STATIC_ACTIVITY_PHRASES[safePhraseIndex]!;
  const label = isStatic ? currentPhrase.text : activity.title;
  // Keys the crossfade: the rotating index while showing static phrases (so
  // icon+text swap together on every tick), or a fixed key while showing live
  // data (which only ever changes once, on resolution).
  const swapKey = isStatic ? `static-${safePhraseIndex}` : "live";
  const iconClassName = "size-4 shrink-0 text-muted-foreground";
  const icon = isStatic
    ? renderStaticPhraseIcon(currentPhrase, iconClassName)
    : renderLiveIcon(activity.icon, iconClassName);

  return (
    <Card
      variant="flat"
      data-slot="current-activity-card"
      aria-busy={isLoading || undefined}
      className={cn(
        "w-fit max-w-fit flex-row items-center gap-1.5 px-2 py-1",
        className,
      )}
    >
      {prefersReducedMotion ? (
        <>
          {icon}
          <span className="text-body font-medium text-foreground">
            {label}
          </span>
        </>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={swapKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            className="inline-flex items-center gap-2"
          >
            {icon}
            <span className="text-body font-medium text-foreground">
              {label}
            </span>
          </motion.span>
        </AnimatePresence>
      )}
    </Card>
  );
}

/** Fallback glyph when a live activity's `icon` name does not resolve to a real export. */
const FALLBACK_LIVE_ICON: keyof typeof lucideIcons = "CircleOff";

/** Renders a fixed, already-imported Lucide icon component decoratively. */
function renderIcon(Icon: LucideIcon, className: string) {
  return <Icon aria-hidden="true" className={className} />;
}

/**
 * Renders a static-phrase entry's icon: the real Simple Icons brand logo via
 * an `<img>` when {@link STATIC_ACTIVITY_PHRASES} names a `simpleIconSlug`,
 * otherwise the entry's Lucide fallback (module doc above explains the "Grinding
 * VS Code" case, which has no Simple Icons mark at all). `aria-hidden` on both
 * paths, matching {@link renderIcon}, since the adjacent text already names the
 * activity.
 */
function renderStaticPhraseIcon(
  phrase: (typeof STATIC_ACTIVITY_PHRASES)[number],
  className: string,
) {
  if (phrase.simpleIconSlug !== undefined) {
    return (
      /* Third-party brand logo from cdn.simpleicons.org: not a local
         `public/` asset, same externally-hosted-image pattern as
         GitHubContributionCard's embed. Forced monochrome via
         `BRAND_ICON_FILTER` (module doc above) so the brand mark reads as a
         neutral glyph rather than its native brand colour. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://cdn.simpleicons.org/${phrase.simpleIconSlug}`}
        alt=""
        aria-hidden="true"
        className={className}
        style={BRAND_ICON_FILTER}
      />
    );
  }

  return renderIcon(phrase.icon, className);
}

/**
 * Resolves and renders a *live* Lanyard activity's icon name (`"Music"`,
 * `"Code"`, `"Gamepad2"`, `"Moon"`, `"CircleOff"` — see
 * `hooks/useCurrentActivity.ts`'s `ACTIVITY_PRESENTATION`) against the real
 * `lucide-react` icon set, falling back to a neutral glyph when the name does
 * not resolve. Only used for `source: "lanyard"` activities; the
 * static-phrase rotation above always renders its own fixed icon set instead
 * via {@link renderIcon}.
 */
function renderLiveIcon(iconName: string, className: string) {
  const Icon =
    (lucideIcons[iconName as keyof typeof lucideIcons] as
      | LucideIcon
      | undefined) ?? lucideIcons[FALLBACK_LIVE_ICON];

  return <Icon aria-hidden="true" className={className} />;
}
