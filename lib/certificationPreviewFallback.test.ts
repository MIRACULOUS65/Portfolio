import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";

import { certifications } from "@/data/certifications";
import {
  getAllCertifications,
  getFeaturedCertifications,
} from "@/lib/data-access";
import type { Certification } from "@/types";

const NUM_RUNS = 100;

/**
 * Property 13 for `getFeaturedCertifications` in `lib/data-access.ts`.
 *
 * ## The contract asserted here, exactly as the module documents it
 *
 * The fallback is gated on the featured group being **empty**, not on it being
 * *smaller than* `cap`:
 *
 * - at least one `featured: true` entry → the result is drawn **entirely** from
 *   the featured group, even when that yields fewer than `cap` entries;
 * - zero featured entries → the result is drawn entirely from the non-featured
 *   group;
 * - empty dataset → `[]`.
 *
 * Never a mix of the two groups, and never a duplicate — the two groups are a
 * boolean partition of a dataset whose ids are unique, so disjointness is
 * structural. Ordering is `issueDate` **descending**, ties broken by `id`
 * ascending, and nothing is compared against the current date. `cap` is coerced
 * rather than rejected: non-finite falls back to the documented default of `3`,
 * anything else is floored and clamped to `>= 0`, so `cap === 0` yields `[]` and
 * a `cap` above the group size yields the whole group, never padded.
 *
 * A "top-up" reading — short featured group filled out from the non-featured one
 * — is deliberately *not* the contract, and this file asserts against the real
 * one.
 *
 * ## How the zero-featured branch is reached
 *
 * `data/certifications.ts` always has featured entries (4 of 7), so calling the
 * shipped selector can never reach the fallback: that half of the property would
 * be untestable against the real dataset. Rather than restate the rule as a
 * second implementation and test *that* — which would prove only that the copy
 * agrees with itself — the generated-dataset properties below inject the
 * generated `Certification[]` into the module the selector reads
 * (`@/data/certifications`) and re-import `lib/data-access`, so the **real**
 * `getFeaturedCertifications` runs over datasets with some / all / no featured
 * entries and over an empty one. No selector logic is duplicated anywhere in
 * this file; only the dataset is substituted.
 *
 * The shipped dataset (`data/certifications.ts`) now holds three real
 * certifications, all `featured: true` — there is no non-featured shipped
 * entry left to pin a "forgotten `featured` filter" regression against, so
 * that observable-detail check lives only in the generated-dataset property
 * below, which can still construct a mixed dataset on demand.
 *
 * **Validates: Requirements 12.1, 12.2**
 */

/** The selector's documented default `cap`, and the fallback for a non-finite one. */
const DEFAULT_CAP = 3;

/** Budget for the property that re-imports the module graph on every run. */
const INJECTION_TEST_TIMEOUT_MS = 30_000;

/* -------------------------------------------------------------------------- */
/*                          The documented cap rule                           */
/* -------------------------------------------------------------------------- */

/**
 * The module's clamping rule, restated so expected lengths are *derived* rather
 * than hardcoded: non-finite → the documented default, otherwise floored and
 * clamped to `>= 0`.
 *
 * This is arithmetic on the argument, not a reimplementation of the selection
 * rule — which group is drawn from, in what order, is never computed here.
 */
function effectiveCap(cap: number): number {
  return Number.isFinite(cap) ? Math.max(0, Math.floor(cap)) : DEFAULT_CAP;
}

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/**
 * Caps spanning every branch of the clamping rule: in-range and out-of-range
 * integers, `0`, negatives, fractions (including negative fractions, which floor
 * *away* from zero onto the clamp), and the three non-finite values.
 */
const arbitraryCap: fc.Arbitrary<number> = fc.oneof(
  {
    arbitrary: fc.integer({ min: -4, max: certifications.length + 4 }),
    weight: 4,
  },
  { arbitrary: fc.double({ min: -4, max: 12, noNaN: true }), weight: 2 },
  {
    arbitrary: fc.constantFrom(
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      0,
      -0,
      0.5,
      -0.5,
      Number.MAX_SAFE_INTEGER,
    ),
    weight: 1,
  },
);

/**
 * `issueDate` values drawn mostly from a small pool, so *ties* are common and
 * the `id` tie-break is actually exercised instead of being a dead branch.
 */
const arbitraryIssueDate: fc.Arbitrary<string> = fc.oneof(
  {
    arbitrary: fc.constantFrom(
      "2019-07-14",
      "2022-08-17",
      "2024-03-12",
      "2025-01-30",
    ),
    weight: 3,
  },
  {
    arbitrary: fc
      .date({
        min: new Date("2000-01-01T00:00:00.000Z"),
        max: new Date("2035-12-31T00:00:00.000Z"),
        noInvalidDate: true,
      })
      .map((date) => date.toISOString().slice(0, 10)),
    weight: 1,
  },
);

/**
 * A dataset with unique ids — the precondition that makes "no duplicates"
 * structural — and `featured` supplied by the caller so each branch of the
 * property gets a generator that reliably reaches it.
 */
function arbitraryDataset(
  featured: fc.Arbitrary<boolean>,
): fc.Arbitrary<readonly Certification[]> {
  return fc
    .uniqueArray(
      fc.record({
        index: fc.nat({ max: 99 }),
        issueDate: arbitraryIssueDate,
        featured,
      }),
      { minLength: 1, maxLength: 8, selector: (entry) => entry.index },
    )
    .map((entries) =>
      entries.map((entry) => ({
        id: `cert-${entry.index}`,
        title: `Certification ${entry.index}`,
        issuer: `Issuer ${entry.index}`,
        issueDate: entry.issueDate,
        badgeImage: `/images/certifications/cert-${entry.index}.svg`,
        technologies: [],
        featured: entry.featured,
      })),
    );
}

