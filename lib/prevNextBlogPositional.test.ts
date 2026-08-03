import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAllPublishedBlogs, getPrevNextBlog } from "@/lib/data-access";
import type { Blog } from "@/types";

const NUM_RUNS = 100;

/** Budget for the property that re-imports the module graph on every run. */
const INJECTION_TEST_TIMEOUT_MS = 30_000;

/**
 * Property 18 for `getPrevNextBlog` in `lib/data-access.ts`.
 *
 * The property statement is written over "any list of published blog posts
 * sorted by `publishedDate` and any index `i` within that list" — a dimension
 * `getPrevNextBlog` does not take as an argument. The selector closes over the
 * static `data/blogs.ts` module and derives its own ordering internally via
 * {@link getAllPublishedBlogs}, so the generated input here is the **dataset**
 * itself (random `publishedDate` values, including ties, and random `draft`
 * flags), injected into the module the selector reads (`@/data/blogs`), with
 * `lib/data-access` re-imported so the **real**, shipped `getPrevNextBlog` runs
 * against it. No selector or ordering logic is duplicated in this file — the
 * expected previous/next slug for index `i` is read directly off whatever
 * {@link getAllPublishedBlogs} returns for that same injected dataset, at
 * `published[i - 1]` / `published[i + 1]`.
 *
 * ## What the property checks, exactly as `lib/data-access.ts` documents it
 *
 * For the post at index `i` in the published listing:
 *
 * - `previous` is the post at index `i - 1`, or `undefined` when `i === 0`
 *   (the newest post has no previous).
 * - `next` is the post at index `i + 1`, or `undefined` when `i` is the last
 *   index (the oldest post has no next).
 *
 * This holds for *every* index of *every* generated dataset, including ones
 * with same-day posts (exercising the `slug` tie-break in the ordering) and
 * ones that mix draft and published posts (a draft never has a position in the
 * list this selector walks, so it can never occupy `previous`/`next` in the
 * first place — Requirement 20.6 territory, not restated here).
 *
 * **Validates: Requirements 20.5**
 */

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/**
 * `publishedDate` values drawn mostly from a small pool, so same-day ties are
 * common and the `slug` tie-break in the published ordering is actually
 * exercised rather than a dead branch.
 */
const arbitraryPublishedDate: fc.Arbitrary<string> = fc.oneof(
  {
    arbitrary: fc.constantFrom(
      "2020-01-01",
      "2021-06-15",
      "2022-03-10",
      "2023-09-05",
      "2024-12-25",
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
 * A `Blog[]` dataset with unique slugs/ids (the precondition for a well-defined
 * position in the listing) and a random mix of `draft` flags, so the injected
 * dataset can land anywhere between "all published" and "all draft".
 */
const arbitraryBlogDataset: fc.Arbitrary<readonly Blog[]> = fc
  .uniqueArray(
    fc.record({
      index: fc.nat({ max: 99 }),
      publishedDate: arbitraryPublishedDate,
      draft: fc.boolean(),
    }),
    { minLength: 1, maxLength: 10, selector: (entry) => entry.index },
  )
  .map((entries) =>
    entries.map(
      (entry): Blog => ({
        id: `blog-${entry.index}`,
        slug: `blog-${entry.index}`,
        title: `Post ${entry.index}`,
        excerpt: "Excerpt.",
        coverImage: `/images/blog/blog-${entry.index}.jpg`,
        content: "Content.",
        publishedDate: entry.publishedDate,
        readingTime: 5,
        author: "Author",
        tags: [],
        featured: false,
        draft: entry.draft,
      }),
    ),
  );

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/**
 * Runs the **real** selectors over a substituted dataset: reset the registry,
 * point `@/data/blogs` at the generated entries, re-import `lib/data-access`.
 * The ordering and lookup code under test is the shipped one.
 */
async function selectOverDataset(dataset: readonly Blog[]): Promise<{
  published: readonly Blog[];
  prevNext: (slug: string) => ReturnType<typeof getPrevNextBlog>;
}> {
  vi.resetModules();
  vi.doMock("@/data/blogs", () => ({ blogs: [...dataset] }));

  const {
    getAllPublishedBlogs: allPublished,
    getPrevNextBlog: prevNextBlog,
  } = await import("@/lib/data-access");

  return { published: allPublished(), prevNext: prevNextBlog };
}

/* -------------------------------------------------------------------------- */
/*                                 Property 18                                */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 18: Previous/next article navigation
// is positionally correct
//
// For any list of published blog posts sorted by `publishedDate` and any index
// i within that list, the previous/next resolver for the post at index i
// returns the post at index i-1 as previous (or none, at the start of the
// list) and the post at index i+1 as next (or none, at the end of the list).
//
// **Validates: Requirements 20.5**
describe("Property 18: previous/next article navigation is positionally correct", () => {
  afterEach(() => {
    vi.doUnmock("@/data/blogs");
    vi.resetModules();
  });

  it(
    "resolves previous/next to the neighbouring slugs at every index, for any generated dataset",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryBlogDataset, async (dataset) => {
          const { published, prevNext } = await selectOverDataset(dataset);

          for (const [index, post] of published.entries()) {
            const { previous, next } = prevNext(post.slug);

            expect(previous?.slug).toBe(published[index - 1]?.slug);
            expect(next?.slug).toBe(published[index + 1]?.slug);
          }
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "has no previous at the start of the list and no next at the end, for any generated dataset",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryBlogDataset, async (dataset) => {
          const { published, prevNext } = await selectOverDataset(dataset);

          if (published.length === 0) {
            return;
          }

          expect(prevNext(published[0]!.slug).previous).toBeUndefined();
          expect(
            prevNext(published[published.length - 1]!.slug).next,
          ).toBeUndefined();
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "returns the canonical neighbouring records, not clones, for any generated dataset",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryBlogDataset, async (dataset) => {
          const { published, prevNext } = await selectOverDataset(dataset);

          for (const [index, post] of published.entries()) {
            const { previous, next } = prevNext(post.slug);

            if (index > 0) {
              expect(previous).toBe(published[index - 1]);
            }

            if (index < published.length - 1) {
              expect(next).toBe(published[index + 1]);
            }
          }
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it("holds at every index of the shipped published listing, for a randomly chosen index", () => {
    const published = getAllPublishedBlogs();

    // The fixture guarantees at least two published posts, so the previous/next
    // clauses are observable rather than vacuous for the interior indices.
    expect(published.length).toBeGreaterThan(1);

    fc.assert(
      fc.property(
        fc.nat({ max: published.length - 1 }),
        (index) => {
          const post = published[index]!;
          const { previous, next } = getPrevNextBlog(post.slug);

          expect(previous?.slug).toBe(published[index - 1]?.slug);
          expect(next?.slug).toBe(published[index + 1]?.slug);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
