"use client";

import { AnimatePresence, motion } from "motion/react";

import { Badge } from "@/components/shared/Badge";
import { DURATION } from "@/lib/motion";
import { getTechnologyById } from "@/lib/data-access";
import type { Project } from "@/types";

/**
 * The Featured Projects detail panel (Requirements 9.9, 9.11,
 * design.md "FeaturedProjectsSection — Atomic Selection Design").
 *
 * Renders title/features/technology badges from a single `project` prop — the
 * same `state.project` `FeaturedProjectsClient` also hands to `VideoPlayer`,
 * so every field here always describes the same project the video is
 * currently showing (Requirement 9.5's atomicity, held by construction: one
 * prop, one project). The prose `description` is intentionally not rendered
 * here — it now lives only on the dedicated project page — and the
 * `github`/`liveDemo` links moved to `ProjectSelector`, next to each project's
 * title, so this panel stays a compact features + tech list.
 *
 * ## Cross-fade (Requirement 9.9)
 *
 * `AnimatePresence mode="wait"` keyed by `project.id` cross-fades the whole
 * panel whenever the selection changes, capped at `DURATION.standard` (250ms,
 * under the 300ms ceiling). `mode="wait"` means the outgoing panel finishes
 * fading out before the incoming one fades in, so old and new content are
 * never both partially visible mid-transition. Only `opacity` is animated —
 * transform/opacity only, per Requirement 24.4.
 *
 * ## Explore More (Requirement 9.11, 17.1) now lives at the Section level
 *
 * The section's one `ExploreMoreButton` used to render here, tucked under the
 * details panel only. Per the reference design it now spans the full width
 * below the *entire* grid (video + selector + details), which `Section`'s own
 * `exploreMoreHref` mechanism already renders correctly — see
 * `app/page.tsx`'s `Section id="projects"` usage. `ProjectDetails` no longer
 * renders one at all, so "exactly one Explore More button" for this section
 * is still satisfied, just sourced from `Section` like every other preview
 * section instead of from this component.
 *
 * Technology ids resolve through `getTechnologyById` (the data-access layer's
 * single entry point, Requirement 4.2) rather than embedding technology data
 * on `Project` itself.
 *
 * Client Component only because `AnimatePresence`/`motion` require it; it
 * receives fully-resolved props and performs no data fetching of its own.
 *
 * ## Sizing: matching `ProjectSelector`'s visual weight at `lg`
 *
 * `ProjectSelector`'s cards carry generous `p-6` padding and a `text-h4`
 * title, which made this panel — a `text-h3` title over a compact,
 * tightly-spaced bullet list — visually lighter than the column beside it and
 * left its bottom edge noticeably short of the selector's own at the `lg`
 * two-column layout. The wrapping column gap, the feature list's type size
 * and per-item spacing, and the tech badge row's gap are all widened here
 * (still restyling the same `project.features`/`project.technologies` data,
 * no new content) so the whole panel — title, features, badges — reaches
 * roughly the same bottom edge as the selector column without changing what
 * either renders.
 */
export interface ProjectDetailsProps {
  project: Project;
  className?: string;
}

export function ProjectDetails({ project, className }: ProjectDetailsProps) {
  return (
    <div data-slot="project-details" className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          key={project.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.standard }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <h3 className="text-h3 text-foreground">{project.title}</h3>
          </div>

          {project.features.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5 text-body leading-relaxed text-muted-foreground">
              {project.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          ) : null}

          {project.technologies.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {project.technologies.map((technologyId) => {
                const technology = getTechnologyById(technologyId);
                if (!technology) return null;

                return (
                  <Badge
                    key={technology.id}
                    label={technology.name}
                    color={technology.color}
                  />
                );
              })}
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
