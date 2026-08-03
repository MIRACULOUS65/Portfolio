import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_REVEAL_MOTION,
  REDUCED_REVEAL_MOTION,
  resolveRevealMotion,
  type RevealMotionConfig,
} from "@/components/shared/RevealOnView";
import { resolvePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const NUM_RUNS = 100;

/** The complete, closed set of configurations the resolver may hand back. */
const ALL_MOTION_CONFIGS: readonly RevealMotionConfig[] = [
  DEFAULT_REVEAL_MOTION,
  REDUCED_REVEAL_MOTION,
];

/**
 * Everything a host environment (or a JS caller, or JSON) could realistically
 * hand to `resolvePrefersReducedMotion`: the two declared booleans, the
 * "no preference known" shapes, truthy look-alikes of `true` that must NOT be
 * treated as an explicit preference, and unconstrained junk.
 */
const arbitraryMotionSignal: fc.Arbitrary<unknown> = fc.oneof(
  fc.boolean(),
  fc.constantFrom(
    null,
    undefined,
    "true",
    "reduce",
    "",
    1,
    0,
    NaN,
    Number.POSITIVE_INFINITY,
  ),
  fc.anything(),
);

/** Style keys that would make the reduced reveal move rather than just appear. */
const MOVEMENT_KEYS = [
  "y",
  "x",
  "scale",
  "rotate",
  "transform",
  "translateX",
  "translateY",
  "width",
  "height",
  "top",
  "left",
  "boxShadow",
];

function variantStates(config: RevealMotionConfig): Record<string, unknown>[] {
  return Object.values(config.variants as Record<string, unknown>).filter(
    (state): state is Record<string, unknown> =>
      typeof state === "object" && state !== null,
  );
}

// Feature: developer-portfolio, Property 22: Reduced-motion resolution is
// strictly binary
//
// For any boolean `prefers-reduced-motion` signal, the resolved animation
// configuration equals exactly the predefined "reduced" configuration when the
// signal is `true` and exactly the predefined "default" configuration when the
// signal is `false`; no third, partially-mixed configuration is ever produced.
//
// **Validates: Requirements 24.5**
describe("Property 22: reduced-motion resolution is strictly binary", () => {
  it("resolvePrefersReducedMotion collapses any signal to a boolean, true only for an explicit true", () => {
    fc.assert(
      fc.property(arbitraryMotionSignal, (signal) => {
        const resolved = resolvePrefersReducedMotion(
          signal as boolean | null | undefined,
        );

        // Strictly binary: never null, never undefined, never a tri-state.
        expect(typeof resolved).toBe("boolean");
        expect(resolved === true || resolved === false).toBe(true);

        // Only an explicit `true` counts as an opt-in (Requirement 24.5:
        // visitors without an explicit preference keep default behavior).
        expect(resolved).toBe(signal === true);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("resolveRevealMotion returns one of exactly two predefined configs, by reference", () => {
    fc.assert(
      fc.property(fc.boolean(), (prefersReducedMotion) => {
        const config = resolveRevealMotion(prefersReducedMotion);

        // Identity, not deep equality: a future field-merge refactor that
        // builds a fresh (possibly partially-mixed) object must fail here.
        expect(config).toBe(
          prefersReducedMotion ? REDUCED_REVEAL_MOTION : DEFAULT_REVEAL_MOTION,
        );
        expect(ALL_MOTION_CONFIGS).toContain(config);

        // The two halves are never crossed over.
        expect(config.variants).toBe(
          prefersReducedMotion
            ? REDUCED_REVEAL_MOTION.variants
            : DEFAULT_REVEAL_MOTION.variants,
        );
        expect(config.transition).toBe(
          prefersReducedMotion
            ? REDUCED_REVEAL_MOTION.transition
            : DEFAULT_REVEAL_MOTION.transition,
        );
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("the reduced configuration is an instant opacity change with no movement", () => {
    fc.assert(
      fc.property(arbitraryMotionSignal, (signal) => {
        const prefersReducedMotion = resolvePrefersReducedMotion(
          signal as boolean | null | undefined,
        );
        const config = resolveRevealMotion(prefersReducedMotion);

        if (!prefersReducedMotion) {
          expect(config).toBe(DEFAULT_REVEAL_MOTION);
          return;
        }

        expect(config).toBe(REDUCED_REVEAL_MOTION);
        expect(config.transition).toMatchObject({ duration: 0 });

        const states = variantStates(config);
        expect(states.length).toBeGreaterThan(0);
        for (const state of states) {
          expect(Object.keys(state)).toEqual(["opacity"]);
          for (const key of MOVEMENT_KEYS) {
            expect(state).not.toHaveProperty(key);
          }
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("the set of distinct resolved configurations has cardinality exactly two", () => {
    fc.assert(
      fc.property(
        // Arbitrary signals, plus one guaranteed opt-in and one guaranteed
        // default, so the observed cardinality must be exactly 2 — never 1
        // (a collapsed resolver) and never 3+ (a mixed config).
        fc
          .array(arbitraryMotionSignal, { maxLength: 40 })
          .map((signals) => [...signals, true as unknown, false as unknown]),
        (signals) => {
          const preferences = signals.map((signal) =>
            resolvePrefersReducedMotion(signal as boolean | null | undefined),
          );
          const configs = new Set(preferences.map(resolveRevealMotion));

          expect(configs.size).toBe(2);
          expect(new Set(preferences).size).toBe(2);
          for (const config of configs) {
            expect(ALL_MOTION_CONFIGS).toContain(config);
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
