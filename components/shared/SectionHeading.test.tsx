import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionHeading } from "@/components/shared/SectionHeading";

describe("SectionHeading", () => {
  it("renders the title as an h2 by default", () => {
    render(<SectionHeading title="Featured Projects" />);

    // Homepage sections sit under the Hero's single h1 (task 44.2).
    expect(
      screen.getByRole("heading", { level: 2, name: "Featured Projects" }),
    ).toBeInTheDocument();
  });

  it.each(["h1", "h2", "h3"] as const)(
    "renders the title as %s when requested and scales type to match",
    (titleAs) => {
      const { container } = render(
        <SectionHeading title="All Projects" titleAs={titleAs} />,
      );

      const heading = container.querySelector<HTMLElement>(
        "[data-slot='section-heading-title']",
      );
      expect(heading?.tagName.toLowerCase()).toBe(titleAs);
      expect(heading?.className).toContain(`text-${titleAs}`);
    },
  );

  it("renders the subtitle when supplied", () => {
    render(
      <SectionHeading
        title="Latest Blogs"
        subtitle="Notes on what I am building and learning."
      />,
    );

    expect(
      screen.getByText("Notes on what I am building and learning."),
    ).toBeInTheDocument();
  });

  it("omits the subtitle and divider slots entirely when not requested", () => {
    const { container } = render(<SectionHeading title="Certifications" />);

    expect(
      container.querySelector("[data-slot='section-heading-subtitle']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='section-heading-divider']"),
    ).toBeNull();
  });

  it("hides the optional divider from assistive technology", () => {
    const { container } = render(<SectionHeading title="Hackathons" divider />);

    const divider = container.querySelector<HTMLElement>(
      "[data-slot='section-heading-divider']",
    );
    expect(divider).not.toBeNull();
    expect(divider?.getAttribute("aria-hidden")).toBe("true");
    // Decorative, so it must contribute no text to the heading block.
    expect(container.textContent).toBe("Hackathons");
  });

  it("puts titleId on the heading so a section can name itself with it", () => {
    render(
      <section aria-labelledby="projects-title">
        <SectionHeading title="Featured Projects" titleId="projects-title" />
      </section>,
    );

    expect(
      screen.getByRole("region", { name: "Featured Projects" }),
    ).toBeInTheDocument();
  });

  it("renders no navigation control of its own (Requirement 17.3)", () => {
    const { container } = render(
      <SectionHeading
        title="Featured Projects"
        subtitle="A few favourites."
        divider
      />,
    );

    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("lets caller utilities override the defaults", () => {
    const { container } = render(
      <SectionHeading title="Education" className="gap-6 text-center" />,
    );

    const wrapper = container.querySelector<HTMLElement>(
      "[data-slot='section-heading']",
    );
    expect(wrapper?.className).toContain("gap-6");
    expect(wrapper?.className).not.toContain("gap-3");
  });
});
