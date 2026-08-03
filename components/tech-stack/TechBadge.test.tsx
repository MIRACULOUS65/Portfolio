import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TechBadge } from "@/components/tech-stack/TechBadge";
import type { Technology } from "@/types";

const baseTechnology: Technology = {
  id: "typescript",
  name: "TypeScript",
  category: "Frontend",
  icon: "/images/tech/typescript.svg",
  color: "#3178C6",
};

describe("TechBadge", () => {
  it("renders the technology name as the chip's accessible text", () => {
    render(<TechBadge technology={baseTechnology} />);

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders an icon decoratively so the name stays the sole accessible text", () => {
    const { container } = render(<TechBadge technology={baseTechnology} />);

    const icon = container.querySelector("svg, img");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(container.textContent).toBe("TypeScript");
  });

  it("renders a real Simple Icons CDN logo for a technology whose id resolves to a slug", () => {
    // "typescript" has no slug override and is confirmed to exist on Simple
    // Icons, so it renders the real brand logo rather than the Lucide fallback.
    const { container } = render(<TechBadge technology={baseTechnology} />);

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute(
      "src",
      "https://cdn.simpleicons.org/typescript",
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("falls back to a generic Lucide glyph for a technology confirmed to have no Simple Icons mark", () => {
    // "sql" is one of the handful of ids confirmed against the published
    // Simple Icons slug list to have no brand mark at all.
    const technology: Technology = { ...baseTechnology, id: "sql", name: "SQL" };
    const { container } = render(<TechBadge technology={technology} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders the bordered chip markup with the grayscale-to-colour icon hover", () => {
    const { container } = render(<TechBadge technology={baseTechnology} />);

    const chip = container.querySelector<HTMLElement>(
      "[data-slot='tech-badge']",
    );
    expect(chip).not.toBeNull();
    expect(chip?.className).toContain("border-border");
    expect(chip?.className).toContain("group/item");

    const img = container.querySelector("img");
    expect(img?.className).toContain("grayscale");
    expect(img?.className).toContain("group-hover/item:grayscale-0");
  });

  it("lets caller utilities override the chip defaults", () => {
    const { container } = render(
      <TechBadge technology={baseTechnology} className="h-9" />,
    );

    const chip = container.querySelector<HTMLElement>(
      "[data-slot='tech-badge']",
    );
    expect(chip?.className).toContain("h-9");
  });
});
