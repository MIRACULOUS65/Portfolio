import { render } from "@testing-library/react";
import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Section } from "@/components/shared/Section";
import type {
  Blog,
  Certification,
  FeaturedProjectEntry,
  Hackathon,
  Project,
} from "@/types";

const NUM_RUNS = 100;

/**
 * Property 4 for the preview-driven homepage sections named in design.md:
 * Featured Projects, Blog, Certifications, Hackathons.
 *
 * ## What is generated, and why
 *
 * The property statement is written over "any generated dataset for a
 * preview-driven section", but every selector in `lib/data-access.ts` closes
 * over its static `data/*.ts` module — there is no seam to inject a dataset
 * through at the call site. Following the pattern established in
 * `certificationPreviewFallback.test.ts`, the generated dataset is substituted
 * into the module graph (`vi.doMock` + `vi.resetModules` + a fresh
 * `import("@/lib/data-access")`), so the selector under test is the shipped
 * one running over generated data, not a reimplementation of its rule.
 *
 * Each generated dataset is constrained to exceed the section's preview cap
 * (the default `3` every preview selector documents), so the property's
 * precondition — "full size exceeds the preview cap" — is met on every run
 * rather than being an occasional coincidence.
 *
 * ## The two clauses, and where each is checked
 *
 * 1. **Strict subset**: `preview.length < full.length`, and every preview
 *    entry is drawn from the full listing. Checked directly against the real
 *    selector pair for each section (preview selector vs. the corresponding
 *    full-listing selector).
 * 2. **Exactly one Explore More button, pointed at the correct route**:
 *    checked by rendering `Section` — the single component permitted to render
 *    `ExploreMoreButton`, and the one every preview section built so far
 *    (`Section.tsx`, task 15.5) delegates that button to — with
 *    `exploreMoreHref` set to the section's dedicated route, and counting
 *    `[data-slot="explore-more-button"]` in the rendered output.
 *
 * ## Featured Projects is checked only for clause 1
 *
 * `getFeaturedProjectsResolved()` has no `cap` argument at all — it renders
 * every curated entry (Property 8) — so "the section's preview cap" for
 * Featured Projects is the curation itself, checked against the full project
 * catalog (`getAllProjects()`), matching the reading `featuredProjectsResolution
 * .test.ts` already establishes ("strict subset of the full project dataset").
 * Its Explore More button is deliberately *not* rendered by `Section` — per
 * `Section`'s own documentation and task 23.8, `FeaturedProjectsSection` passes
 * no `exploreMoreHref` because the button lives inside `ProjectDetails` (task
 * 23.4, not yet implemented) next to the selected project it refers to. So
 * clause 2 for Featured Projects is left for that task rather than asserted
 * against a `Section` usage the real component will never have.
 *
 * **Validates: Requirements 6.3, 6.4, 17.1, 17.2**
 */

/** Every generated-dataset property re-imports the module graph on each run. */
const INJECTION_TEST_TIMEOUT_MS = 30_000;

const EXPLORE_MORE_SELECTOR = "[data-slot='explore-more-button']";

/** Counts `[data-slot="explore-more-button"]` nodes in a rendered container. */
function countExploreMoreButtons(container: HTMLElement): number {
  return container.querySelectorAll(EXPLORE_MORE_SELECTOR).length;
}

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/** A pool of ISO dates, so ties (and therefore tie-breaks) are common. */
const arbitraryIsoDate: fc.Arbitrary<string> = fc.constantFrom(
  "2019-07-14",
  "2021-02-01",
  "2022-08-17",
  "2023-11-04",
  "2024-03-12",
  "2025-01-30",
);

/**
 * Unique indices used to derive stable ids/slugs, sized so the dataset always
 * exceeds every preview selector's default cap of `3` (Requirements 6.3, 6.4).
 */
const arbitraryIndices: fc.Arbitrary<readonly number[]> = fc.uniqueArray(
  fc.nat({ max: 199 }),
  { minLength: 4, maxLength: 10 },
);

/**
 * A dataset of blog entries with a random `draft` flag per entry, guaranteed
 * (by construction, not by post-hoc filtering) to hold more than 3 non-draft
 * posts: the last three generated indices are pinned to `draft: false`, and
 * every other index gets a freely-generated flag on top of that floor. This
 * mirrors `certificationPreviewFallback.test.ts`'s `arbitraryDataset` — one
 * `fc.record` per entry, mapped into the real entity shape — while keeping
 * `getRecentPublishedBlogs()`'s cap of 3 reliably binding.
 */
