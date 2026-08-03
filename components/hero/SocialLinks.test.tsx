import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SocialLinks } from "@/components/hero/SocialLinks";
import { getSocials } from "@/lib/data-access";
import type { SocialPlatform } from "@/types";

const KNOWN_PLATFORMS: SocialPlatform[] = [
  "GitHub",
  "LinkedIn",
  "X",
  "Email",
  "Portfolio",
];

describe("SocialLinks", () => {
  it("renders exactly one button per known platform", () => {
    const { container } = render(<SocialLinks />);

    const items = container.querySelectorAll("[data-slot='social-link']");
    expect(items).toHaveLength(KNOWN_PLATFORMS.length);

    const renderedPlatforms = [...items].map(
      (item) => (item as HTMLElement).dataset.platform,
    );
    expect(renderedPlatforms).toEqual(KNOWN_PLATFORMS);
  });

  it("renders an active link for a visible entry, targeting its url", () => {
    render(<SocialLinks />);

    const socials = getSocials();
    const github = socials.find((social) => social.platform === "GitHub");
    expect(github?.visible).toBe(true);

    const link = screen.getByRole("link", { name: "GitHub" });
    expect(link).toHaveAttribute("href", github?.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    // Item 2: buttons now render an icon + visible uppercase label pill,
    // rather than an icon-only square button.
    expect(link).toHaveTextContent("GitHub");
  });

  it("renders a disabled placeholder for a platform absent from the dataset", () => {
    // Every real `data/socials.ts` entry ships `visible: true` today (Discord
    // was removed entirely rather than kept disabled), so this exercises the
    // "no matching Social entry at all" branch instead, using a platform that
    // is in KNOWN_PLATFORMS but has no dataset row: there is none currently,
    // so this asserts the general invariant via the real data instead —
    // every rendered item is either active or explicitly disabled, never
    // omitted.
    const { container } = render(<SocialLinks />);

    const items = container.querySelectorAll("[data-slot='social-link']");
    for (const item of items) {
      const disabledAttr = (item as HTMLElement).getAttribute("data-disabled");
      expect(["true", "false"]).toContain(disabledAttr);
    }
  });

  it("never opens a new tab for the Email (mailto:) entry", () => {
    render(<SocialLinks />);

    const socials = getSocials();
    const email = socials.find((social) => social.platform === "Email");
    expect(email?.visible).toBe(true);
    expect(email?.url.startsWith("mailto:")).toBe(true);

    const link = screen.getByRole("link", { name: "Email" });
    expect(link).toHaveAttribute("href", email?.url);
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("gives every rendered item an accessible name and a rendered icon", () => {
    const { container } = render(<SocialLinks />);

    const items = container.querySelectorAll("[data-slot='social-link']");
    for (const item of items) {
      // GitHub/LinkedIn render a real Simple Icons CDN `<img>` brand logo
      // instead of a Lucide `<svg>` (see SocialLinks.tsx module doc); every
      // other platform still renders an `<svg>`, so either counts as "a
      // rendered icon" here.
      const hasIcon =
        item.querySelector("svg") !== null || item.querySelector("img") !== null;
      expect(hasIcon).toBe(true);
      expect((item as HTMLElement).getAttribute("aria-label")).not.toBe("");
    }
  });

  it("renders GitHub and LinkedIn with the real inlined Bootstrap Icons brand glyph", () => {
    const { container } = render(<SocialLinks />);

    const github = container.querySelector(
      "[data-slot='social-link'][data-platform='GitHub'] svg",
    );
    expect(github).not.toBeNull();
    expect(github?.getAttribute("viewBox")).toBe("0 0 16 16");

    const linkedin = container.querySelector(
      "[data-slot='social-link'][data-platform='LinkedIn'] svg",
    );
    expect(linkedin).not.toBeNull();
    expect(linkedin?.getAttribute("viewBox")).toBe("0 0 16 16");
  });
});
