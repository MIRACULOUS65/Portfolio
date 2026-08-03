import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { projects } from "@/data/projects";
import {
  filterProjects,
  getAllProjects,
  getProjectById,
  type ProjectFilterCriteria,
} from "@/lib/data-access";
import type { Project } from "@/types";

const NUM_RUNS = 100;

/**
 * Property 15 for `lib/data-access.ts`'s `filterProjects`.
 *
 * The property statement is written over "any generated `Project[]` dataset",
 * but the selector reads the module-level dataset rather than taking one as an
 * argument (that is the Requirement 4.2 single-entry-point contract). So the
 * generated dimension here is the *criteria space* — search terms, categories,
 * statuses, blanks, junk, and non-strings — checked against the real dataset,
 * which is itself shaped to make every clause non-vacuous: eight projects, one
 * archived, all six categories and all four statuses represented, and the
 * archived entry deliberately sharing the terms "dashboard" and "analytics"
 * with active projects.
 *
 * Every expectation is computed by a plain filter over `data/projects.ts`
 * written straight from the acceptance criteria, never by calling the selector
 * twice, so the two cannot agree by construction.
 *
 * The empty-state clause is asserted at the boundary this task owns: the
 * selector returns `[]` for an unmatched or unknown criteria combination and
 * never degrades to a fallback listing, and a renderer branching on
 * `length === 0` therefore gets exactly one of the two outcomes. That
 * `EmptyState` itself renders non-empty copy is Property 26's subject.
 */

/* -------------------------------------------------------------------------- */
/*                              Dataset landmarks                             */
/* -------------------------------------------------------------------------- */

/** The one archived entry, which no criteria combination may ever re-admit. */
const ARCHIVED_ID = "beacon-status-page";

/** A term shared by the archived entry and an active one, so exclusion shows. */
const SHARED_TERM = "dashboard";

const nonArchivedProjects = projects.filter((project) => !project.archived);
const allCategories = [...new Set(projects.map((p) => p.category))];
const allStatuses = [...new Set(projects.map((p) => p.status))];

/* -------------------------------------------------------------------------- */
/*                          Expectation (from the AC)                         */
/* -------------------------------------------------------------------------- */

/**
 * Requirement 18.3/18.4's normalisation: trim, lowercase, and treat a blank or
 * non-string criterion as absent.
 */
function normalizeTerm(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().toLowerCase();

  return trimmed.length > 0 ? trimmed : undefined;
}

function matchesSearch(project: Project, term: string): boolean {
  // Title or description only — `shortDescription` is not searched — and the
  // two fields are tested separately, so no match straddles the boundary.
  return (
    project.title.toLowerCase().includes(term) ||
    project.description.toLowerCase().includes(term)
  );
}

/** All non-archived projects satisfying every supplied criterion, in dataset order. */
function expected(criteria: ProjectFilterCriteria): readonly Project[] {
  const search = normalizeTerm(criteria.search);
  const category = normalizeTerm(criteria.category);
  const status = normalizeTerm(criteria.status);

  return projects.filter(
    (project) =>
      !project.archived &&
      (search === undefined || matchesSearch(project, search)) &&
      (category === undefined || project.category.toLowerCase() === category) &&
      (status === undefined || project.status.toLowerCase() === status),
  );
}

const idsOf = (result: readonly Project[]): readonly string[] =>
  result.map((project) => project.id);

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

const CASINGS: readonly ((value: string) => string)[] = [
  (value) => value,
  (value) => value.toUpperCase(),
  (value) => value.toLowerCase(),
  (value) =>
    [...value]
      .map((char, index) =>
        index % 2 === 0 ? char.toUpperCase() : char.toLowerCase(),
      )
      .join(""),
];

const arbitraryCasing: fc.Arbitrary<(value: string) => string> =
  fc.constantFrom(...CASINGS);

function withArbitraryCasing(source: fc.Arbitrary<string>) {
  return source.chain((value) =>
    arbitraryCasing.map((recase) => recase(value)),
  );
}

