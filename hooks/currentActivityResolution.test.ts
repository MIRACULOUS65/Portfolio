import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { resolveCurrentActivity } from "@/hooks/useCurrentActivity";
import type { ActivityStatus, CurrentActivity } from "@/types";

const NUM_RUNS = 100;

/* -------------------------------------------------------------------------- */
/* Generators                                                                 */
/* -------------------------------------------------------------------------- */

const arbitraryActivityStatus: fc.Arbitrary<ActivityStatus> = fc.constantFrom(
  "Listening",
  "Coding",
  "Gaming",
  "Idle",
  "Offline",
);

/** An arbitrary well-formed `CurrentActivity`, parameterized by its source. */
function arbitraryActivity(
  source: CurrentActivity["source"],
): fc.Arbitrary<CurrentActivity> {
  return fc.record(
    {
      source: fc.constant(source),
      status: arbitraryActivityStatus,
      title: fc.string(),
      subtitle: fc.option(fc.string(), { nil: undefined }),
      icon: fc.string(),
      image: fc.option(fc.webUrl(), { nil: undefined }),
      updatedAt: fc
        .date({ noInvalidDate: true })
        .map((date) => date.toISOString()),
    },
    { requiredKeys: ["source", "status", "title", "icon", "updatedAt"] },
  );
}

/** A live Lanyard snapshot, or absent (fetch failed / not configured). */
const arbitraryLive: fc.Arbitrary<CurrentActivity | undefined> = fc.option(
  arbitraryActivity("lanyard"),
  { nil: undefined },
);

/** A configured static fallback, or absent (no fallback supplied). */
const arbitraryFallback: fc.Arbitrary<CurrentActivity | undefined> = fc.option(
  arbitraryActivity("static"),
  { nil: undefined },
);

// Feature: developer-portfolio, Property 6: Current Activity resolution
// favors live data, then fallback, then Offline
//
// For any combination of (live fetch: succeeds-with-status | fails | not
// configured) and (fallback: provided | absent), the resolved
// `CurrentActivity` equals the live status when the fetch succeeds, equals
// the provided fallback when the fetch fails or is not configured and a
// fallback exists, and equals the "Offline" default when neither a
// successful live fetch nor a fallback is available. The resolver never
// throws and never returns a null/undefined status.
//
// **Validates: Requirements 8.2, 8.3, 8.4**
describe("Property 6: current activity resolution favors live data, then fallback, then Offline", () => {
  it("returns live exactly whenever live is defined, regardless of fallback", () => {
    fc.assert(
      fc.property(
        arbitraryFallback,
        arbitraryActivity("lanyard"),
        (fallback, live) => {
          const result = resolveCurrentActivity(fallback, live);

          expect(result).toEqual(live);
          expect(result).toBe(live);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns fallback exactly when live is undefined and fallback is defined", () => {
    fc.assert(
      fc.property(arbitraryActivity("static"), (fallback) => {
        const result = resolveCurrentActivity(fallback, undefined);

        expect(result).toEqual(fallback);
        expect(result).toBe(fallback);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns the hard-coded Offline default when neither live nor fallback is defined", () => {
    const result = resolveCurrentActivity(undefined, undefined);

    expect(result.status).toBe("Offline");
    expect(result.source).toBe("static");
  });

  it("holds the full precedence and never throws or returns a null/undefined status, for any combination", () => {
    fc.assert(
      fc.property(arbitraryFallback, arbitraryLive, (fallback, live) => {
        let result!: CurrentActivity;

        expect(() => {
          result = resolveCurrentActivity(fallback, live);
        }).not.toThrow();

        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
        expect(result.status).not.toBeNull();
        expect(result.status).not.toBeUndefined();

        if (live !== undefined) {
          expect(result).toBe(live);
        } else if (fallback !== undefined) {
          expect(result).toBe(fallback);
        } else {
          expect(result.status).toBe("Offline");
          expect(result.source).toBe("static");
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
