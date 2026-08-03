import { render } from "@testing-library/react";
import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/components/shared/EmptyState";
import type { Project } from "@/types";

const NUM_RUNS = 100;

/**
 * Property 16 for the `app/projects/[slug]/not-found.tsx` view (task 36.3, not
 * yet implemented) and the selector behind its fallback,
 * `getRelatedOrPopularProjects()` (task 9.8).
 *
 * ## What is generated, and why
 *
 * The property statement is written over "any generated candidate list of
 * related/alternative projects ... provided to the Project not-found view",
 * which is the view's *input*, not a dataset the selector closes over. Task
 * 36.3 does not exist yet, so this file models the view's rendering decision —
 * exactly the branch `data-access.ts`'s own documentation describes: "the
 * selector returns a single list ... [the view] branches on exactly one
 * condition — `length === 0` → `EmptyState`, otherwise the cards — so
 * rendering both, or neither, is unrepresentable rather than merely untested"
 * (Requirement 28.4, Property 16) — as a small local presentational component,
 * `NotFoundRelatedProjectsView`. It renders nothing else, so this test exercises
 * the same branch the real component will make, not a stand-in for its layout.
 *
 * Two dimensions are generated:
 *
 * 1. **Direct candidate lists** (`arbitraryCandidateList`, including the empty
 *    list) — the most literal reading of "any generated candidate list ...
 *    including an empty list".
 * 2. **The real `getRelatedOrPopularProjects()` fallback output**, driven by
 *    generated `Project[]` datasets with random `pinned`/`archived` flags,
 *    substituted into the module graph (`vi.doMock` + `vi.resetModules` + a
 *    fresh `import("@/lib/data-access")`) following the pattern established in
 *    `certificationPreviewFallback.test.ts`. This is what task 36.3 will
 *    actually pass to the view, and it is what makes the empty branch a *live*
 *    path rather than merely representable: `data-access.ts` notes that a
 *    dataset with no eligible pinned project is what "keeps ... Property 16's
 *    empty case — a live path."
 *
 * Both dimensions assert the same two-part outcome: the view renders either the
 * non-empty candidate list or `EmptyState`, and never both, and never neither.
 */

/* -------------------------------------------------------------------------- */
/*                         Test-only view model (task 36.3)                   */
/* -------------------------------------------------------------------------- */

/**
 * Models exactly the branch `app/projects/[slug]/not-found.tsx` (task 36.3)
 * will make over `getRelatedOrPopularProjects()`'s output: a non-empty
 * candidate list renders as cards, an empty one renders `EmptyState` — never
 * both, never neither. No other not-found page content (the "project not
 * found" message itself) is modelled, since that message is orthogonal to
 * Property 16's branch.
 */
function NotFoundRelatedProjectsView({
  candidates,
}: {
  readonly candidates: readonly Project[];
}) {
  if (candidates.length === 0) {
    return (
      <EmptyState
        title="No related projects"
        message="We couldn't find any related or popular projects to suggest right now."
        action={{ href: "/projects", label: "Browse all projects" }}
      />
    );
  }

  return (
    <ul data-testid="related-list">
      {candidates.map((candidate) => (
        <li key={candidate.id}>{candidate.title}</li>
      ))}
    </ul>
  );
}

/** Renders the view and reports which branch actually painted the DOM. */
function renderedBranch(candidates: readonly Project[]): {
  readonly hasList: boolean;
  readonly hasEmptyState: boolean;
  readonly listItemCount: number;
} {
  const { container, unmount } = render(
    <NotFoundRelatedProjectsView candidates={candidates} />,
  );

  const listItems = container.querySelectorAll(
    "[data-testid='related-list'] li",
  );
  const emptyState = container.querySelector("[role='status']");

  const result = {
    hasList: listItems.length > 0,
    hasEmptyState: emptyState !== null,
    listItemCount: listItems.length,
  };

  unmount();

  return result;
}

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/** A minimal, valid `Project` for a given id, pinned/archived flags. */
function makeProject(
  index: number,
  pinned: boolean,
  archived: boolean,
): Project {
  return {
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
    featured: false,
    pinned,
    archived,
    technologies: [],
    features: [],
    challenges: [],
    learnings: [],
    architecture: [],
    screenshots: [],
    relatedProjects: [],
  };
}

/** Direct candidate lists, including the empty list, per the property statement. */
const arbitraryCandidateList: fc.Arbitrary<readonly Project[]> = fc
  .uniqueArray(fc.nat({ max: 199 }), { minLength: 0, maxLength: 6 })
  .map((indices) => indices.map((index) => makeProject(index, false, false)));

/**
 * Project datasets with random `pinned`/`archived` flags per entry, including
 * the empty dataset — the input space `getRelatedOrPopularProjects()`'s
 * fallback branch reads from.
 */
const arbitraryProjectDataset: fc.Arbitrary<readonly Project[]> = fc
  .uniqueArray(fc.nat({ max: 199 }), { minLength: 0, maxLength: 10 })
  .chain((indices) =>
    fc
      .tuple(
        fc.array(fc.boolean(), {
          minLength: indices.length,
          maxLength: indices.length,
        }),
        fc.array(fc.boolean(), {
          minLength: indices.length,
          maxLength: indices.length,
        }),
      )
      .map(([pinnedFlags, archivedFlags]) =>
        indices.map((index, position) =>
          makeProject(index, pinnedFlags[position]!, archivedFlags[position]!),
        ),
      ),
  );

