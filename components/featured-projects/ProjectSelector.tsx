import { GitBranch, SquareArrowOutUpRight } from "lucide-react";

import { cn } from "@/utils/cn";
import type { Project } from "@/types";

/**
 * The Featured Projects card list (Requirements 9.1, 9.4, 23.5,
 * design.md "FeaturedProjectsSection — Atomic Selection Design").
 *
 * Renders exactly the resolved featured project list handed to it — any
 * length, never hardcoded to three (Requirement 9.1, Property 8) — as cards
 * with title, one-line description, GitHub/demo links, and an active-state
 * indicator driven by `selectedIndex` (Requirement 9.4).
 *
 * ## Selection is reported, never owned
 *
 * This component holds no state of its own: `selectedIndex` is a prop, and
 * clicking a card calls `onSelect(index)` rather than mutating anything
 * locally. `FeaturedProjectsClient` is the sole owner of `SelectionState`
 * (design.md's atomic selection design), so every card in every render agrees
 * with the single source of truth by construction.
 *
 * ## Mobile: horizontal scroll, not a stacked list
 *
 * `flex-row overflow-x-auto` at all widths, widening only in card size at
 * `lg`, renders the selector as a horizontally scrollable strip on narrow
 * viewports — the format Requirement 23.5/9.12 calls for in the mobile
 * ordering (video → horizontal selector → details → buttons).
 *
 * Purely presentational: no state, no effects, no data access — `projects`
 * arrives fully resolved from the caller.
 */
export interface ProjectSelectorProps {
  projects: readonly Project[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Extra utilities merged onto the list; conflicting classes win (see `cn`). */
  className?: string;
}

export function ProjectSelector({
  projects,
  selectedIndex,
  onSelect,
  className,
}: ProjectSelectorProps) {
  return (
    <div
      data-slot="project-selector"
      role="list"
      className={cn(
        "flex flex-row gap-4 overflow-x-auto pb-2",
        "lg:flex-col lg:overflow-x-visible lg:pb-0",
        className,
      )}
    >
      {projects.map((project, index) => {
        const isSelected = index === selectedIndex;

        return (
          <div
            key={project.id}
            role="listitem"
            data-slot="project-selector-item"
            data-selected={isSelected ? "true" : "false"}
            className={cn(
              "flex w-80 shrink-0 flex-col gap-3 rounded-2xl border p-6 transition-[transform,scale,rotate,border-color] duration-500 ease-out lg:w-full",
              "bg-linear-to-br from-[#010101] via-[#090909] to-[#010101]",
              isSelected
                ? "scale-105 -rotate-1 border-white/25"
                : "border-white/10 hover:scale-105 hover:-rotate-1 hover:border-white/25",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                data-slot="project-selector-button"
                aria-current={isSelected ? "true" : undefined}
                onClick={() => onSelect(index)}
                className="flex flex-1 flex-col gap-2 text-left"
              >
                <span className="text-h4 font-medium text-foreground">
                  {project.title}
                </span>
                <span className="text-body text-muted-foreground">
                  {project.shortDescription}
                </span>
              </button>

              {project.github || project.liveDemo ? (
                <span className="flex items-center gap-3 pt-0.5">
                  {project.github ? (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.title} source on GitHub`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <GitBranch aria-hidden="true" className="size-4" />
                    </a>
                  ) : null}
                  {project.liveDemo ? (
                    <a
                      href={project.liveDemo}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.title} live demo`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <SquareArrowOutUpRight
                        aria-hidden="true"
                        className="size-4"
                      />
                    </a>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
