import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/footer/Footer";
import {
  getNavigationItems,
  getSiteConfig,
  getSocials,
} from "@/lib/data-access";

/**
 * Unit tests for Footer (task 33.4, Requirements 16.4, 16.5).
 *
 * Footer's own position relative to the rest of the document (rendered
 * *after* all homepage sections, Requirement 16.5) is verified separately in
 * `app/layout.test.tsx`, since that is a property of `RootLayout`'s
 * composition, not of `Footer` in isolation.
 */
describe("Footer", () => {
  it("renders every navigation link from getNavigationItems()", () => {
    render(<Footer />);

    const nav = screen.getByRole("navigation", { name: "Footer" });
    for (const item of getNavigationItems()) {
      expect(
        screen.getByRole("link", { name: item.label }),
      ).toBeInTheDocument();
    }
    expect(nav).toBeInTheDocument();
  });

  it("renders a social link for every visible Social entry, and none for hidden ones", () => {
    const { container } = render(<Footer />);

    const socials = getSocials();
    const visible = socials.filter((social) => social.visible);
    const hidden = socials.filter((social) => !social.visible);

    const socialLinks = container.querySelectorAll(
      "[data-slot='footer-socials'] a",
    );
    expect(socialLinks).toHaveLength(visible.length);

    for (const social of visible) {
      expect(
        screen.getByRole("link", { name: social.platform }),
      ).toBeInTheDocument();
    }
    for (const social of hidden) {
      expect(
        screen.queryByRole("link", { name: social.platform }),
      ).toBeNull();
    }
  });

  it("renders copyright text with the current year and the site's name", () => {
    render(<Footer />);

    const year = new Date().getFullYear();
    const site = getSiteConfig();

    expect(
      screen.getByText(`© ${year} ${site.siteName}. All rights reserved.`),
    ).toBeInTheDocument();
  });
});