/**
 * All four dataset shapes Property 13 names: random flags, all featured, none
 * featured, and entirely empty.
 */
const arbitraryCertificationDataset: fc.Arbitrary<readonly Certification[]> =
  fc.oneof(
    { arbitrary: arbitraryDataset(fc.boolean()), weight: 4 },
    { arbitrary: arbitraryDataset(fc.constant(false)), weight: 3 },
    { arbitrary: arbitraryDataset(fc.constant(true)), weight: 2 },
    { arbitrary: fc.constant<readonly Certification[]>([]), weight: 1 },
  );

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/**
 * Runs the **real** selector over a substituted dataset: reset the registry,
 * point `@/data/certifications` at the generated entries, re-import
 * `lib/data-access`. The selector code under test is the shipped one.
 */
async function selectOverDataset(
  dataset: readonly Certification[],
  cap: number,
): Promise<readonly Certification[]> {
  vi.resetModules();
  vi.doMock("@/data/certifications", () => ({ certifications: [...dataset] }));

  const { getFeaturedCertifications: select } =
    await import("@/lib/data-access");

  return select(cap);
}

/** `issueDate` descending, ties broken by `id` ascending — the total order. */
function expectOrderedByRecency(preview: readonly Certification[]): void {
  for (let index = 1; index < preview.length; index += 1) {
    const previous = preview[index - 1]!;
    const current = preview[index]!;

    expect(previous.issueDate >= current.issueDate).toBe(true);

    if (previous.issueDate === current.issueDate) {
      expect(previous.id < current.id).toBe(true);
    }
  }
}

function expectNoDuplicates(preview: readonly Certification[]): void {
  expect(new Set(preview.map((entry) => entry.id)).size).toBe(preview.length);
  expect(new Set(preview).size).toBe(preview.length);
}

/* -------------------------------------------------------------------------- */
/*                                 Property 13                                */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 13: Certification preview prefers
// featured, falls back to non-featured
//
// For any generated `Certification[]` dataset with random `featured` flags
// (including zero, some, or all featured, and including an entirely empty
// dataset): when at least one featured certification exists, the preview
// selection consists entirely of featured entries (up to the preview cap); when
// none are featured but at least one certification exists, the preview selection
// is a non-empty subset of non-featured entries; when the dataset itself is
// empty, the preview selection is empty.
//
// **Validates: Requirements 12.1, 12.2**
describe("Property 13: certification preview prefers featured, falls back to non-featured", () => {
  afterEach(() => {
    vi.doUnmock("@/data/certifications");
    vi.resetModules();
  });

  it(
    "draws entirely from one group — featured when any exists, non-featured otherwise, nothing when the dataset is empty",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryCertificationDataset,
          arbitraryCap,
          async (dataset, cap) => {
            const preview = await selectOverDataset(dataset, cap);

            const featured = dataset.filter((entry) => entry.featured);
            const nonFeatured = dataset.filter((entry) => !entry.featured);
            const group = featured.length > 0 ? featured : nonFeatured;
            const limit = effectiveCap(cap);

            // The empty dataset has no group to draw from.
            if (dataset.length === 0) {
              expect(preview).toEqual([]);
            }

            // One group or the other, never a mix: every entry carries the
            // `featured` value of whichever group won.
            for (const entry of preview) {
              expect(entry.featured).toBe(featured.length > 0);
              expect(group).toContain(entry);
            }

            // Whichever group won, the cap — not a top-up — decides the length.
            expect(preview).toHaveLength(Math.min(limit, group.length));

            // Property 13's non-empty clause. `cap === 0` is the documented
            // exception: it asks for nothing and gets nothing.
            if (group.length > 0 && limit > 0) {
              expect(preview.length).toBeGreaterThan(0);
            }

            expectNoDuplicates(preview);
            expectOrderedByRecency(preview);
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it("returns only featured entries from the shipped dataset, for any cap", () => {
    const featured = certifications.filter((entry) => entry.featured);

    // Guards the premise: this clause is only meaningful while the shipped
    // dataset actually curates something.
    expect(featured.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(arbitraryCap, (cap) => {
        const preview = getFeaturedCertifications(cap);

        for (const entry of preview) {
          expect(entry.featured).toBe(true);
        }

        expect(preview).toHaveLength(
          Math.min(effectiveCap(cap), featured.length),
        );
        expectNoDuplicates(preview);
        expectOrderedByRecency(preview);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns canonical dataset records — a subset of getAllCertifications(), never clones", () => {
    fc.assert(
      fc.property(arbitraryCap, (cap) => {
        const preview = getFeaturedCertifications(cap);
        const all = getAllCertifications();

        for (const entry of preview) {
          const canonical = all.find((candidate) => candidate.id === entry.id);

          expect(canonical).toBeDefined();
          expect(entry).toBe(canonical);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is total — no cap throws, and every result is drawn from the shipped dataset", () => {
    fc.assert(
      fc.property(arbitraryCap, (cap) => {
        expect(() => getFeaturedCertifications(cap)).not.toThrow();

        const preview = getFeaturedCertifications(cap);
        const shippedIds = new Set(certifications.map((entry) => entry.id));

        for (const entry of preview) {
          expect(shippedIds.has(entry.id)).toBe(true);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
