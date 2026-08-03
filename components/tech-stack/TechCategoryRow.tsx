"use client";

import { useState } from "react";

import { resolveMarqueeDirection } from "@/components/tech-stack/marqueeDirection";
import { TechBadge } from "@/components/tech-stack/TechBadge";
import type { Technology } from "@/types";
import { cn } from "@/utils/cn";

/**
 * One category row of the TechStack marquee (Requirements 11.2–11.8,
 * Component_Specification §8, design.md "TechStackSection — Marquee Design").
 *
 * ## CSS-driven marquee, doubled track
 *
 * The badge list is rendered **twice**, back-to-back, inside a
 * `flex-nowrap`/`overflow-hidden` track. A CSS `@keyframes marquee` animation
 * (declared once, globally, in `styles/globals.css`) moves the doubled track
 * from `translateX(0)` to `translateX(-50%)` — exactly one badge-set width —
 * so the loop point is invisible and the animation never triggers layout
 * (`transform` only, Requirement 24.4). `overflow-hidden` plus `flex-nowrap`
 * guarantees the badges never wrap to a second line at any breakpoint
 * (Requirement 11.3, 11.8); narrower viewports adjust `--marquee-duration`
 * instead of the DOM layout, changing perceived speed without ever wrapping.
 *
 * ## Direction alternates by row index (Requirement 11.5)
 *
 * `resolveMarqueeDirection(rowIndex)` (the pure resolver, Property 12) decides
 * `"left"` vs `"right"`. Rather than mirroring the keyframes, the direction is
 * expressed as `animation-direction: reverse` on odd rows via the
 * `data-direction` attribute — the same `@keyframes marquee` definition drives
 * both, so there is exactly one keyframe rule to reason about.
 *
 * ## Hover pause is the only reason this is a Client Component
 *
 * The animation itself is pure CSS and never triggers a React re-render.
 * `onMouseEnter`/`onMouseLeave` toggle a `paused` boolean that maps to
 * `animation-play-state: paused` via a data attribute, so hovering pauses the
 * marquee and un-hovering resumes it smoothly from wherever it left off — CSS
 * animations pause/resume in place, they do not restart (Requirement 11.6).
 *
 * ## `prefers-reduced-motion`
 *
 * Handled entirely by a `@media (prefers-reduced-motion: reduce)` rule in
 * `styles/globals.css` that sets `animation-play-state: paused` on the track,
 * with no JS branch needed here (Requirement 24.5) — this component's own
 * hover-pause state composes with it rather than overriding it, since "paused"
 * from either source yields the same visual result.
 *
 * Purely presentational otherwise: no data fetching, no effects — `technology`
 * is a fully-resolved list the caller (`TechStackSection`) already filtered by
 * category.
 */
export interface TechCategoryRowProps {
  /** This row's category label, rendered as a visually-hidden heading for context. */
  category: string;
  /** The technologies belonging to this row's category. */
  technologies: readonly Technology[];
  /** 0-indexed position among the fixed set of rows; decides marquee direction. */
  rowIndex: number;
  /** Extra utilities merged onto the row; conflicting classes win (see `cn`). */
  className?: string;
}

export function TechCategoryRow({
  category,
  technologies,
  rowIndex,
  className,
}: TechCategoryRowProps) {
  const [isPaused, setIsPaused] = useState(false);
  const direction = resolveMarqueeDirection(rowIndex);

  return (
    <div
      data-slot="tech-category-row"
      data-direction={direction}
      data-paused={isPaused ? "true" : "false"}
      aria-label={`${category} technologies`}
      className={cn("relative w-full overflow-hidden", className)}
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        data-slot="tech-category-row-track"
        className="flex w-max flex-nowrap items-center gap-3 [animation-duration:var(--marquee-duration,30s)] [animation-iteration-count:infinite] [animation-name:marquee] [animation-timing-function:linear] motion-reduce:[animation-play-state:paused]"
        style={{
          animationDirection: direction === "right" ? "reverse" : "normal",
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {[...technologies, ...technologies].map((technology, index) => (
          <TechBadge
            key={`${technology.id}-${index < technologies.length ? "a" : "b"}`}
            technology={technology}
          />
        ))}
      </div>
    </div>
  );
}
