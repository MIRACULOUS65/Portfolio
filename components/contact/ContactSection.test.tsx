import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactSection } from "@/components/contact/ContactSection";
import { getProfile, getSocials } from "@/lib/data-access";

describe("ContactSection", () => {
  it("renders the #contact section with a ContactCard inside", () => {
    const { container } = render(<ContactSection />);

    const section = container.querySelector<HTMLElement>("#contact");
    expect(section?.tagName.toLowerCase()).toBe("section");
    expect(container.querySelector("[data-slot='contact-card']")).not.toBeNull();
  });

  it("renders no Explore More button — Contact is exempt (Requirement 6.3)", () => {
    const { container } = render(<ContactSection />);

    expect(
      container.querySelectorAll("[data-slot='explore-more-button']"),
    ).toHaveLength(0);
  });

  it("renders the four fixed contact methods sourced from the Social dataset", () => {
    render(<ContactSection />);

    const socials = getSocials();
    for (const platform of ["Email", "GitHub", "LinkedIn", "X"] as const) {
      const social = socials.find((entry) => entry.platform === platform);
      expect(social).toBeDefined();
    }

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it("renders a resume download action pointing at the Profile's resume path", () => {
    render(<ContactSection />);

    const resumeLink = screen.getByText("Download Resume").closest("a");
    expect(resumeLink).toHaveAttribute("href", getProfile().resume);
    expect(resumeLink).toHaveAttribute("download");
  });

  it("renders a primary CTA linking to a mailto: of the Profile's email", () => {
    render(<ContactSection />);

    const cta = screen.getByText("Get in Touch").closest("a");
    expect(cta).toHaveAttribute("href", `mailto:${getProfile().email}`);
  });
});
