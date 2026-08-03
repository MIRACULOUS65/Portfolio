import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { ACTIVITY_PRESENTATION } from "@/hooks/useCurrentActivity";
import type { ActivityStatus } from "@/types";

const NUM_RUNS = 100;

/* -------------------------------------------------------------------------- */
/* Generators                                                                 */
/* -------------------------------------------------------------------------- */

const ALL_ACTIVITY_STATUSES: readonly ActivityStatus[] = [
  "Listening",
  "Coding",
  "Gaming",
  "Idle",
  "Offline",
];

const arbitraryActivityStatus: fc.Arbitrary<ActivityStatus> = fc.constantFrom(
  ...ALL_ACTIVITY_STATUSES,
);

// Feature: developer-portfolio, Property 7: Every activity status has defined
// presentation
//
// For any of the five `ActivityStatus` enum values, looking up its
// presentation (icon, title, subtitle) returns a fully defined, non-empty
// result.
//
// **Validates: Requirements 8.5**
describe("Property 7: every activity status has defined presentation", () => {
  it("has a defined ACTIVITY_PRESENTATION entry with non-empty icon and title for any ActivityStatus", () => {
    fc.assert(
      fc.property(arbitraryActivityStatus, (status) => {
        const presentation = ACTIVITY_PRESENTATION[status];

        expect(presentation).toBeDefined();
        expect(typeof presentation.icon).toBe("string");
        expect(presentation.icon.trim()).not.toBe("");
        expect(typeof presentation.title).toBe("string");
        expect(presentation.title.trim()).not.toBe("");
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("covers exactly the five ActivityStatus values, no missing and no extra", () => {
    const keys = Object.keys(ACTIVITY_PRESENTATION);

    expect(keys).toHaveLength(ALL_ACTIVITY_STATUSES.length);
    expect(keys.sort()).toEqual([...ALL_ACTIVITY_STATUSES].sort());

    for (const status of ALL_ACTIVITY_STATUSES) {
      expect(Object.prototype.hasOwnProperty.call(ACTIVITY_PRESENTATION, status)).toBe(
        true,
      );
    }
  });
});