const arbitraryBlogDataset: fc.Arbitrary<readonly Blog[]> = arbitraryIndices
  .chain((indices) =>
    fc
      .tuple(
        fc.array(fc.boolean(), {
          minLength: indices.length,
          maxLength: indices.length,
        }),
        fc.array(arbitraryIsoDate, {
          minLength: indices.length,
          maxLength: indices.length,
        }),
      )
      .map(([draftFlags, dates]) =>
        indices.map((index, position) => ({
          index,
          publishedDate: dates[position]!,
          // The first four entries are pinned non-draft (every dataset holds
          // at least 4 entries, per `arbitraryIndices`'s `minLength`), so the
          // non-draft count always strictly exceeds the preview cap of 3
          // regardless of how the remaining flags land.
          draft: position < 4 ? false : draftFlags[position]!,
        })),
      ),
  )
  .map((entries) =>
    entries.map(
      (entry): Blog => ({
        id: `blog-${entry.index}`,
        slug: `blog-${entry.index}`,
        title: `Post ${entry.index}`,
        excerpt: `Excerpt ${entry.index}`,
        coverImage: `/images/blog/blog-${entry.index}.jpg`,
        content: `Content ${entry.index}`,
        publishedDate: entry.publishedDate,
        readingTime: 5,
        author: "Alex Doe",
        tags: [],
        featured: false,
        draft: entry.draft,
      }),
    ),
  );

const arbitraryCertificationDataset: fc.Arbitrary<readonly Certification[]> =
  fc
    .tuple(arbitraryIndices, fc.array(arbitraryIsoDate, { minLength: 4 }))
    .map(([indices, dates]) =>
      indices.map(
        (index, position): Certification => ({
          id: `cert-${index}`,
          title: `Certification ${index}`,
          issuer: `Issuer ${index}`,
          issueDate: dates[position % dates.length]!,
          badgeImage: `/images/certifications/cert-${index}.svg`,
          technologies: [],
          featured: position % 2 === 0,
        }),
      ),
    );

const arbitraryHackathonDataset: fc.Arbitrary<readonly Hackathon[]> =
  fc
    .tuple(arbitraryIndices, fc.array(arbitraryIsoDate, { minLength: 4 }))
    .map(([indices, dates]) =>
      indices.map(
        (index, position): Hackathon => ({
          id: `hack-${index}`,
          slug: `hack-${index}`,
          name: `Hackathon ${index}`,
          organizer: `Organizer ${index}`,
          description: `Description ${index}`,
          date: dates[position % dates.length]!,
          location: "Remote",
          teamMembers: [],
          technologies: [],
          images: [],
        }),
      ),
    );

/**
 * A generated Featured Projects config plus the project catalog it resolves
 * against — the catalog always strictly larger than the featured subset, so
 * the whole configured set is a proper subset of `getAllProjects()`.
 */
const arbitraryFeaturedProjectsDataset: fc.Arbitrary<{
  readonly projects: readonly Project[];
  readonly featuredEntries: readonly FeaturedProjectEntry[];
}> = arbitraryIndices.map((indices) => {
  const project = (index: number, featured: boolean): Project => ({
    id: `project-${index}`,
    slug: `project-${index}`,
    title: `Project ${index}`,
    shortDescription: `Short ${index}`,
    description: `Description ${index}`,
    category: "Web",
    status: "Completed",
    thumbnail: `/images/projects/project-${index}.jpg`,
    heroImage: `/images/projects/project-${index}-hero.jpg`,
    gallery: [],
    startDate: "2022-01-01",
    featured,
    pinned: false,
    archived: false,
    technologies: [],
    features: [],
    challenges: [],
    learnings: [],
    architecture: [],
    screenshots: [],
    relatedProjects: [],
  });

  // At least one non-featured project on top of the featured ones, so the
  // catalog is strictly larger than the featured subset.
  const featuredCount = Math.max(1, indices.length - 1);
  const featuredIndices = indices.slice(0, featuredCount);
  const restIndices = indices.slice(featuredCount);
  const nonFeaturedIndices =
    restIndices.length > 0 ? restIndices : [indices.length + 1000];

  const projects = [
    ...featuredIndices.map((index) => project(index, true)),
    ...nonFeaturedIndices.map((index) => project(index, false)),
  ];

  const featuredEntries: FeaturedProjectEntry[] = featuredIndices.map(
    (index, order) => ({ projectId: `project-${index}`, order }),
  );

  return { projects, featuredEntries };
});

