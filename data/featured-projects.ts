/**
 * Featured Projects dataset — the homepage FeaturedProjectsSection's playlist
 * (Requirements 4.1, 4.5).
 *
 * Conventions carried over from `data/technologies.ts`: one named export, typed
 * against the entity type from the `@/types` barrel, data only (no functions and
 * no imports beyond types), and ids treated as a public contract.
 *
 * ## References only — never embedded Project data
 *
 * Each entry is a `Project.id` plus a display `order`. No project title,
 * description, video id, or image appears here, so featured content cannot drift
 * from `data/projects.ts` (Requirements 4.5, 4.16). `lib/validate-data.ts` fails
 * the build when a `projectId` does not resolve to a project, and every id below
 * belongs to a project marked `featured: true`.
 *
 * ## Order is data, not array position
 *
 * `getFeaturedProjectsResolved()` sorts by `order` ascending and the first
 * resolved project is the default selection (Requirements 4.5, 9.1, 9.3).
 * `order` values are distinct — no ties, so the resolved sequence is total and
 * unambiguous.
 *
 * The array below is deliberately written **out of `order` sequence**. The first
 * literal entry is not the default selection, so any consumer that forgets to
 * sort produces an observably different list instead of accidentally passing.
 *
 * ## Count is not fixed
 *
 * Three references are configured here — the real resume projects only.
 * `data/projects.ts` keeps the template placeholder entries for the
 * `/projects` listing page, but they are deliberately not referenced here so
 * they never surface on the homepage. The section renders however many exist
 * — adding or removing an entry needs no component change (Requirement 9.1),
 * and because three is fewer than the total projects in the dataset, the
 * homepage preview stays a strict subset of `/projects` (Requirement 17.1).
 */

import type { FeaturedProjectsConfig } from "@/types";

export const featuredProjects: FeaturedProjectsConfig = [
  { projectId: "aerosense", order: 1 },
  { projectId: "novaaid", order: 2 },
  { projectId: "digital-health-records", order: 3 },
];
