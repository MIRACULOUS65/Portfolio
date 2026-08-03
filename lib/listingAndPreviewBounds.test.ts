import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";

import { certifications } from "@/data/certifications";
import { education } from "@/data/education";
import { hackathons } from "@/data/hackathons";
import {
  getAllCertifications,
  getAllHackathons,
  getEducationSortedByDate,
  getHackathonsPreview,
} from "@/lib/data-access";
import type { Certification, Education, Hackathon } from "@/types";

const NUM_RUNS = 100;

/**
 * Property 14 for the three "how many/what order" selectors in
 * `lib/data-access.ts`: {@link getHackathonsPreview} (a capped preview),
 * {@link getAllHackathons} / {@link getAllCertifications} (uncapped
 * full-listing pages), and {@link getEducationSortedByDate} (a chronological,
 * uncapped section).
 *
 * ## Why datasets are injected rather than only checked against the shipped one
 *
 * The property statement is written over "any generated dataset", but every
 * selector here closes over a static `data/*.ts` module — there is no
 * parameter to pass a dataset through. Following the pattern already
 * established in `certificationPreviewFallback.test.ts`, the generated
 * dataset is substituted into the module graph (`vi.doMock` + a fresh
 * `import("@/lib/data-access")` per run) so the **real**, shipped selector
 * code runs over datasets the fixture files cannot exercise on their own —
 * including the empty-dataset edge case for the two full-listing selectors,
 * and duplicate/tied `startDate`s for Education. Shipped-dataset checks are
 * kept alongside as fast, non-mocked sanity checks.
 *
 * ## The three clauses, exactly as documented on each selector
 *
 * - **Capped preview** ({@link getHackathonsPreview}): the result never
 *   exceeds the effective `cap` (after {@link normalizeCount}-style clamping)
 *   and never exceeds the dataset size — whichever is smaller wins, and
 *   `cap` is not a floor.
 * - **Uncapped full listing** ({@link getAllHackathons},
 *   {@link getAllCertifications}): no slice is ever applied, so the result
 *   length always equals the dataset size exactly, for any dataset size
 *   including zero.
 * - **Chronological section** ({@link getEducationSortedByDate}): the result
 *   is a total order by `startDate` — descending, per the convention pinned
 *   in that selector's doc comment (ties broken by `id` ascending) — and that
 *   order (and the resulting id sequence) does not depend on the order the
 *   entries were supplied in, i.e. it is invariant across any permutation of
 *   the same input set.
 */

/** Budget for the properties that re-import the module graph on every run. */
const INJECTION_TEST_TIMEOUT_MS = 30_000;

/* -------------------------------------------------------------------------- */
/*                            Clamping rule (shared)                          */
/* -------------------------------------------------------------------------- */

/**
 * The documented clamping rule for a preview `cap`, restated so the expected
 * bound is derived rather than copied from the implementation: non-finite
 * falls back to the selector's default, anything else is floored and clamped
 * to `>= 0`.
 */
