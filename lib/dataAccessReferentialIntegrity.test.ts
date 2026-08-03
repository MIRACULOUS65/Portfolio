import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { certifications } from "@/data/certifications";
import { featuredProjects } from "@/data/featured-projects";
import { hackathons } from "@/data/hackathons";
import { projects } from "@/data/projects";
import { technologies } from "@/data/technologies";
import {
  getAllCertifications,
  getAllHackathons,
  getAllProjects,
  getAllTechnologies,
  getFeaturedProjectsResolved,
  getProjectById,
  getProjectBySlug,
  getRelatedOrPopularProjects,
  getTechnologyById,
} from "@/lib/data-access";
import type { Project } from "@/types";

const NUM_RUNS = 100;

/**
 * Property 2 for the shipped dataset, checked through `lib/data-access.ts`.
 *
 * Three clauses, each of which fails for a different real bug:
 *
 * 1. **Every reference is an id, never an embedded record** (Requirement 4.5).
 *    A reference field holding an object would let featured/related/technology
 *    content drift from the entity it copies.
 * 2. **Every id resolves** through its selector — `undefined` is never the
 *    answer for an id that appears in the data (Requirement 4.16). A dangling
 *    reference is a silent gap on a live page.
 * 3. **The resolved record is the canonical object** (`toBe`, not `toEqual`).
 *    This is the no-duplication clause, and it is what makes "resolved
 *    reference" mean anything: a clone would satisfy deep equality while
 *    diverging the moment the dataset changed.
 *
 * Totality is asserted alongside: an id the dataset does not contain resolves to
 * `undefined` rather than throwing, so a broken reference degrades instead of
 * taking down a render.
 *
 * `lib/validate-data.ts` (task 10) enforces the same invariant at build time.
 * This file is the runtime half — it explores the reference graph by drawing
 * arbitrary referrers and caps from the real datasets rather than walking one
 * hardcoded path.
 */

/* -------------------------------------------------------------------------- */
/*                              Reference sources                             */
/* -------------------------------------------------------------------------- */

/** Every dataset that carries a `Technology.id` list, tagged by owner kind. */
type TechnologyReferrer = {
  readonly kind: "project" | "hackathon" | "certification";
  readonly ownerId: string;
  readonly technologies: readonly string[];
};

const TECHNOLOGY_REFERRERS: readonly TechnologyReferrer[] = [
  ...projects.map((project): TechnologyReferrer => ({
    kind: "project",
    ownerId: project.id,
    technologies: project.technologies,
  })),
  ...hackathons.map((hackathon): TechnologyReferrer => ({
    kind: "hackathon",
    ownerId: hackathon.id,
    technologies: hackathon.technologies,
  })),
  ...certifications.map((certification): TechnologyReferrer => ({
    kind: "certification",
    ownerId: certification.id,
    technologies: certification.technologies,
  })),
];

const PROJECT_IDS: ReadonlySet<string> = new Set(
  projects.map((project) => project.id),
);
const TECHNOLOGY_IDS: ReadonlySet<string> = new Set(
  technologies.map((technology) => technology.id),
);

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

const arbitraryProject: fc.Arbitrary<Project> = fc.constantFrom(...projects);

const arbitraryFeaturedEntry = fc.constantFrom(...featuredProjects);

const arbitraryTechnologyReferrer: fc.Arbitrary<TechnologyReferrer> =
  fc.constantFrom(...TECHNOLOGY_REFERRERS);

/**
 * Caps spanning the whole documented input space: the useful range, the
 * boundary at `0`, negatives, fractions, and the non-finite values
 * `normalizeCount` falls back to the default for.
 */