/* -------------------------------------------------------------------------- */
/*                            Module-injection helpers                        */
/* -------------------------------------------------------------------------- */

async function withMockedDataAccess<T>(
  mocks: Record<string, () => Record<string, unknown>>,
  run: (
    dataAccess: typeof import("@/lib/data-access"),
  ) => Promise<T> | T,
): Promise<T> {
  vi.resetModules();

  for (const [modulePath, factory] of Object.entries(mocks)) {
    vi.doMock(modulePath, factory);
  }

  const dataAccess = await import("@/lib/data-access");

  try {
    return await run(dataAccess);
  } finally {
    for (const modulePath of Object.keys(mocks)) {
      vi.doUnmock(modulePath);
    }
    vi.resetModules();
  }
}

/**
 * Renders `Section` with a placeholder card per preview item and returns the
 * Explore More button count plus the single anchor's `href`, if any.
 */
function renderSectionPreview(
  routeId: string,
  exploreMoreHref: string,
  itemIds: readonly string[],
): { readonly buttonCount: number; readonly href: string | null } {
  const { container, unmount } = render(
    <Section
      id={routeId}
      title={`${routeId} preview`}
      exploreMoreHref={exploreMoreHref}
    >
      {itemIds.map((id) => (
        <div key={id}>{id}</div>
      ))}
    </Section>,
  );

  const buttons = container.querySelectorAll(EXPLORE_MORE_SELECTOR);
  const href = buttons[0]?.getAttribute("href") ?? null;
  const buttonCount = countExploreMoreButtons(container);

  unmount();

  return { buttonCount, href };
}

