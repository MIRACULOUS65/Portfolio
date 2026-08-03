import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeaturedProjectsClient } from "@/components/featured-projects/FeaturedProjectsClient";
import type { Project } from "@/types/project";

/**
 * Unit tests for FeaturedProjectsClient (task 23.6, Requirements 9.7, 9.8,
 * 9.10, 9.13).
 *
 * `next/navigation`'s `useRouter` is mocked the same way `Navbar.test.tsx`
 * does it — jsdom has no App Router context — so a call to `router.push`
 * from anywhere in this subtree would be observable, even though
 * `FeaturedProjectsClient` never imports `useRouter` itself.
 */
const routerMocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerMocks.push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

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
    youtubeVideoId: `video-${index}`,
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

const projects = [project(0), project(1), project(2)];

describe("FeaturedProjectsClient", () => {
  beforeEach(() => {
    routerMocks.push.mockClear();
    // jsdom ships no IntersectionObserver; VideoPlayer feature-detects and
    // "fails open" (mounts the iframe immediately) when it is absent — see
    // VideoPlayer.tsx's own doc comment — which is exactly what these tests
    // need to observe COMMIT/FAIL without a real observer.
    vi.stubGlobal("IntersectionObserver", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never calls router.push when a selector card is clicked (Requirement 9.8)", async () => {
    const user = userEvent.setup();
    render(<FeaturedProjectsClient projects={projects} />);

    for (const target of [project(1), project(2), project(0)]) {
      const button = screen.getByRole("button", {
        name: new RegExp(`^${target.title}\\b`),
      });
      await user.click(button);
    }

    expect(routerMocks.push).not.toHaveBeenCalled();
  });

  it("renders the video iframe once VideoPlayer reports near-viewport (Requirement 9.10)", () => {
    const { container } = render(
      <FeaturedProjectsClient projects={projects} />,
    );

    // No IntersectionObserver in this environment: VideoPlayer fails open and
    // mounts the iframe for the initially-selected project immediately.
    const iframe = container.querySelector(
      "[data-slot='video-player-iframe']",
    );
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining(projects[0]!.youtubeVideoId!),
    );
  });

  it("keeps the document height unchanged after selecting a different project (Requirement 9.13)", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FeaturedProjectsClient projects={projects} />,
    );

    const heightBefore = container.querySelector(
      "[data-slot='video-player']",
    )?.clientHeight;

    const button = screen.getByRole("button", {
      name: new RegExp(`^${project(1).title}\\b`),
    });
    await user.click(button);

    const heightAfter = container.querySelector(
      "[data-slot='video-player']",
    )?.clientHeight;

    expect(heightAfter).toBe(heightBefore);
  });

  it("agrees on a single selected project across VideoPlayer, ProjectSelector, and ProjectDetails (Requirement 9.5)", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FeaturedProjectsClient projects={projects} />,
    );

    const target = project(2);
    const button = screen.getByRole("button", {
      name: new RegExp(`^${target.title}\\b`),
    });
    await user.click(button);

    const iframe = container.querySelector(
      "[data-slot='video-player-iframe']",
    );
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining(target.youtubeVideoId!),
    );

    const selectedItem = container.querySelector(
      "[data-slot='project-selector-item'][data-selected='true']",
    );
    expect(selectedItem?.textContent).toContain(target.title);

    await waitFor(() => {
      const details = container.querySelector(
        "[data-slot='project-details']",
      );
      expect(details?.textContent).toContain(target.title);
    });
  });
});
