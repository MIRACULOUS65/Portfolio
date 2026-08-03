/**
 * Resolves the marquee scroll direction for a `TechCategoryRow` from its
 * 0-indexed position among the six fixed rows.
 *
 * Even row indices scroll left, odd row indices scroll right, so consecutive
 * rows always alternate direction (Requirement 11.5).
 */
export type MarqueeDirection = "left" | "right";

/**
 * Pure resolver: even `rowIndex` → `"left"`, odd `rowIndex` → `"right"`.
 *
 * @param rowIndex - 0-indexed position of the `TechCategoryRow` among the
 * fixed set of rows rendered by `TechStackSection`.
 */
export function resolveMarqueeDirection(rowIndex: number): MarqueeDirection {
  return rowIndex % 2 === 0 ? "left" : "right";
}