/**
 * Caps spanning the documented input space: the useful range, the boundary at
 * `0`, negatives, fractions, and the non-finite values that fall back to the
 * default.
 */
const arbitraryCap: fc.Arbitrary<number> = fc.oneof(
  { arbitrary: fc.integer({ min: -3, max: 12 }), weight: 3 },
  {
    arbitrary: fc.constantFrom(
      0,
      1,
      2,
      3,
      -1.5,
      2.7,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ),
    weight: 1,
  },
);

/* -------------------------------------------------------------------------- */
/*                          Module-injection helper                           */
/* -------------------------------------------------------------------------- */

/** Every generated-dataset property re-imports the module graph on each run. */
const INJECTION_TEST_TIMEOUT_MS = 30_000;

async function getFallbackCandidates(
  dataset: readonly Project[],
  cap: number,
): Promise<readonly Project[]> {
  vi.resetModules();
  vi.doMock("@/data/projects", () => ({ projects: [...dataset] }));

  const { getRelatedOrPopularProjects } = await import("@/lib/data-access");

  return getRelatedOrPopularProjects(undefined, cap);
}

/* -------------------------------------------------------------------------- */
/*                                 Property 16                                */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 16: Not-found related-projects fallback
// shows exactly one outcome
//
// For any generated candidate list of related/alternative projects (including
// an empty list) provided to the Project not-found view, the view renders
// either the non-empty candidate list or an `EmptyState`, and never both
// simultaneously and never neither.
//
// **Validates: Requirements 19.5**
describe("Property 16: not-found related-projects fallback shows exactly one outcome", () => {
  afterEach(() => {
    vi.doUnmock("@/data/projects");
    vi.resetModules();
  });

  it("renders exactly one outcome for any direct candidate list, including the empty list", () => {
    fc.assert(
      fc.property(arbitraryCandidateList, (candidates) => {
        const { hasList, hasEmptyState, listItemCount } =
          renderedBranch(candidates);

        // Exactly one of the two outcomes — never both, never neither.
        expect(hasList).not.toBe(hasEmptyState);

        if (candidates.length === 0) {
          expect(hasEmptyState).toBe(true);
          expect(hasList).toBe(false);
        } else {
          expect(hasList).toBe(true);
          expect(hasEmptyState).toBe(false);
          expect(listItemCount).toBe(candidates.length);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it(
    "renders exactly one outcome for the real getRelatedOrPopularProjects() fallback, for any generated project dataset and cap",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryProjectDataset,
          arbitraryCap,
          async (dataset, cap) => {
            const candidates = await getFallbackCandidates(dataset, cap);
            const { hasList, hasEmptyState, listItemCount } =
              renderedBranch(candidates);

            expect(hasList).not.toBe(hasEmptyState);

            if (candidates.length === 0) {
              expect(hasEmptyState).toBe(true);
              expect(hasList).toBe(false);
            } else {
              expect(hasList).toBe(true);
              expect(hasEmptyState).toBe(false);
              expect(listItemCount).toBe(candidates.length);
            }
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it("reaches the empty branch on a real dataset with no eligible pinned project", async () => {
    // No pinned projects at all: the fallback resolves to [].
    const noPinned = await getFallbackCandidates(
      [makeProject(1, false, false), makeProject(2, false, false)],
      3,
    );

    expect(noPinned).toEqual([]);
    expect(renderedBranch(noPinned)).toMatchObject({
      hasList: false,
      hasEmptyState: true,
    });

    // Pinned, but archived: still ineligible, so the fallback is still [].
    const pinnedButArchived = await getFallbackCandidates(
      [makeProject(1, true, true)],
      3,
    );

    expect(pinnedButArchived).toEqual([]);
    expect(renderedBranch(pinnedButArchived)).toMatchObject({
      hasList: false,
      hasEmptyState: true,
    });

    // The fully empty dataset itself also reaches the empty branch.
    const emptyDataset = await getFallbackCandidates([], 3);

    expect(emptyDataset).toEqual([]);
    expect(renderedBranch(emptyDataset)).toMatchObject({
      hasList: false,
      hasEmptyState: true,
    });
  });

  it("reaches the non-empty branch on a real dataset with at least one eligible pinned project", async () => {
    const withPinned = await getFallbackCandidates(
      [
        makeProject(1, true, false),
        makeProject(2, false, false),
        makeProject(3, true, false),
      ],
      3,
    );

    expect(withPinned.length).toBeGreaterThan(0);
    expect(renderedBranch(withPinned)).toMatchObject({
      hasList: true,
      hasEmptyState: false,
      listItemCount: withPinned.length,
    });
  });

  it("is total — rendering never throws for any candidate list", () => {
    fc.assert(
      fc.property(arbitraryCandidateList, (candidates) => {
        expect(() => renderedBranch(candidates)).not.toThrow();
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