const arbitraryCap: fc.Arbitrary<number> = fc.oneof(
  { arbitrary: fc.integer({ min: -3, max: projects.length + 2 }), weight: 3 },
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

/**
 * Ids no dataset contains — including prototype-chain names a plain-object
 * index would wrongly resolve.
 */
const arbitraryUnknownId: fc.Arbitrary<string> = fc
  .oneof(
    fc.string(),
    fc.constantFrom(
      "",
      " ",
      "0",
      "null",
      "undefined",
      "__proto__",
      "constructor",
      "toString",
      "hasOwnProperty",
      "no-such-project",
      "no-such-technology",
      "Nebula-Analytics",
    ),
  )
  .filter((id) => !PROJECT_IDS.has(id) && !TECHNOLOGY_IDS.has(id));

/** `getRelatedOrPopularProjects`'s documented cap normalisation. */
function normalizedCap(cap: number): number {
  return Number.isFinite(cap) ? Math.max(0, Math.floor(cap)) : 3;
}

/* -------------------------------------------------------------------------- */
/*                                 Property 2                                 */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 2: Referential integrity of data-layer
// id references
//
// For any generated dataset of Projects and Technologies, every id referenced by
// a `FeaturedProjectEntry.projectId`, a `Project.relatedProjects[]` entry, or a
// `Project.technologies[]` / `Hackathon.technologies[]` /
// `Certification.technologies[]` entry resolves to an existing record of the
// correct type in the canonical dataset (`getAllProjects()` / technology list),
// and the resolved record is the same canonical object (no duplicated/divergent
// copy).
//
// **Validates: Requirements 4.5, 4.16, 19.3**
describe("Property 2: referential integrity of data-layer id references", () => {
  it("resolves every FeaturedProjectEntry.projectId to the canonical Project", () => {
    fc.assert(
      fc.property(arbitraryFeaturedEntry, (entry) => {
        // Requirement 4.5: an id reference, not an embedded Project.
        expect(typeof entry.projectId).toBe("string");

        const resolved = getProjectById(entry.projectId);

        expect(resolved).toBeDefined();
        expect(resolved!.id).toBe(entry.projectId);

        // Requirement 4.16: the canonical record, not a copy of it.
        expect(resolved).toBe(
          projects.find((project) => project.id === entry.projectId),
        );
        expect(getAllProjects()).toContain(resolved);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("resolves every Project.relatedProjects id to another canonical Project", () => {
    fc.assert(
      fc.property(arbitraryProject, (project) => {
        for (const id of project.relatedProjects) {
          expect(typeof id).toBe("string");

          const resolved = getProjectById(id);

          expect(resolved).toBeDefined();
          expect(resolved!.id).toBe(id);

          // Never a self-reference (Requirement 19.3).
          expect(resolved!.id).not.toBe(project.id);

          expect(resolved).toBe(
            projects.find((candidate) => candidate.id === id),
          );
          expect(getAllProjects()).toContain(resolved);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("resolves every technologies[] id on projects, hackathons, and certifications", () => {
    fc.assert(
      fc.property(arbitraryTechnologyReferrer, (referrer) => {
        const canonicalList =
          referrer.kind === "project"
            ? getAllProjects()
            : referrer.kind === "hackathon"
              ? getAllHackathons()
              : getAllCertifications();

        // The referrer itself is a canonical record reached through the
        // data-access layer, so the graph being walked is the shipped one.
        expect(
          canonicalList.some(
            (owner: { readonly id: string }) => owner.id === referrer.ownerId,
          ),
        ).toBe(true);

        for (const id of referrer.technologies) {
          expect(typeof id).toBe("string");

          const resolved = getTechnologyById(id);

          expect(resolved).toBeDefined();
          expect(resolved!.id).toBe(id);

          expect(resolved).toBe(
            technologies.find((technology) => technology.id === id),
          );
          expect(getAllTechnologies()).toContain(resolved);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("resolves the whole featuredProjects config through getFeaturedProjectsResolved", () => {
    fc.assert(
      fc.property(arbitraryFeaturedEntry, (entry) => {
        const resolved = getFeaturedProjectsResolved();

        // Nothing was skipped: every configured reference produced a project.
        expect(resolved).toHaveLength(featuredProjects.length);
        expect(resolved.map((project) => project.id)).toContain(
          entry.projectId,
        );

        // Each element is the canonical record the id resolves to.
        for (const project of resolved) {
          expect(project).toBe(getProjectById(project.id));
          expect(getAllProjects()).toContain(project);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns only real, non-self project references from getRelatedOrPopularProjects", () => {
    fc.assert(
      fc.property(arbitraryProject, arbitraryCap, (project, cap) => {
        const related = getRelatedOrPopularProjects(project, cap);

        expect(related.length).toBeLessThanOrEqual(normalizedCap(cap));

        const seen = new Set<string>();

        for (const candidate of related) {
          // A real Project.id, resolving to the canonical record.
          expect(PROJECT_IDS.has(candidate.id)).toBe(true);
          expect(candidate).toBe(getProjectById(candidate.id));
          expect(getAllProjects()).toContain(candidate);

          // Never the project being viewed, never a repeat.
          expect(candidate.id).not.toBe(project.id);
          expect(seen.has(candidate.id)).toBe(false);
          seen.add(candidate.id);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns only real project references on the no-project fallback path", () => {
    fc.assert(
      fc.property(arbitraryCap, (cap) => {
        const fallback = getRelatedOrPopularProjects(undefined, cap);

        expect(fallback.length).toBeLessThanOrEqual(normalizedCap(cap));

        for (const candidate of fallback) {
          expect(PROJECT_IDS.has(candidate.id)).toBe(true);
          expect(candidate).toBe(getProjectById(candidate.id));
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("resolves an id the dataset does not contain to undefined, never a throw", () => {
    fc.assert(
      fc.property(arbitraryUnknownId, (id) => {
        expect(() => getProjectById(id)).not.toThrow();
        expect(() => getProjectBySlug(id)).not.toThrow();
        expect(() => getTechnologyById(id)).not.toThrow();

        expect(getProjectById(id)).toBeUndefined();
        expect(getTechnologyById(id)).toBeUndefined();

        // `slug` is a separate field, so a non-id string may still be a valid
        // slug. Either way the answer is canonical-or-`undefined`, never null
        // and never a fabricated record.
        const bySlug = getProjectBySlug(id);

        expect(bySlug).not.toBeNull();

        if (bySlug !== undefined) {
          expect(bySlug.slug).toBe(id);
          expect(getAllProjects()).toContain(bySlug);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("falls back rather than fabricating records when references dangle", () => {
    fc.assert(
      fc.property(
        arbitraryProject,
        fc.array(arbitraryUnknownId, { minLength: 1, maxLength: 4 }),
        arbitraryCap,
        (project, danglingIds, cap) => {
          const broken: Project = {
            ...project,
            relatedProjects: [...danglingIds],
          };
          const related = getRelatedOrPopularProjects(broken, cap);

          expect(related.length).toBeLessThanOrEqual(normalizedCap(cap));

          for (const candidate of related) {
            expect(PROJECT_IDS.has(candidate.id)).toBe(true);
            expect(candidate).toBe(getProjectById(candidate.id));
            expect(candidate.id).not.toBe(project.id);
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
