import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Section } from "@/components/shared/Section";
import { DEFAULT_EXPLORE_MORE_LABEL } from "@/components/shared/ExploreMoreButton";

const EXPLORE_MORE = "[data-slot='explore-more-button']";

describe("Section", () => {
  it("renders a real <section> carrying the supplied HTML id (Requirement 6.2)", () => {
    const { container } = render(
      <Section id="projects" title="Featured Projects">
        <p>content</p>
      </Section>,
    );

    const section = container.querySelector<HTMLElement>("#projects");
    expect(section?.tagName.toLowerCase()).toBe("section");
  });

  it("names the region with its own heading text", () => {
    render(
      <Section id="certifications" title="Certifications">
        <p>content</p>
      </Section>,
    );

    // Exposed as a landmark only because aria-labelledby resolves to the heading.
    expect(
      screen.getByRole("region", { name: "Certifications" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Certifications" }),
    ).toHaveAttribute("id", "certifications-title");
  });

  it("allows an h1 override for dedicated pages while defaulting to h2", () => {
    render(
      <Section id="projects" title="All Projects" titleAs="h1">
        <p>content</p>
      </Section>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "All Projects" }),
    ).toBeInTheDocument();
  });

  it("renders the subtitle and children it is given", () => {
    render(
      <Section
        id="blog"
        title="Latest Blogs"
        subtitle="Notes on what I am building."
      >
        <p>post list</p>
      </Section>,
    );

    expect(
      screen.getByText("Notes on what I am building."),
    ).toBeInTheDocument();
    expect(screen.getByText("post list")).toBeInTheDocument();
  });

  it("renders exactly one Explore More button when exploreMoreHref is supplied (Requirement 17.1)", () => {
    const { container } = render(
      <Section
        id="hackathons"
        title="Hackathons"
        exploreMoreHref="/hackathons"
        exploreMoreLabel="Explore all hackathons"
      >
        <p>hackathon list</p>
      </Section>,
    );

    const links = container.querySelectorAll(EXPLORE_MORE);
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/hackathons");
    expect(
      screen.getByRole("link", { name: "Explore all hackathons" }),
    ).toBeInTheDocument();
  });

  it("falls back to the shared default Explore More label", () => {
    render(
      <Section id="blog" title="Latest Blogs" exploreMoreHref="/blog">
        <p>post list</p>
      </Section>,
    );

    expect(
      screen.getByRole("link", { name: DEFAULT_EXPLORE_MORE_LABEL }),
    ).toBeInTheDocument();
  });

  it.each([
    ["omitted", undefined],
    ["blank", "   "],
  ])(
    "renders zero Explore More buttons and no links when the href is %s (Requirement 6.3)",
    (_case, exploreMoreHref) => {
      const { container } = render(
        <Section id="contact" title="Contact" exploreMoreHref={exploreMoreHref}>
          <p>contact card</p>
        </Section>,
      );

      expect(container.querySelectorAll(EXPLORE_MORE)).toHaveLength(0);
      expect(
        container.querySelector("[data-slot='section-explore-more']"),
      ).toBeNull();
      // Hero and Contact are exempt, so the shell adds no routing control at all.
      expect(container.querySelectorAll("a")).toHaveLength(0);
    },
  );

  it("keeps a scroll offset so hash navigation clears the sticky navbar, overridable by the caller", () => {
    const { container } = render(
      <Section id="education" title="Education">
        <p>content</p>
      </Section>,
    );
    const section = container.querySelector<HTMLElement>("#education");
    expect(section?.className).toContain("scroll-mt-");

    const { container: overridden } = render(
      <Section id="tech-stack" title="Tech Stack" className="scroll-mt-32">
        <p>content</p>
      </Section>,
    );
    const overriddenSection =
      overridden.querySelector<HTMLElement>("#tech-stack");
    expect(overriddenSection?.className).toContain("scroll-mt-32");
    expect(overriddenSection?.className).not.toContain(
      "scroll-mt-[var(--section-scroll-margin,5rem)]",
    );
  });
});
