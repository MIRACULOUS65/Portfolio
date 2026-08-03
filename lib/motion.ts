/**
 * Centralized motion tokens (Requirement 24.2, Animation_Guidelines §4–5).
 *
 * Every animated component imports these instead of inlining raw numbers so
 * comparable interactions share identical timing and easing. Values are plain
 * constants with no runtime dependency, but are shaped for direct use in a
 * Framer Motion `transition` object.
 */

/** Cubic-bezier control points in Framer Motion's `[x1, y1, x2, y2]` order. */
export type CubicBezier = [number, number, number, number];

/**
 * Durations in **seconds** (Framer Motion's unit): 150ms / 250ms / 350ms.
 *
 * - `fast` — hover and other immediate feedback
 * - `standard` — state changes, cross-fades (kept ≤300ms)
 * - `slow` — entrance and page-level reveals
 */
export const DURATION = {
  fast: 0.15,
  standard: 0.25,
  slow: 0.35,
} as const;

/**
 * Easing curves.
 *
 * - `out` — default/entrance curve, `cubic-bezier(0.16, 1, 0.3, 1)`
 * - `inOut` — interactive, reversible transitions
 */
export const EASING = {
  out: [0.16, 1, 0.3, 1] as CubicBezier,
  inOut: "easeInOut",
} as const;

/** Token names, e.g. `"fast" | "standard" | "slow"`. */
export type DurationToken = keyof typeof DURATION;

/** Token names, e.g. `"out" | "inOut"`. */
export type EasingToken = keyof typeof EASING;