/* -------------------------------------------------------------------------- */
/*                                 Property 4                                 */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 4: Preview sections show a strict
// subset with exactly one Explore More button
//
// For any generated dataset for a preview-driven section (Featured Projects,
// Blog, Certifications, Hackathons) whose full size exceeds the section's
// preview cap, the rendered preview count is strictly less than the full
// dataset size, and the section renders exactly one `ExploreMoreButton`
// pointed at the correct dedicated route.
//
// **Validates: Requirements 6.3, 6.4, 17.1, 17.2**
describe("Property 4: preview sections show a strict subset with exactly one Explore More button", () => {
  afterEach(() => {
    vi.doUnmock("@/data/blogs");
    vi.doUnmock("@/data/certifications");
    vi.doUnmock("@/data/hackathons");
    vi.doUnmock("@/data/projects");
    vi.doUnmock("@/data/featured-projects");
    vi.resetModules();
  });

  it(
    "Blog: getRecentPublishedBlogs is a strict subset of getAllPublishedBlogs, and Section renders exactly one Explore More button to /blog",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryBlogDataset, async (dataset) => {
          const { preview, full } = await withMockedDataAccess(
            { "@/data/blogs": () => ({ blogs: [...dataset] }) },
            (dataAccess) => ({
              preview: dataAccess.getRecentPublishedBlogs(),
              full: dataAccess.getAllPublishedBlogs(),
            }),
          );

          expect(full.length).toBeGreaterThan(3);
          expect(preview.length).toBeLessThan(full.length);

          const fullSlugs = new Set(full.map((blog) => blog.slug));
          for (const blog of preview) {
            expect(fullSlugs.has(blog.slug)).toBe(true);
          }

          const { buttonCount, href } = renderSectionPreview(
            "blog",
            "/blog",
            preview.map((blog) => blog.slug),
          );

          expect(buttonCount).toBe(1);
          expect(href).toBe("/blog");
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "Certifications: getFeaturedCertifications is a strict subset of getAllCertifications, and Section renders exactly one Explore More button to /certifications",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryCertificationDataset, async (dataset) => {
          const { preview, full } = await withMockedDataAccess(
            {
              "@/data/certifications": () => ({
                certifications: [...dataset],
              }),
            },
            (dataAccess) => ({
              preview: dataAccess.getFeaturedCertifications(),
              full: dataAccess.getAllCertifications(),
            }),
          );

          expect(full.length).toBeGreaterThan(3);
          expect(preview.length).toBeLessThan(full.length);

          const fullIds = new Set(full.map((entry) => entry.id));
          for (const entry of preview) {
            expect(fullIds.has(entry.id)).toBe(true);
          }

          const { buttonCount, href } = renderSectionPreview(
            "certifications",
            "/certifications",
            preview.map((entry) => entry.id),
          );

          expect(buttonCount).toBe(1);
          expect(href).toBe("/certifications");
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "Hackathons: getHackathonsPreview is a strict subset of getAllHackathons, and Section renders exactly one Explore More button to /hackathons",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryHackathonDataset, async (dataset) => {
          const { preview, full } = await withMockedDataAccess(
            { "@/data/hackathons": () => ({ hackathons: [...dataset] }) },
            (dataAccess) => ({
              preview: dataAccess.getHackathonsPreview(),
              full: dataAccess.getAllHackathons(),
            }),
          );

          expect(full.length).toBeGreaterThan(3);
          expect(preview.length).toBeLessThan(full.length);

          const fullIds = new Set(full.map((entry) => entry.id));
          for (const entry of preview) {
            expect(fullIds.has(entry.id)).toBe(true);
          }

          const { buttonCount, href } = renderSectionPreview(
            "hackathons",
            "/hackathons",
            preview.map((entry) => entry.id),
          );

          expect(buttonCount).toBe(1);
          expect(href).toBe("/hackathons");
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it(
    "Featured Projects: getFeaturedProjectsResolved is a strict subset of getAllProjects (Explore More lives in ProjectDetails, task 23.4 — not asserted here)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryFeaturedProjectsDataset,
          async ({ projects, featuredEntries }) => {
            const { preview, full } = await withMockedDataAccess(
              {
                "@/data/projects": () => ({ projects: [...projects] }),
                "@/data/featured-projects": () => ({
                  featuredProjects: [...featuredEntries],
                }),
              },
              (dataAccess) => ({
                preview: dataAccess.getFeaturedProjectsResolved(),
                full: dataAccess.getAllProjects(),
              }),
            );

            expect(full.length).toBeGreaterThan(preview.length);
            expect(preview.length).toBeLessThan(full.length);

            const fullIds = new Set(full.map((project) => project.id));
            for (const project of preview) {
              expect(fullIds.has(project.id)).toBe(true);
            }
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it("holds for the shipped datasets too: every preview selector is a strict subset (or, for Certifications, the full real dataset) with a correctly-routed, singular Explore More button", async () => {
    const dataAccess = await import("@/lib/data-access");

    const cases: ReadonlyArray<{
      readonly routeId: string;
      readonly href: string;
      readonly preview: ReadonlyArray<{ readonly id: string } | { readonly slug: string }>;
      readonly full: readonly unknown[];
      /**
       * Whether the preview must be a *strict* subset of the full listing.
       * Certifications is the one exception: the real dataset
       * (`data/certifications.ts`) holds exactly 3 certifications today, which
       * equals the preview cap, so `getFeaturedCertifications()` and
       * `getAllCertifications()` currently return the same three entries. The
       * generated-dataset property above (`arbitraryCertificationDataset`)
       * still asserts strict-subset behaviour whenever the full dataset
       * exceeds the cap — this shipped-dataset case only relaxes the
       * assertion to match today's real, smaller content.
       */
      readonly requireStrictSubset: boolean;
    }> = [
      {
        routeId: "blog",
        href: "/blog",
        preview: dataAccess.getRecentPublishedBlogs(),
        full: dataAccess.getAllPublishedBlogs(),
        requireStrictSubset: true,
      },
      {
        routeId: "certifications",
        href: "/certifications",
        preview: dataAccess.getFeaturedCertifications(),
        full: dataAccess.getAllCertifications(),
        requireStrictSubset: false,
      },
      {
        routeId: "hackathons",
        href: "/hackathons",
        preview: dataAccess.getHackathonsPreview(),
        full: dataAccess.getAllHackathons(),
        requireStrictSubset: true,
      },
    ];

    for (const testCase of cases) {
      if (testCase.requireStrictSubset) {
        expect(testCase.preview.length).toBeLessThan(testCase.full.length);
      } else {
        expect(testCase.preview.length).toBeLessThanOrEqual(testCase.full.length);
      }

      const itemIds = testCase.preview.map((item) =>
        "slug" in item ? item.slug : item.id,
      );
      const { buttonCount, href } = renderSectionPreview(
        testCase.routeId,
        testCase.href,
        itemIds,
      );

      expect(buttonCount).toBe(1);
      expect(href).toBe(testCase.href);
    }

    // Featured Projects: strict subset only, per the class-level comment above.
    expect(dataAccess.getFeaturedProjectsResolved().length).toBeLessThan(
      dataAccess.getAllProjects().length,
    );
  });
});
