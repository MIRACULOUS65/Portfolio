import { render, screen } from "@testing-library/react";
import fc from "fast-check";
import { Code2 } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Badge, resolveBadgeColor } from "@/components/shared/Badge";

describe("Badge", () => {
  it("renders the label as the badge's accessible text", () => {
    render(<Badge label="TypeScript" />);

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders an icon decoratively so the label stays the accessible name", () => {
    const { container } = render(<Badge icon={<Code2 />} label="TypeScript" />);

    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
    // The wrapper hides the icon from assistive tech (Requirement 11.7: the
    // badge shows an icon, but the technology name is what is announced).
    expect(icon?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(container.textContent).toBe("TypeScript");
  });

  it("omits the icon slot entirely when no icon is supplied", () => {
    const { container } = render(<Badge label="Docker" />);

    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("[aria-hidden='true']")).toBeNull();
  });

  it("exposes a valid brand colour as a single custom property, not a hardcoded class", () => {
    const { container } = render(<Badge label="TypeScript" color="#3178C6" />);

    const badge = container.querySelector<HTMLElement>("[data-slot='badge']");
    expect(badge?.dataset.tone).toBe("brand");
    expect(badge?.style.getPropertyValue("--badge-color")).toBe("#3178C6");
    // The colour reaches the border/icon through static utilities that read the
    // custom property, so Tailwind can generate them at build time.
    expect(badge?.className).toContain("border-[var(--badge-color)]");
  });

  it("falls back to the token-based tone when no colour is supplied", () => {
    const { container } = render(<Badge label="Docker" />);

    const badge = container.querySelector<HTMLElement>("[data-slot='badge']");
    expect(badge?.dataset.tone).toBe("default");
    expect(badge?.getAttribute("style")).toBeNull();
    expect(badge?.className).toContain("border-border");
  });

  it("ignores a colour value that is not a plain CSS colour", () => {
    const { container } = render(
      <Badge label="Sketchy" color="red; background: url(evil.png)" />,
    );

    const badge = container.querySelector<HTMLElement>("[data-slot='badge']");
    expect(badge?.dataset.tone).toBe("default");
    expect(badge?.style.getPropertyValue("--badge-color")).toBe("");
  });

  it("lets caller utilities override the defaults", () => {
    const { container } = render(<Badge label="Next.js" className="h-9" />);

    const badge = container.querySelector<HTMLElement>("[data-slot='badge']");
    expect(badge?.className).toContain("h-9");
    expect(badge?.className).not.toContain("h-7");
  });
});

describe("resolveBadgeColor", () => {
  it.each([
    "#fff",
    "#3178C6",
    "#3178C6CC",
    "rebeccapurple",
    "rgb(49 120 198)",
    "rgba(49, 120, 198, 0.5)",
    "hsl(210 60% 48%)",
    "oklch(0.6 0.14 250)",
    "  #3178C6  ",
  ])("accepts %s", (color) => {
    expect(resolveBadgeColor(color)).toBe(color.trim());
  });

  it.each([
    undefined,
    "",
    "   ",
    "#12",
    "url(evil.png)",
    "red; background: url(evil.png)",
    "}html{display:none",
    "var(--background)",
    'rgb(0 0 0) "',
    `#${"a".repeat(80)}`,
  ])("rejects %s", (color) => {
    expect(resolveBadgeColor(color)).toBeUndefined();
  });

  // Local sanitisation invariant (not a spec Property): whatever a data file
  // holds in `Technology.color`, the value handed to the inline style is either
  // absent or a trimmed, CSS-injection-free colour.
  it("never returns a value carrying style-breaking characters", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.constantFrom(
            "#3178C6",
            "red",
            "rgb(1,2,3)",
            "red;color:blue",
            "url('x')",
            "}",
          ),
        ),
        (color) => {
          const resolved = resolveBadgeColor(color);
          if (resolved === undefined) return;

          expect(resolved).toBe(color.trim());
          expect(resolved).not.toMatch(/[;{}"'\\]|url\(|\/\*/i);
          expect(resolved.length).toBeLessThanOrEqual(64);
        },
      ),
      { numRuns: 200 },
    );
  });
});
