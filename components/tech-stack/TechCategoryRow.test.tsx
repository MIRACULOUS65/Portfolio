import { render } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { TechCategoryRow } from "@/components/tech-stack/TechCategoryRow";
import type { Technology } from "@/types";

const NUM_RUNS = 100;

/* -------------------------------------------------------------------------- */
/* Generators                                                                 */
/* -------------------------------------------------------------------------- */

const arbitraryTechnology: fc.Arbitrary<Technology> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim() !== ""),
  category: fc.constant("Frontend" as const),
  icon: fc.constant("/images/tech/does-not-exist.svg"),
});

/** A list of technologies with distinct ids, so React keys never collide. */
const arbitraryTechnologyList: fc.Arbitrary<Technology[]> = fc
  .uniqueArray(arbitraryTechnology, {
    minLength: 0,
    maxLength: 12,
    selector: (t) => t.id,
  });

// Feature: developer-portfolio, Property 11: TechCategoryRow renders exactly
// its own category's technologies
//
// For any TechCategoryRow given a list of technologies belonging to its
// category, the set of technology names rendered by the row equals exactly
// the set of names in the provided list (each appearing twice, once per
// doubled marquee track) — no technology from a different category leaks in,
// and none of the provided technologies is dropped.
//
// **Validates: Requirements 11.2**
describe("Property 11: TechCategoryRow renders exactly its own category's technologies", () => {
  it("renders each provided technology's name exactly twice, and nothing else", () => {
    fc.assert(
      fc.property(arbitraryTechnologyList, (technologies) => {
        const { container } = render(
          <TechCategoryRow
            category="Frontend"
            technologies={technologies}
            rowIndex={0}
          />,
        );

        const track = container.querySelector(
          "[data-slot='tech-category-row-track']",
        );
        expect(track).not.toBeNull();

        const badgeTexts = Array.from(
          track?.querySelectorAll("[data-slot='tech-badge']") ?? [],
        ).map((badge) => badge.textContent);

        // Doubled track: each provided name appears exactly twice, in order.
        const expected = [...technologies, ...technologies].map((t) => t.name);
        expect(badgeTexts).toEqual(expected);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
