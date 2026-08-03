import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_EXPLORE_MORE_LABEL,
  ExploreMoreButton,
} from "@/components/shared/ExploreMoreButton";

describe("ExploreMoreButton", () => {
  it("renders exactly one anchor pointing at the dedicated page", () => {
    const { container } = render(
      <ExploreMoreButton href="/projects" label="Explore all projects" />,
    );

    // Requirement 17.1: one section, one Explore More control. The component is
    // a single link so the count is structural, not a convention.
    const anchors = container.querySelectorAll("a");
    expect(anchors).toHaveLength(1);
    expect(anchors[0].getAttribute("href")).toBe("/projects");
    expect(
      container.querySelectorAll("[data-slot='explore-more-button']"),
    ).toHaveLength(1);
  });

  it("uses the descriptive label as the link's accessible name", () => {
    render(<ExploreMoreButton href="/blog" label="Read all blog posts" />);

    expect(
      screen.getByRole("link", { name: "Read all blog posts" }),
    ).toBeInTheDocument();
  });

  it("renders the arrow decoratively so it does not pollute the accessible name", () => {
    const { container } = render(
      <ExploreMoreButton href="/hackathons" label="See every hackathon" />,
    );

    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(container.textContent).toBe("See every hackathon");
  });

  it("falls back to a usable name when the label is blank", () => {
    render(<ExploreMoreButton href="/certifications" label="   " />);

    expect(
      screen.getByRole("link", { name: DEFAULT_EXPLORE_MORE_LABEL }),
    ).toBeInTheDocument();
  });

  it("carries the design system's button styling and a visible focus indicator", () => {
    const { container } = render(
      <ExploreMoreButton href="/projects" label="Explore all projects" />,
    );

    const link = container.querySelector<HTMLAnchorElement>("a");
    // Composed from `buttonVariants` on a real anchor rather than an anchor
    // nested in a <button>.
    expect(link?.className).toContain("inline-flex");
    expect(link?.className).toContain("focus-visible:outline-ring");
    // Hover motion is transform-only and cancelled under reduced motion.
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      "motion-reduce:group-hover:translate-x-0",
    );
  });

  it("lets caller utilities override the defaults", () => {
    const { container } = render(
      <ExploreMoreButton
        href="/projects"
        label="Explore all projects"
        className="w-full"
      />,
    );

    expect(container.querySelector("a")?.className).toContain("w-full");
  });
});
