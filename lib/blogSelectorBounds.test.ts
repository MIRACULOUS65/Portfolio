import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { blogs } from "@/data/blogs";
import {
  getAllBlogs,
  getAllPublishedBlogs,
  getBlogBySlug,
  getRecentPublishedBlogs,
} from "@/lib/data-access";
import type { Blog } from "@/types";

const NUM_RUNS = 100;

/**
 * Property 10 for the two blog selectors in `lib/data-access.ts`.
 *
 * The property statement is written over "any generated `Blog[]` dataset", but
 * both selectors close over the static `data/blogs.ts` module — there is no seam
 * to inject a dataset through, and adding one would test a fake rather than the
 * shipped selectors. So the generated dimension here is the **argument pair**
 * (`min`, `max`), and the dataset clauses are checked against a plain filter
 * over `blogs` rather than a hand-written expected list. That fixture is built
 * for exactly this: one `draft: true` post holding the *newest* `publishedDate`
 * in the file, so a missing draft filter changes the observable first element
 * instead of failing silently.
 *
 * The contract asserted against is the one documented on
 * {@link getRecentPublishedBlogs}, and two parts of it are easy to misread:
 *
 * - **`min` is declarative, not a filter.** The selector returns however many
 *   published posts exist, even below `min`, and never `[]` to signal
 *   "not enough". The `length >= min` → cards / `length < min` → `EmptyState`
 *   decision belongs to the component (task 25.2), which is why the lower-bound
 *   clause of the property statement is a *component* obligation and this file
 *   asserts the selector stays a prefix instead.
 * - **`max` is the only hard cap**, and `min > max` narrows the threshold rather
 *   than widening the window, so "at most `max`" holds for every input.
 */

/* -------------------------------------------------------------------------- */
/*                          Reference implementations                         */
/* -------------------------------------------------------------------------- */

/** The non-draft subset, straight off the dataset — no ordering assumed. */
const publishedReference: readonly Blog[] = blogs.filter((blog) => !blog.draft);

const draftReference: readonly Blog[] = blogs.filter((blog) => blog.draft);

/**
 * The documented clamping rule, restated so the expected cap is derived rather
 * than copied from the implementation: a non-finite value falls back to the
 * parameter default, anything else is floored and clamped to `>= 0`.
 */
function normalize(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

/** Argument lists, including the "call it with no arguments" default path. */
type Args = readonly [] | readonly [number] | readonly [number, number];

function effectiveMax(args: Args): number {
  return normalize(args.length === 2 ? args[1] : 3, 3);
}

function call(args: Args): readonly Blog[] {
  return getRecentPublishedBlogs(...args);
}

function slugsOf(posts: readonly Blog[]): readonly string[] {
  return posts.map((post) => post.slug);
}

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/**
 * Counts spanning every branch of the clamping rule: in-range integers, values
 * past the available post count, negatives, zero, fractions, and the non-finite
 * values that fall back to the defaults.
 */
const arbitraryCount: fc.Arbitrary<number> = fc.oneof(
  { arbitrary: fc.integer({ min: -4, max: 9 }), weight: 4 },
  {
    arbitrary: fc.double({
      min: -4,
      max: 9,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    weight: 2,
  },
  {
    arbitrary: fc.constantFrom(
      0,
      -0,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
    ),
    weight: 1,
  },
);

/**
 * Weighted toward the two-argument form, where the caps actually bind, while
 * still exercising the defaults. `min > max` arises naturally from generating
 * the two independently, so it needs no special case.
 */
const arbitraryArgs: fc.Arbitrary<Args> = fc.oneof(
  {
    arbitrary: fc.tuple(arbitraryCount, arbitraryCount),
    weight: 6,
  },
  { arbitrary: fc.tuple(arbitraryCount), weight: 2 },
  { arbitrary: fc.constant([] as const), weight: 1 },
);

/* -------------------------------------------------------------------------- */
/*                                 Property 10                                */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 10: Blog preview and listing selectors
// filter and bound correctly
//
// For any generated `Blog[]` dataset with random `draft` flags and
// `publishedDate` values: the "recent published" selector used by the homepage
// preview never includes a draft post, returns between `min(2, available)` and
// `3` posts ordered by most-recent-first, and returns a non-empty empty-state
// indicator (rather than an empty render) when fewer than 2 non-draft posts
// exist; the "all published" selector used by the Blog listing page returns
// exactly the non-draft subset of the dataset, in full.
//
// **Validates: Requirements 10.1, 10.5, 20.2**
describe("Property 10: blog preview and listing selectors filter and bound correctly", () => {
  it("never includes a draft post, for any arguments", () => {
    // The fixture must make this observable rather than vacuous.
    expect(draftReference.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(arbitraryArgs, (args) => {
        for (const post of [...call(args), ...getAllPublishedBlogs()]) {
          expect(post.draft).toBe(false);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("hides the draft from both selectors while getAllBlogs and getBlogBySlug still see it", () => {
    // The contrast that proves the filter, not the absence of data: the raw
    // dataset and the slug lookup are deliberately unfiltered, so a draft is
    // "not published" rather than "missing" (Requirement 20.6).
    for (const draft of draftReference) {
      expect(slugsOf(getAllBlogs())).toContain(draft.slug);
      expect(getBlogBySlug(draft.slug)).toBe(draft);
      expect(slugsOf(getAllPublishedBlogs())).not.toContain(draft.slug);
    }
  });

  it("returns exactly the non-draft subset from the listing selector, newest-first", () => {
    const published = getAllPublishedBlogs();

    // Set equality against a plain filter over the dataset — no ordering
    // assumed on either side (Requirement 20.2).
    expect([...slugsOf(published)].sort()).toEqual(
      [...slugsOf(publishedReference)].sort(),
    );
    expect(published).toHaveLength(publishedReference.length);

    // ...and the ordering is non-increasing by `publishedDate`, tie-broken by
    // `slug` ascending, so the order is a total function of the dataset.
    for (let index = 1; index < published.length; index += 1) {
      const newer = published[index - 1]!;
      const older = published[index]!;

      expect(newer.publishedDate >= older.publishedDate).toBe(true);

      if (newer.publishedDate === older.publishedDate) {
        expect(newer.slug < older.slug).toBe(true);
      }
    }
  });

  it("never exceeds the effective max or the available published count", () => {
    fc.assert(
      fc.property(arbitraryArgs, (args) => {
        const result = call(args);
        const cap = effectiveMax(args);

        expect(result.length).toBeLessThanOrEqual(cap);
        expect(result.length).toBeLessThanOrEqual(publishedReference.length);

        // The cap is the only thing that shortens the list: below it, every
        // available post is returned — `min` filters nothing.
        expect(result).toHaveLength(Math.min(cap, publishedReference.length));
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is always a prefix of the published listing", () => {
    fc.assert(
      fc.property(arbitraryArgs, (args) => {
        const result = call(args);
        const published = getAllPublishedBlogs();

        // The clause Property 4 (preview ⊂ full listing) later depends on.
        expect(result).toEqual(published.slice(0, result.length));
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is total — no argument combination throws", () => {
    fc.assert(
      fc.property(arbitraryArgs, (args) => {
        expect(() => call(args)).not.toThrow();
        expect(getAllPublishedBlogs).not.toThrow();
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is deterministic across repeated calls with the same arguments", () => {
    fc.assert(
      fc.property(arbitraryArgs, (args) => {
        expect(call(args)).toEqual(call(args));
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
