import { GitBranch, SquareArrowOutUpRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/utils/cn";
import type { Project } from "@/types";

// Grid pattern helper functions
function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: React.ComponentProps<"svg"> & {
  width: number;
  height: number;
  x: string;
  y: string;
  squares?: number[][];
}) {
  const patternId = React.useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y], index) => (
            <rect
              strokeWidth="0"
              key={index}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

function genRandomPattern(length?: number): number[][] {
  length = length ?? 5;
  return Array.from({ length }, () => [
    Math.floor(Math.random() * 4) + 7,
    Math.floor(Math.random() * 6) + 1,
  ]);
}

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
  // Generate stable patterns using project ID instead of random
  const getStablePattern = (projectId: string): number[][] => {
    // Use project ID as seed for consistent pattern
    const seed = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const length = 5;
    return Array.from({ length }, (_, i) => {
      const x = ((seed + i * 7) % 4) + 7;
      const y = ((seed + i * 3) % 6) + 1;
      return [x, y];
    });
  };

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
        const p = getStablePattern(project.id);

        return (
          <div
            key={project.id}
            role="listitem"
            data-slot="project-selector-item"
            data-selected={isSelected ? "true" : "false"}
            className={cn(
              "relative flex w-80 shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border p-6 transition-[transform,scale,border-color] duration-500 ease-out lg:w-full",
              "bg-linear-to-br from-[#010101] via-[#090909] to-[#010101]",
              isSelected
                ? "scale-105 -translate-y-2 border-white/25"
                : "border-white/10 hover:scale-105 hover:-translate-y-2 hover:border-white/25",
            )}
          >
            {/* Grid pattern overlay */}
            <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full mask-[linear-gradient(white,transparent)]">
              <div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-linear-to-r mask-[radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
                <GridPattern
                  width={20}
                  height={20}
                  x="-12"
                  y="4"
                  squares={p}
                  className="fill-foreground/5 stroke-foreground/25 absolute inset-0 h-full w-full mix-blend-overlay"
                />
              </div>
            </div>

            <div className="relative z-10 flex items-start justify-between gap-3">
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
