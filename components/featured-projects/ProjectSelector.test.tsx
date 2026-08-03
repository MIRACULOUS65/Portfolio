import { render } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";

import { ProjectSelector } from "@/components/featured-projects/ProjectSelector";
import type { Project } from "@/types/project";

const NUM_RUNS = 100;

/** A minimal, structurally valid `Project` fixture for a given index. */
function project(index: number): Project {
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
    featured: true,
    pinned: false,
    archived: false,
    technologies: [],
    features: [],
    challenges: [],
    learnings: [],
    architecture: [],
    screenshots: [],
    relatedProjects: [],
  };
}

/** Non-empty, arbitrary-length list of distinct `Project`s. */
const arbitraryProjects: fc.Arbitrary<Project[]> = fc
  .integer({ min: 1, max: 12 })
  .map((length) => Array.from({ length }, (_, index) => project(index)));

// Feature: developer-portfolio, Property 8: ProjectSelector renders exactly
// the resolved featured project count
//
// For any resolved featured project list of any length, ProjectSelector
// renders exactly one list item per project, in the same order, with the
// active-state indicator on exactly the entry matching `selectedIndex`.
//
// **Validates: Requirements 9.1**
describe("Property 8: ProjectSelector renders exactly the resolved featured project count", () => {
  it("renders exactly one item per project, in order, with exactly one marked selected", () => {
    fc.assert(
      fc.property(
        arbitraryProjects,
        fc.nat(),
        (projects, rawIndex) => {
          const selectedIndex = rawIndex % projects.length;

          const { container } = render(
            <ProjectSelector
              projects={projects}
              selectedIndex={selectedIndex}
              onSelect={() => {}}
            />,
          );

          const items = Array.from(
            container.querySelectorAll("[data-slot='project-selector-item']"),
          );

          expect(items).toHaveLength(projects.length);

          const titles = items.map(
            (item) =>
              item.querySelector("[data-slot='project-selector-button'] span")
                ?.textContent,
          );
          expect(titles).toEqual(projects.map((p) => p.title));

          const selectedFlags = items.map(
            (item) => (item as HTMLElement).dataset.selected,
          );
          expect(selectedFlags.filter((flag) => flag === "true")).toHaveLength(
            1,
          );
          expect(selectedFlags[selectedIndex]).toBe("true");
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});

describe("ProjectSelector", () => {
  it("calls onSelect with the clicked project's index, never mutating locally", () => {
    const projects = [project(0), project(1), project(2)];
    const onSelect = vi.fn();

    const { getAllByRole } = render(
      <ProjectSelector
        projects={projects}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    const buttons = getAllByRole("button");
    buttons[2]?.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
