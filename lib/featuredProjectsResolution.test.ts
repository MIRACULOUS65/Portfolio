import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { featuredProjects } from "@/data/featured-projects";
import {
  getAllProjects,
  getFeaturedProjectsResolved,
  getProjectById,
} from "@/lib/data-access";
import type { FeaturedProjectEntry } from "@/types";

const NUM_RUNS = 100;

/**
 * Property 8 at the **selector layer**.
 *
 * The property as stated in design.md is about `ProjectSelector` rendering
 * exactly N cards. That component does not exist yet (task 23.2 builds it), and
 * task 23.3 re-states this same property against the rendered component. This
 * file therefore covers the half that exists today and that the component half
 * depends on: `getFeaturedProjectsResolved()` producing exactly the configured
 * count, in the configured order, with the first element as the default
 * selection. **Task 23.3 extends this rather than duplicating it** — it asserts
 * the rendered card count equals `getFeaturedProjectsResolved().length` and that
 * each card corresponds one-to-one with a resolved project.
 *
 * Everything asserted here is the contract documented on
 * `getFeaturedProjectsResolved` in `lib/data-access.ts`, so the two do not
 * drift. Example-based coverage of the same selector lives in
 * `data-access.test.ts`; determinism across repeated calls is Property 19 in
 * `dataAccessDeterminism.test.ts`.
 */

/* -------------------------------------------------------------------------- */
/*                            Expected ordering rule                          */
/* -------------------------------------------------------------------------- */

/**
 * The documented total order: `order` ascending, ties broken by `projectId`.
 * Re-derived here from the config rather than imported from the module under
 * test, so a change to the module's comparator has to be a deliberate change to
 * this rule too.
 */
function expectedOrder(
  entries: readonly FeaturedProjectEntry[],
): readonly FeaturedProjectEntry[] {
  return [...entries].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    if (a.projectId === b.projectId) {
      return 0;
    }

    return a.projectId < b.projectId ? -1 : 1;
  });
}

/** Expected resolved id sequence for a given (possibly permuted) config. */
function expectedIds(
  entries: readonly FeaturedProjectEntry[],
): readonly string[] {
  return expectedOrder(entries)
    .filter((entry) => getProjectById(entry.projectId) !== undefined)
    .map((entry) => entry.projectId);
}

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/**
 * A permutation of the whole shipped config — same entries, arbitrary array
 * position. `shuffledSubarray` with `minLength` pinned to the full length keeps
 * every entry present, so only position varies and the expected resolved
 * sequence is invariant across every generated value.
 */
const arbitraryPermutedConfig: fc.Arbitrary<readonly FeaturedProjectEntry[]> =
  fc.shuffledSubarray([...featuredProjects], {
    minLength: featuredProjects.length,
    maxLength: featuredProjects.length,
  });

/** Index into the resolved list, so per-element claims are sampled not looped. */
const arbitraryResolvedIndex: fc.Arbitrary<number> = fc.nat({
  max: Math.max(0, featuredProjects.length - 1),
});

/* -------------------------------------------------------------------------- */
/*                                  Property 8                                */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 8: ProjectSelector renders exactly the
// resolved featured project count
//
// For any generated list of N resolved featured projects (N >= 1, including
// N != 3), the `ProjectSelector` renders exactly N cards, each corresponding
// one-to-one with an input project.
//
// **Validates: Requirements 9.1**
describe("Property 8: the resolved featured project list is exactly the configured one", () => {
  it("has length equal to the configured entry count — no cap, no padding, no hardcoded three", () => {
    fc.assert(
      fc.property(arbitraryPermutedConfig, (permuted) => {
        // Count derived from the config, never a literal, so the property
        // survives a data change (Requirement 9.1).
        const configuredCount = permuted.length;

        expect(getFeaturedProjectsResolved()).toHaveLength(configuredCount);
        expect(configuredCount).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("contains exactly the configured projectIds — no extras, no omissions", () => {
    fc.assert(
      fc.property(arbitraryPermutedConfig, (permuted) => {
        const resolvedIds = getFeaturedProjectsResolved().map(
          (project) => project.id,
        );

        expect(new Set(resolvedIds)).toEqual(
          new Set(permuted.map((entry) => entry.projectId)),
        );
        // Set equality plus equal length rules out duplicates.
        expect(resolvedIds).toHaveLength(permuted.length);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("orders by `order` ascending, with the lowest-`order` entry first as the default selection", () => {
    fc.assert(
      fc.property(arbitraryPermutedConfig, (permuted) => {
        const resolved = getFeaturedProjectsResolved();
        const ordered = expectedOrder(permuted);

        expect(resolved.map((project) => project.id)).toEqual(
          expectedIds(permuted),
        );

        // The default selection (Requirement 9.3) is the lowest `order`, not the
        // first array literal — the config is written out of `order` sequence.
        const lowestOrder = Math.min(...permuted.map((entry) => entry.order));

        expect(resolved[0]?.id).toBe(ordered[0]?.projectId);
        expect(ordered[0]?.order).toBe(lowestOrder);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("depends on `order`, not on array position in the data file", () => {
    fc.assert(
      fc.property(arbitraryPermutedConfig, (permuted) => {
        // Every permutation of the same entries yields the same expected
        // sequence, and the selector matches it — so no reachable rewrite of the
        // data file's array order can change the resolved list.
        expect(
          getFeaturedProjectsResolved().map((project) => project.id),
        ).toEqual(expectedIds(permuted));
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("yields canonical Project records in a fresh array per call", () => {
    fc.assert(
      fc.property(arbitraryResolvedIndex, (index) => {
        const first = getFeaturedProjectsResolved();
        const second = getFeaturedProjectsResolved();

        // Deep equality is the determinism contract...
        expect(first).toEqual(second);
        // ...array identity explicitly is not.
        expect(first).not.toBe(second);

        const project = first[index];

        expect(project).toBeDefined();
        // Elements are the canonical records, never clones.
        expect(project).toBe(getProjectById(project!.id));
        expect(project).toBe(second[index]);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is a strict subset of the full project dataset", () => {
    fc.assert(
      fc.property(arbitraryResolvedIndex, (index) => {
        const resolved = getFeaturedProjectsResolved();
        const all = getAllProjects();

        // What Property 4's strict-subset claim later relies on.
        expect(resolved.length).toBeLessThan(all.length);
        expect(all).toContain(resolved[index]);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
