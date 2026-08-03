import { FeaturedProjectsClient } from "@/components/featured-projects/FeaturedProjectsClient";
import { getFeaturedProjectsResolved } from "@/lib/data-access";

/**
 * The Homepage's FeaturedProjectsSection (Requirements 9.1, 9.3,
 * design.md "FeaturedProjectsSection — Atomic Selection Design").
 *
 * Resolves `getFeaturedProjectsResolved()` — the ordered, id-resolved
 * `Project[]` (Requirement 9.1, 9.3) — and passes it as a plain serializable
 * prop into the Client island. No id-resolution logic runs in the browser.
 *
 * Renders nothing when the resolved list is empty (an unreachable case in a
 * shipped build, since `lib/validate-data.ts` requires at least one featured
 * project — see `reducer.ts#initialSelectionState`'s own guard) rather than
 * constructing a Client component with no valid initial selection.
 *
 * Server Component: reads only the static `Project`/`FeaturedProjectsConfig`
 * datasets through `lib/data-access.ts` (Requirement 4.2), no state, no
 * effects.
 */
export function FeaturedProjectsSection() {
  const projects = getFeaturedProjectsResolved();

  if (projects.length === 0) {
    return null;
  }

  return <FeaturedProjectsClient projects={projects} />;
}