/**
 * Real substrings of real project text, so hits are common rather than
 * astronomically unlikely. `shortDescription` is included on purpose: those
 * terms must *not* match unless the same text also appears in the title or
 * description, which the exactness clause then checks for free.
 */
const arbitraryRealTerm: fc.Arbitrary<string> = fc
  .constantFrom(...projects)
  .chain((project) =>
    fc.constantFrom(
      project.title,
      project.description,
      project.shortDescription,
    ),
  )
  .chain((field) =>
    fc
      .nat({ max: field.length - 1 })
      .chain((start) =>
        fc
          .integer({ min: 1, max: Math.min(24, field.length - start) })
          .map((length) => field.slice(start, start + length)),
      ),
  );

/** Blanks, prototype-chain names, unicode, and very long junk. */
const arbitraryJunkTerm: fc.Arbitrary<string> = fc.oneof(
  fc.string(),
  fc.string({ unit: "grapheme" }),
  fc.string({ minLength: 200, maxLength: 400 }),
  fc.constantFrom(
    "",
    "   ",
    "\n",
    "\t \n",
    "__proto__",
    "constructor",
    "prototype",
    "toString",
    "Banana",
    "no-such-project-term",
    "null",
    "undefined",
    "0",
    "🚀 nebula",
    "dashboard analytics",
  ),
);

const arbitrarySearch: fc.Arbitrary<string> = fc.oneof(
  { arbitrary: withArbitraryCasing(arbitraryRealTerm), weight: 3 },
  { arbitrary: arbitraryJunkTerm, weight: 1 },
);

const arbitraryCategory: fc.Arbitrary<string> = fc.oneof(
  {
    arbitrary: withArbitraryCasing(fc.constantFrom(...allCategories)),
    weight: 3,
  },
  { arbitrary: arbitraryJunkTerm, weight: 1 },
);

const arbitraryStatus: fc.Arbitrary<string> = fc.oneof(
  {
    arbitrary: withArbitraryCasing(fc.constantFrom(...allStatuses)),
    weight: 3,
  },
  { arbitrary: arbitraryJunkTerm, weight: 1 },
);

/** Any criteria combination, including omitted keys and `{}` itself. */
const arbitraryCriteria: fc.Arbitrary<ProjectFilterCriteria> = fc.record(
  {
    search: arbitrarySearch,
    category: arbitraryCategory,
    status: arbitraryStatus,
  },
  { requiredKeys: [] },
);

/**
 * Values a URL `searchParams` boundary can produce despite the declared type:
 * a repeated query parameter arrives as an array, and a hand-built object can
 * carry anything.
 */
const arbitraryNonString: fc.Arbitrary<string> = fc
  .oneof(
    fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.constant(undefined),
    fc.constant({ toString: () => SHARED_TERM }),
  )
  .map((value) => value as unknown as string);

/** The renderer decision Requirement 18.7 constrains, as data. */
type ListingBranch =
  | { readonly kind: "grid"; readonly items: readonly Project[] }
  | { readonly kind: "empty" };

function resolveListingBranch(items: readonly Project[]): ListingBranch {
  return items.length === 0 ? { kind: "empty" } : { kind: "grid", items };
}