function effectiveCap(cap: number, fallback: number): number {
  return Number.isFinite(cap) ? Math.max(0, Math.floor(cap)) : fallback;
}

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/** Dates drawn mostly from a small pool, so tie-breaks are actually exercised. */
const arbitraryDate: fc.Arbitrary<string> = fc.oneof(
  {
    arbitrary: fc.constantFrom(
      "2015-09-01",
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
 * Caps spanning every branch of the clamping rule: in-range and out-of-range
 * integers, `0`, negatives, fractions, and the non-finite values that fall
 * back to a selector's default.
 */
const arbitraryCap: fc.Arbitrary<number> = fc.oneof(
  { arbitrary: fc.integer({ min: -4, max: 14 }), weight: 4 },
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

function makeHackathon(index: number, date: string): Hackathon {
  return {
    id: `hackathon-${index}`,
    slug: `hackathon-${index}`,
    name: `Hackathon ${index}`,
    organizer: `Organizer ${index}`,
    description: `Description ${index}`,
    date,
    location: `Location ${index}`,
    teamMembers: [],
    technologies: [],
    images: [],
  };
}

/** A dataset with unique ids, including the empty dataset. */
const arbitraryHackathonDataset: fc.Arbitrary<readonly Hackathon[]> = fc
  .uniqueArray(
    fc.record({ index: fc.nat({ max: 99 }), date: arbitraryDate }),
    { minLength: 0, maxLength: 10, selector: (entry) => entry.index },
  )
  .map((entries) =>
    entries.map((entry) => makeHackathon(entry.index, entry.date)),
  );

function makeCertification(index: number, issueDate: string): Certification {
  return {
    id: `cert-${index}`,
    title: `Certification ${index}`,
    issuer: `Issuer ${index}`,
    issueDate,
    badgeImage: `/images/certifications/cert-${index}.svg`,
    technologies: [],
    featured: false,
  };
}

/** A dataset with unique ids, including the empty dataset. */
const arbitraryCertificationDataset: fc.Arbitrary<readonly Certification[]> =
  fc
    .uniqueArray(
      fc.record({ index: fc.nat({ max: 99 }), issueDate: arbitraryDate }),
      { minLength: 0, maxLength: 10, selector: (entry) => entry.index },
    )
    .map((entries) =>
      entries.map((entry) => makeCertification(entry.index, entry.issueDate)),
    );

function makeEducation(index: number, startDate: string): Education {
  return {
    id: `education-${index}`,
    institution: `Institution ${index}`,
    degree: `Degree ${index}`,
    startDate,
    achievements: [],
    coursework: [],
    logo: `/images/education/edu-${index}.svg`,
  };
}

/**
 * A base set of Education entries with unique ids (at least one, so ordering
 * claims are non-vacuous), paired with an arbitrary permutation of that same
 * set — the "for any random permutation of input entries" clause of Property
 * 14, made concrete.
 */
const arbitraryEducationPermutation: fc.Arbitrary<{
  readonly base: readonly Education[];
  readonly permuted: readonly Education[];
}> = fc
  .uniqueArray(
    fc.record({ index: fc.nat({ max: 99 }), startDate: arbitraryDate }),
    { minLength: 1, maxLength: 8, selector: (entry) => entry.index },
  )
  .map((entries) =>
    entries.map((entry) => makeEducation(entry.index, entry.startDate)),
  )
  .chain((base) =>
    fc
      .shuffledSubarray(base, { minLength: base.length, maxLength: base.length })
      .map((permuted) => ({ base, permuted })),
  );

/* -------------------------------------------------------------------------- */
/*                            Injection helpers                               */
/* -------------------------------------------------------------------------- */

/**
 * Runs the **real** `getHackathonsPreview` over a substituted dataset: reset
 * the registry, point `@/data/hackathons` at the generated entries, re-import
 * `lib/data-access`.
 */
async function hackathonsPreviewOverDataset(
  dataset: readonly Hackathon[],
  cap: number,
): Promise<readonly Hackathon[]> {
  vi.resetModules();
  vi.doMock("@/data/hackathons", () => ({ hackathons: [...dataset] }));

  const { getHackathonsPreview: preview } = await import("@/lib/data-access");

  return preview(cap);
}

/** Same substitution, for the uncapped `getAllHackathons` full listing. */
async function allHackathonsOverDataset(
  dataset: readonly Hackathon[],
): Promise<readonly Hackathon[]> {
  vi.resetModules();
  vi.doMock("@/data/hackathons", () => ({ hackathons: [...dataset] }));

  const { getAllHackathons: all } = await import("@/lib/data-access");

  return all();
}

/** Same substitution, for the uncapped `getAllCertifications` full listing. */
async function allCertificationsOverDataset(
  dataset: readonly Certification[],
): Promise<readonly Certification[]> {
  vi.resetModules();
  vi.doMock("@/data/certifications", () => ({ certifications: [...dataset] }));

  const { getAllCertifications: all } = await import("@/lib/data-access");

  return all();
}

/** Same substitution, for the chronological `getEducationSortedByDate`. */
async function educationSortedOverDataset(
  dataset: readonly Education[],
): Promise<readonly Education[]> {
  vi.resetModules();
  vi.doMock("@/data/education", () => ({ education: [...dataset] }));

  const { getEducationSortedByDate: sort } = await import("@/lib/data-access");

  return sort();
}

/** `startDate` descending, ties broken by `id` ascending — the pinned order. */
function expectOrderedByStartDateDescending(
  entries: readonly Education[],
): void {
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1]!;
    const current = entries[index]!;

    expect(previous.startDate >= current.startDate).toBe(true);

    if (previous.startDate === current.startDate) {
      expect(previous.id < current.id).toBe(true);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Property 14                                */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 14: Listing and preview count bounds
// are respected
//
// For any generated dataset for a capped preview section (Hackathons preview)
// or an uncapped full-listing page (Hackathons page, Certifications page) or a
// chronological section (Education), the preview section's rendered count
// never exceeds its preview cap and never exceeds the dataset size; the
// full-listing page's rendered count always exactly equals the dataset size;
// and the Education section's rendered order is strictly non-decreasing (or
// non-increasing, per the chosen convention) by `startDate` for any random
// permutation of input entries.
//
// **Validates: Requirements 14.1, 15.1, 15.2, 21.2, 21.4**
describe("Property 14: listing and preview count bounds are respected", () => {
  afterEach(() => {
    vi.doUnmock("@/data/hackathons");
    vi.doUnmock("@/data/certifications");
    vi.doUnmock("@/data/education");
    vi.resetModules();
  });

  it(
    "never exceeds the effective cap or the dataset size for the Hackathons preview",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryHackathonDataset,
          arbitraryCap,
          async (dataset, cap) => {
            const preview = await hackathonsPreviewOverDataset(dataset, cap);
            const cap3 = effectiveCap(cap, 3);

            expect(preview.length).toBeLessThanOrEqual(cap3);
            expect(preview.length).toBeLessThanOrEqual(dataset.length);
            expect(preview).toHaveLength(Math.min(cap3, dataset.length));

            // Every returned entry is drawn from the generated dataset, never
            // fabricated or duplicated.
            const ids = preview.map((entry) => entry.id);

            expect(new Set(ids).size).toBe(ids.length);
            for (const entry of preview) {
              expect(dataset).toContain(entry);
            }
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "returns exactly the dataset size for the uncapped Hackathons full listing",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryHackathonDataset, async (dataset) => {
          const all = await allHackathonsOverDataset(dataset);

          expect(all).toHaveLength(dataset.length);
          expect(all).toEqual(dataset);
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "returns exactly the dataset size for the uncapped Certifications full listing",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryCertificationDataset, async (dataset) => {
          const all = await allCertificationsOverDataset(dataset);

          expect(all).toHaveLength(dataset.length);
          expect(all).toEqual(dataset);
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "orders Education entries by startDate descending, invariant across any permutation of the input",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryEducationPermutation,
          async ({ base, permuted }) => {
            const sortedFromBase = await educationSortedOverDataset(base);
            const sortedFromPermuted =
              await educationSortedOverDataset(permuted);

            // Chronological order holds regardless of which arrangement was
            // fed in.
            expectOrderedByStartDateDescending(sortedFromBase);
            expectOrderedByStartDateDescending(sortedFromPermuted);

            // The full set is preserved — no entry gained or dropped — and the
            // resulting id sequence does not depend on input order.
            expect(sortedFromBase).toHaveLength(base.length);
            expect(sortedFromPermuted).toHaveLength(base.length);
            expect(sortedFromPermuted.map((entry) => entry.id)).toEqual(
              sortedFromBase.map((entry) => entry.id),
            );
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it("never exceeds the effective cap or the dataset size for the shipped Hackathons preview", () => {
    fc.assert(
      fc.property(arbitraryCap, (cap) => {
        const preview = getHackathonsPreview(cap);
        const cap3 = effectiveCap(cap, 3);

        expect(preview.length).toBeLessThanOrEqual(cap3);
        expect(preview.length).toBeLessThanOrEqual(hackathons.length);
        expect(preview).toHaveLength(Math.min(cap3, hackathons.length));
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns exactly the shipped dataset size for the Hackathons and Certifications full listings", () => {
    expect(getAllHackathons()).toHaveLength(hackathons.length);
    expect(getAllCertifications()).toHaveLength(certifications.length);
  });

  it("orders the shipped Education dataset by startDate descending", () => {
    const sorted = getEducationSortedByDate();

    expect(sorted).toHaveLength(education.length);
    expectOrderedByStartDateDescending(sorted);
  });
});
