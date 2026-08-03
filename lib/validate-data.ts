/**
 * Build-time referential integrity validation for the DataLayer.
 *
 * `lib/data-access.ts`'s selectors resolve id references
 * (`getProjectById`, `getTechnologyById`) rather than throwing on a dangling
 * one — a miss quietly becomes `undefined` and, in a few selectors, is
 * filtered out of the result. That keeps runtime rendering resilient, but it
 * means a typo'd id in `data/*.ts` would otherwise ship silently: a project
 * dropped from `getFeaturedProjectsResolved()`, a technology badge that never
 * renders, and so on.
 *
 * This script is the other half of that contract (Requirements 4.5, 4.16): it
 * walks every reference field the data layer defines and fails the build with
 * a clear, complete report the moment one of them cannot resolve, rather than
 * letting the gap reach production.
 *
 * ## What is checked
 *
 * 1. `FeaturedProjectEntry.projectId` (in `data/featured-projects.ts`)
 *    resolves to a `Project.id`.
 * 2. `Project.relatedProjects[]` entries resolve to a `Project.id`.
 * 3. `Project.technologies[]` entries resolve to a `Technology.id`.
 * 4. `Hackathon.technologies[]` entries resolve to a `Technology.id`.
 * 5. `Certification.technologies[]` entries resolve to a `Technology.id`.
 *
 * Resolution is checked directly against the canonical datasets
 * (`data/projects.ts`, `data/technologies.ts`) rather than through
 * `lib/data-access.ts`'s selectors, so this script keeps working even if a
 * selector's failure mode ever changes from "skip" to something else — the
 * two are independent guards over the same invariant.
 *
 * ## Usage
 *
 * ```
 * npm run validate-data
 * ```
 *
 * Wired into `prebuild`, so `npm run build` never produces an artifact from a
 * dataset with a dangling reference. Exits `0` (and prints nothing) when every
 * reference resolves; exits `1` and prints one line per dangling reference
 * otherwise.
 */

import { pathToFileURL } from "node:url";

import { certifications } from "@/data/certifications";
import { featuredProjects } from "@/data/featured-projects";
import { hackathons } from "@/data/hackathons";
import { projects } from "@/data/projects";
import { technologies } from "@/data/technologies";

/** One dangling reference found while walking the reference graph. */
type ValidationError = {
  /** Human-readable description of where the dangling reference lives. */
  readonly location: string;
  /** The id that failed to resolve. */
  readonly reference: string;
  /** What kind of record the reference was expected to resolve to. */
  readonly expectedKind: "Project" | "Technology";
};

function formatError(error: ValidationError): string {
  return `  - ${error.location} references ${error.expectedKind} id "${error.reference}", which does not exist`;
}

/**
 * Walks every documented reference field and returns every dangling one
 * found. Never throws — a missing/malformed dataset produces its own crash
 * long before this function runs, and every field here is a plain `string[]`
 * per the type definitions.
 */
export function findDanglingReferences(): readonly ValidationError[] {
  const projectIds = new Set(projects.map((project) => project.id));
  const technologyIds = new Set(technologies.map((technology) => technology.id));

  const errors: ValidationError[] = [];

  // 1. FeaturedProjectEntry.projectId -> Project.id
  for (const entry of featuredProjects) {
    if (!projectIds.has(entry.projectId)) {
      errors.push({
        location: `data/featured-projects.ts entry (order ${entry.order})`,
        reference: entry.projectId,
        expectedKind: "Project",
      });
    }
  }

  for (const project of projects) {
    // 2. Project.relatedProjects[] -> Project.id
    for (const relatedId of project.relatedProjects) {
      if (!projectIds.has(relatedId)) {
        errors.push({
          location: `data/projects.ts Project "${project.id}".relatedProjects`,
          reference: relatedId,
          expectedKind: "Project",
        });
      }
    }

    // 3. Project.technologies[] -> Technology.id
    for (const techId of project.technologies) {
      if (!technologyIds.has(techId)) {
        errors.push({
          location: `data/projects.ts Project "${project.id}".technologies`,
          reference: techId,
          expectedKind: "Technology",
        });
      }
    }
  }

  // 4. Hackathon.technologies[] -> Technology.id
  for (const hackathon of hackathons) {
    for (const techId of hackathon.technologies) {
      if (!technologyIds.has(techId)) {
        errors.push({
          location: `data/hackathons.ts Hackathon "${hackathon.id}".technologies`,
          reference: techId,
          expectedKind: "Technology",
        });
      }
    }
  }

  // 5. Certification.technologies[] -> Technology.id
  for (const certification of certifications) {
    for (const techId of certification.technologies) {
      if (!technologyIds.has(techId)) {
        errors.push({
          location: `data/certifications.ts Certification "${certification.id}".technologies`,
          reference: techId,
          expectedKind: "Technology",
        });
      }
    }
  }

  return errors;
}

function main(): void {
  const errors = findDanglingReferences();

  if (errors.length === 0) {
    console.log(
      `validate-data: OK — every FeaturedProjectEntry.projectId, relatedProjects, ` +
        `and technologies[] reference resolved (${projects.length} projects, ` +
        `${technologies.length} technologies, ${hackathons.length} hackathons, ` +
        `${certifications.length} certifications, ${featuredProjects.length} featured entries checked).`,
    );
    return;
  }

  console.error(
    `validate-data: FAILED — found ${errors.length} dangling reference${
      errors.length === 1 ? "" : "s"
    } in the DataLayer:\n`,
  );

  for (const error of errors) {
    console.error(formatError(error));
  }

  console.error(
    "\nFix the dataset in data/*.ts so every id above resolves, then re-run `npm run validate-data`.",
  );

  process.exit(1);
}

// Only run when executed directly (`npm run validate-data` / `tsx
// lib/validate-data.ts`) — never on import, so a test file can import
// `findDanglingReferences` without triggering `process.exit`.
if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
