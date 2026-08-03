import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getBlogBySlug } from "@/lib/data-access";
import type { Blog } from "@/types";

const NUM_RUNS = 100;

/** Budget for the property that re-imports the module graph on every run. */
const INJECTION_TEST_TIMEOUT_MS = 30_000;

/**
 * Property 17 for the article lookup `BlogArticlePage` (task 38.5) performs on
 * `/blog/[slug]`.
 *
 * There is no standalone "article lookup" selector in `lib/data-access.ts` —
 * by design. `getBlogBySlug`'s own doc comment states the contract this
 * property checks: it "looks across all posts, drafts included, so callers can
 * tell a *missing* slug (`undefined`) from a *draft* one (a record with
 * `draft: true`) — both render as not-found, but only one of them is a broken
 * reference." The lookup `BlogArticlePage` performs is exactly that selector
 * plus the two-way not-found branch the page (and this test) apply on top of
 * it — nothing here duplicates or re-implements `getBlogBySlug` itself.
 *
 * The property statement is written over "any generated `Blog[]` dataset and
 * any requested slug" — a dimension `getBlogBySlug` does not take as an
 * argument, since it closes over the static `data/blogs.ts` module. So, as in
 * Property 18's test, the generated dataset is injected into `@/data/blogs`
 * and `lib/data-access` is re-imported so the **real**, shipped
 * `getBlogBySlug` runs against it.
 */

/* -------------------------------------------------------------------------- */
/*                             Article lookup model                           */
/* -------------------------------------------------------------------------- */

/**
 * The outcome `BlogArticlePage` renders for a requested slug: either the
 * matching post, or "not found" — never both, never neither.
 */
type ArticleLookupResult =
  | { readonly kind: "found"; readonly post: Blog }
  | { readonly kind: "not-found" };

/**
 * The lookup exactly as task 38.5 performs it: resolve the slug through
 * `getBlogBySlug` (drafts included), then treat an absent post and a draft
 * post identically as "not found". This is the composition under test, not a
 * reimplementation of the selector — the only logic here is the two-way
 * branch on the result `getBlogBySlug` already returns.
 */
function articleLookup(
  blogBySlug: (slug: string) => Blog | undefined,
  slug: string,
): ArticleLookupResult {
  const post = blogBySlug(slug);

  if (post === undefined || post.draft) {
    return { kind: "not-found" };
  }

  return { kind: "found", post };
}

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/**
 * A `Blog[]` dataset with unique slugs and a random mix of `draft` flags, so a
 * generated slug can land on a published post, a draft post, or nothing at
 * all.
 */
const arbitraryBlogDataset: fc.Arbitrary<readonly Blog[]> = fc.uniqueArray(
  fc.record({
    index: fc.nat({ max: 99 }),
    draft: fc.boolean(),
  }),
  { minLength: 0, maxLength: 10, selector: (entry) => entry.index },
).map((entries) =>
  entries.map(
    (entry): Blog => ({
      id: `blog-${entry.index}`,
      slug: `blog-${entry.index}`,
      title: `Post ${entry.index}`,
      excerpt: "Excerpt.",
      coverImage: `/images/blog/blog-${entry.index}.jpg`,
      content: "Content.",
      publishedDate: "2023-01-01",
      readingTime: 5,
      author: "Author",
      tags: [],
      featured: false,
      draft: entry.draft,
    }),
  ),
);

/** A slug that may or may not be present in the generated dataset. */
const arbitrarySlug: fc.Arbitrary<string> = fc.oneof(
  { arbitrary: fc.integer({ min: 0, max: 99 }).map((n) => `blog-${n}`), weight: 3 },
  { arbitrary: fc.string(), weight: 1 },
  { arbitrary: fc.constantFrom("", " ", "no-such-post"), weight: 1 },
);

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/**
 * Runs the **real** `getBlogBySlug` over a substituted dataset: reset the
 * registry, point `@/data/blogs` at the generated entries, re-import
 * `lib/data-access`. The selector under test is the shipped one.
 */
async function selectOverDataset(
  dataset: readonly Blog[],
): Promise<(slug: string) => Blog | undefined> {
  vi.resetModules();
  vi.doMock("@/data/blogs", () => ({ blogs: [...dataset] }));

  const { getBlogBySlug: blogBySlug } = await import("@/lib/data-access");

  return blogBySlug;
}

/* -------------------------------------------------------------------------- */
/*                                 Property 17                                */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 17: Blog article lookup distinguishes
// missing and draft slugs correctly
//
// For any generated Blog[] dataset and any requested slug (including slugs
// absent from the dataset and slugs present but marked draft), the article
// lookup used by BlogArticlePage returns "not found" for both the absent and
// the draft case, and returns the matching post for any other present,
// non-draft slug.
//
// **Validates: Requirements 20.6**
describe("Property 17: blog article lookup distinguishes missing and draft slugs correctly", () => {
  afterEach(() => {
    vi.doUnmock("@/data/blogs");
    vi.resetModules();
  });

  it(
    "returns not-found for an absent slug, for any generated dataset",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryBlogDataset,
          arbitrarySlug,
          async (dataset, slug) => {
            const presentSlugs = new Set(dataset.map((post) => post.slug));

            // The absent-slug clause is only observable when the generated
            // slug is not one already present in the dataset — a present slug
            // is covered by the draft/published clauses below instead.
            if (presentSlugs.has(slug)) {
              return;
            }

            const blogBySlug = await selectOverDataset(dataset);

            expect(articleLookup(blogBySlug, slug)).toEqual({
              kind: "not-found",
            });
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "returns not-found for every draft slug, for any generated dataset",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryBlogDataset, async (dataset) => {
          const blogBySlug = await selectOverDataset(dataset);

          for (const post of dataset.filter((entry) => entry.draft)) {
            expect(articleLookup(blogBySlug, post.slug)).toEqual({
              kind: "not-found",
            });
          }
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "returns the exact matching canonical post for every published slug, for any generated dataset",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryBlogDataset, async (dataset) => {
          const blogBySlug = await selectOverDataset(dataset);

          for (const post of dataset.filter((entry) => !entry.draft)) {
            const result = articleLookup(blogBySlug, post.slug);

            expect(result.kind).toBe("found");
            expect(result).toEqual({ kind: "found", post });

            // The canonical record, not a clone (Requirement 4.16).
            if (result.kind === "found") {
              expect(result.post).toBe(post);
            }
          }
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "never yields both an outcome and its opposite — exactly one branch fires, for any generated dataset and slug",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryBlogDataset,
          arbitrarySlug,
          async (dataset, slug) => {
            const blogBySlug = await selectOverDataset(dataset);
            const result = articleLookup(blogBySlug, slug);

            expect(["found", "not-found"]).toContain(result.kind);

            if (result.kind === "found") {
              expect(result.post.slug).toBe(slug);
              expect(result.post.draft).toBe(false);
            }
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it("holds against the shipped dataset: a real missing slug resolves not-found", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("no-such-post-at-all", "", "another-missing-slug"),
        (slug) => {
          expect(articleLookup(getBlogBySlug, slug)).toEqual({
            kind: "not-found",
          });
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("is total — no slug throws, for any generated dataset", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryBlogDataset,
        arbitrarySlug,
        async (dataset, slug) => {
          const blogBySlug = await selectOverDataset(dataset);

          expect(() => articleLookup(blogBySlug, slug)).not.toThrow();
        },
      ),
      { numRuns: NUM_RUNS },
    );
  }, INJECTION_TEST_TIMEOUT_MS);
});
