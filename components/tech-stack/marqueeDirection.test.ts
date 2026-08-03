import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { resolveMarqueeDirection } from "@/components/tech-stack/marqueeDirection";

const NUM_RUNS = 100;

const arbitraryRowIndex = fc.integer({ min: 0, max: 10_000 });

// Feature: developer-portfolio, Property 12: Marquee direction alternates
// strictly by row index
//
// For any rendering of the six fixed TechCategoryRows in order, the resolved
// scroll direction for row i differs from the resolved direction for row i-1
// for every i > 0.
//
// **Validates: Requirements 11.5**
describe("Property 12: marquee direction alternates strictly by row index", () => {
  it("returns left for every even row index and right for every odd row index", () => {
    fc.assert(
      fc.property(arbitraryRowIndex, (rowIndex) => {
        const expected = rowIndex % 2 === 0 ? "left" : "right";
        expect(resolveMarqueeDirection(rowIndex)).toBe(expected);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("alternates direction between any consecutive row indices", () => {
    fc.assert(
      fc.property(arbitraryRowIndex, (rowIndex) => {
        expect(resolveMarqueeDirection(rowIndex)).not.toBe(
          resolveMarqueeDirection(rowIndex + 1),
        );
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