/* -------------------------------------------------------------------------- */
/*                                 Property 15                                */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 15: ProjectsPage filtering is exact and
// empty-state-safe
//
// For any generated `Project[]` dataset with random `archived` flags,
// categories, and statuses, and any chosen search substring/category/status
// filter combination: the filtered result set excludes every archived project;
// for a given search substring, the result set equals exactly the projects whose
// title or description contains that substring case-insensitively; for a given
// category or status filter, the result set equals exactly the projects matching
// that value; and whenever the resulting filtered set is empty, the page renders
// a non-empty `EmptyState` rather than an empty list.
//
// **Validates: Requirements 18.2, 18.3, 18.4, 18.7**
describe("Property 15: ProjectsPage filtering is exact and empty-state-safe", () => {
  it("has the dataset shape the clauses below depend on", () => {
    const archived = projects.filter((project) => project.archived);

    expect(archived.map((project) => project.id)).toEqual([ARCHIVED_ID]);
    expect(nonArchivedProjects).toHaveLength(projects.length - 1);

    // The shared term makes archived exclusion observable, not vacuous.
    const sharedMatches = projects.filter((project) =>
      matchesSearch(project, SHARED_TERM),
    );

    expect(sharedMatches.map((project) => project.id)).toContain(ARCHIVED_ID);
    expect(sharedMatches.some((project) => !project.archived)).toBe(true);
  });

  it("returns exactly the non-archived projects matching a search term (18.3)", () => {
    fc.assert(
      fc.property(arbitrarySearch, (search) => {
        const result = filterProjects({ search });

        expect(idsOf(result)).toEqual(idsOf(expected({ search })));

        const term = normalizeTerm(search);

        for (const project of nonArchivedProjects) {
          const shouldMatch =
            term === undefined || matchesSearch(project, term);

          expect(result.includes(project)).toBe(shouldMatch);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns exactly the non-archived projects matching a category or status (18.4)", () => {
    fc.assert(
      fc.property(arbitraryCategory, arbitraryStatus, (category, status) => {
        expect(idsOf(filterProjects({ category }))).toEqual(
          idsOf(expected({ category })),
        );
        expect(idsOf(filterProjects({ status }))).toEqual(
          idsOf(expected({ status })),
        );
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("never admits an archived project, for any criteria combination (18.2)", () => {
    fc.assert(
      fc.property(arbitraryCriteria, (criteria) => {
        const result = filterProjects(criteria);

        expect(idsOf(result)).not.toContain(ARCHIVED_ID);

        for (const project of result) {
          expect(project.archived).toBe(false);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("keeps archived exclusion observable on criteria the archived entry would satisfy", () => {
    const archivedProject = getProjectById(ARCHIVED_ID);

    expect(archivedProject).toBeDefined();

    const tailoredCriteria: readonly ProjectFilterCriteria[] = [
      { search: SHARED_TERM },
      { search: SHARED_TERM.toUpperCase() },
      { search: archivedProject!.title },
      { status: archivedProject!.status },
      { category: archivedProject!.category },
      { category: archivedProject!.category, status: archivedProject!.status },
      {
        search: SHARED_TERM,
        category: archivedProject!.category,
        status: archivedProject!.status,
      },
    ];

    for (const criteria of tailoredCriteria) {
      const result = filterProjects(criteria);

      expect(idsOf(result)).not.toContain(ARCHIVED_ID);
      expect(idsOf(result)).toEqual(idsOf(expected(criteria)));
    }

    // Not vacuous: the shared term still returns active projects.
    expect(filterProjects({ search: SHARED_TERM }).length).toBeGreaterThan(0);
  });

  it("combines the three criteria with AND — the intersection of each alone", () => {
    fc.assert(
      fc.property(arbitraryCriteria, (criteria) => {
        const result = filterProjects(criteria);

        const perCriterion: readonly Project[][] = [
          criteria.search === undefined
            ? undefined
            : filterProjects({ search: criteria.search }),
          criteria.category === undefined
            ? undefined
            : filterProjects({ category: criteria.category }),
          criteria.status === undefined
            ? undefined
            : filterProjects({ status: criteria.status }),
        ].flatMap((single) => (single === undefined ? [] : [[...single]]));

        const intersection = perCriterion.reduce<readonly Project[]>(
          (accumulator, current) =>
            accumulator.filter((project) => current.includes(project)),
          filterProjects(),
        );

        expect(idsOf(result)).toEqual(idsOf(intersection));
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is empty-state-safe: an unmatched combination yields [] and never a fallback listing (18.7)", () => {
    fc.assert(
      fc.property(arbitraryCriteria, (criteria) => {
        const result = filterProjects(criteria);
        const branch = resolveListingBranch(result);

        if (result.length === 0) {
          // Exactly one outcome: the empty state, never a populated grid.
          expect(branch.kind).toBe("empty");
          expect(result).toEqual([]);
          expect(result.length).not.toBe(nonArchivedProjects.length);
        } else {
          expect(branch.kind).toBe("grid");
          expect(expected(criteria).length).toBeGreaterThan(0);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("does not degrade an unknown category or status to the full listing (18.7)", () => {
    const unknownValues = [
      "Banana",
      "banana",
      "Web3 ",
      "categories",
      "__proto__",
      "Archived-ish",
    ];

    for (const value of unknownValues) {
      if (
        allCategories.some(
          (c) => c.toLowerCase() === value.trim().toLowerCase(),
        )
      ) {
        continue;
      }

      const byCategory = filterProjects({ category: value });

      expect(byCategory).toEqual([]);
      expect(byCategory.length).not.toBe(nonArchivedProjects.length);
    }

    // A real category paired with a status no project in it has: still [].
    const impossible = filterProjects({
      category: "AI/ML",
      search: "no-such-project-term",
    });

    expect(impossible).toEqual([]);

    // The unfiltered listing, by contrast, is the full non-archived set.
    expect(idsOf(filterProjects())).toEqual(idsOf(nonArchivedProjects));
  });

  it("preserves dataset order — the result is a subsequence of getAllProjects()", () => {
    fc.assert(
      fc.property(arbitraryCriteria, (criteria) => {
        const result = filterProjects(criteria);
        const datasetOrder = getAllProjects().filter((project) =>
          result.includes(project),
        );

        expect(idsOf(result)).toEqual(idsOf(datasetOrder));
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("treats a blank or non-string criterion as absent", () => {
    const blanks = ["", "   ", "\n", "\t", " \n "];
    const baseline = idsOf(filterProjects());

    for (const blank of blanks) {
      expect(idsOf(filterProjects({ search: blank }))).toEqual(baseline);
      expect(idsOf(filterProjects({ category: blank }))).toEqual(baseline);
      expect(idsOf(filterProjects({ status: blank }))).toEqual(baseline);
      expect(
        idsOf(
          filterProjects({ search: blank, category: blank, status: blank }),
        ),
      ).toEqual(baseline);
    }

    expect(idsOf(filterProjects({}))).toEqual(baseline);

    fc.assert(
      fc.property(arbitraryNonString, arbitrarySearch, (nonString, search) => {
        // Absent, not coerced: a non-string never filters, and pairing one
        // with a real term leaves that term's own result untouched.
        expect(idsOf(filterProjects({ search: nonString }))).toEqual(baseline);
        expect(idsOf(filterProjects({ category: nonString }))).toEqual(
          baseline,
        );
        expect(idsOf(filterProjects({ status: nonString }))).toEqual(baseline);
        expect(idsOf(filterProjects({ search, category: nonString }))).toEqual(
          idsOf(filterProjects({ search })),
        );
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is total — no criteria combination throws", () => {
    fc.assert(
      fc.property(arbitraryCriteria, arbitraryNonString, (criteria, junk) => {
        expect(() => filterProjects(criteria)).not.toThrow();
        expect(() =>
          filterProjects({ ...criteria, search: junk }),
        ).not.toThrow();
        expect(() =>
          filterProjects({ ...criteria, category: junk, status: junk }),
        ).not.toThrow();
        expect(() => filterProjects()).not.toThrow();
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns canonical records in a fresh array on every call", () => {
    fc.assert(
      fc.property(arbitraryCriteria, (criteria) => {
        const first = filterProjects(criteria);
        const second = filterProjects(criteria);

        expect(first).toEqual(second);
        expect(first).not.toBe(second);

        for (const [index, project] of first.entries()) {
          // Same object as the dataset entry and as the id resolver's answer.
          expect(project).toBe(second[index]);
          expect(projects).toContain(project);
          expect(getProjectById(project.id)).toBe(project);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
