import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TechCategoryRow } from "@/components/tech-stack/TechCategoryRow";
import type { Technology } from "@/types";

/**
 * Unit test for task 26.8 (Requirements 11.3, 11.8, 23.1): the marquee track
 * never wraps badges to a second line at any breakpoint.
 *
 * jsdom has no real layout engine, so this cannot measure rendered line
 * counts at a viewport size directly. Instead it asserts the two CSS
 * properties that jointly guarantee no-wrap regardless of breakpoint
 * (`TechCategoryRow.tsx`'s own doc comment): the row wrapper clips overflow
 * (`overflow-hidden`) and the track never wraps its flex items
 * (`flex-nowrap`) — unlike `--marquee-duration`, neither of these classes is
 * conditioned on a breakpoint, so the same assertion holds identically at
 * every viewport width from mobile through desktop.
 */
const technologies: Technology[] = [
  { id: "a", name: "A", category: "Frontend", icon: "/images/tech/a.svg" },
  { id: "b", name: "B", category: "Frontend", icon: "/images/tech/b.svg" },
  { id: "c", name: "C", category: "Frontend", icon: "/images/tech/c.svg" },
];

describe("TechCategoryRow never wraps at any breakpoint (Requirements 11.3, 11.8)", () => {
  it("clips row overflow and never wraps the track's flex items", () => {
    const { container } = render(
      <TechCategoryRow
        category="Frontend"
        technologies={technologies}
        rowIndex={0}
      />,
    );

    const row = container.querySelector("[data-slot='tech-category-row']");
    expect(row?.className).toContain("overflow-hidden");

    const track = container.querySelector(
      "[data-slot='tech-category-row-track']",
    );
    expect(track?.className).toContain("flex-nowrap");
    // `w-max` means the track's intrinsic width is the sum of its items, not
    // capped to its container — the other half of never wrapping: it is
    // wider than the viewport rather than shrinking items onto a second row.
    expect(track?.className).toContain("w-max");
  });

  it("holds regardless of how many technologies the category has", () => {
    for (const count of [0, 1, 6, 12]) {
      const list = Array.from({ length: count }, (_, index) => ({
        id: `t-${index}`,
        name: `Tech ${index}`,
        category: "Frontend" as const,
        icon: `/images/tech/t-${index}.svg`,
      }));

      const { container, unmount } = render(
        <TechCategoryRow
          category="Frontend"
          technologies={list}
          rowIndex={0}
        />,
      );

      const track = container.querySelector(
        "[data-slot='tech-category-row-track']",
      );
      expect(track?.className).toContain("flex-nowrap");

      unmount();
    }
  });
});
