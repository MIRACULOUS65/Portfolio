"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DURATION } from "@/lib/motion";
import { cn } from "@/utils/cn";

/**
 * A small rotating-text display: cycles through a fixed list of phrases,
 * cross-fading (opacity only) from one to the next on a fixed interval and
 * looping forever.
 *
 * Used by the HeroSection's role pill (rotating role phrases) and by
 * `CurrentActivityCard` (rotating canned activity phrases while showing
 * static/fallback data).
 *
 * ## Cross-fade, opacity only (Requirement 24.4)
 *
 * `AnimatePresence mode="wait"` keyed by the current phrase's index
 * cross-fades the outgoing phrase out before the incoming one fades in —
 * the same pattern `ProjectDetails.tsx` uses for its panel swap. Only
 * `opacity` is animated, never a layout-affecting property.
 *
 * ## Reduced motion (Requirement 24.5)
 *
 * When `usePrefersReducedMotion()` reports `true`, this renders only the
 * first phrase, statically — no interval is started and no animation plays.
 *
 * ## Loops forever
 *
 * The internal index advances modulo `phrases.length` on every tick, so the
 * cycle repeats indefinitely for as long as this component stays mounted.
 *
 * Client Component: owns interval/animation state, both of which need the
 * browser.
 */
export interface RotatingTextProps {
  /** The phrases to cycle through, in order. Must be non-empty to render anything. */
  phrases: readonly string[];
  /** Milliseconds each phrase stays visible before crossfading to the next. Defaults to 1500ms. */
  intervalMs?: number;
  /** Extra utilities merged onto the wrapper; conflicting classes win (see `cn`). */
  className?: string;
}

export function RotatingText({
  phrases,
  intervalMs = 1500,
  className,
}: RotatingTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || phrases.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % phrases.length);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [prefersReducedMotion, phrases.length, intervalMs]);

  if (phrases.length === 0) {
    return null;
  }

  // Clamp defensively: if `phrases` shrinks while mounted, stay in range
  // rather than reading past the end of the array.
  const safeIndex = index % phrases.length;
  const current = phrases[safeIndex];

  if (prefersReducedMotion) {
    return (
      <span data-slot="rotating-text" className={cn("inline-block", className)}>
        {phrases[0]}
      </span>
    );
  }

  return (
    <span
      data-slot="rotating-text"
      className={cn("relative inline-block", className)}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={safeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast }}
          className="inline-block"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
