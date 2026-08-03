import { describe, expect, it } from "vitest";

import { resolveBadgeColor } from "@/components/shared/Badge";
import { technologies } from "@/data/technologies";
import type { TechCategory } from "@/types";

/**
 * Guards the two contracts other modules depend on: `Technology.id` is a stable
 * unique key that `Project`/`Hackathon`/`Certification` reference and
 * `lib/validate-data.ts` resolves against, and every one of the six
 * `TechCategory` values has entries so no TechStack marquee row renders empty
 * (Requirements 4.1, 4.11, 11.1).
 */
const ALL_CATEGORIES: TechCategory[] = [
  "Frontend",
  "Backend",
  "Database",
  "DevOps",
  "AI/ML",
  "Web3",
];

describe("technologies dataset", () => {
  it("has unique ids", () => {
    const ids = technologies.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses kebab-case ids", () => {
    for (const { id } of technologies) {
      expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("covers all six categories with enough entries to fill a marquee row", () => {
    for (const category of ALL_CATEGORIES) {
      const row = technologies.filter((t) => t.category === category);
      expect(row.length, `category ${category}`).toBeGreaterThanOrEqual(6);
    }
  });

  it("declares no category outside TechCategory", () => {
    for (const { category } of technologies) {
      expect(ALL_CATEGORIES).toContain(category);
    }
  });

  it("derives every icon path from the entry id", () => {
    for (const { id, icon } of technologies) {
      expect(icon).toBe(`/images/tech/${id}.svg`);
    }
  });

  it("only declares colors Badge can actually apply", () => {
    for (const { id, color } of technologies) {
      if (color === undefined) continue;
      expect(resolveBadgeColor(color), `color of ${id}`).toBe(color);
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("keeps proficiency within 0-100 when present", () => {
    for (const { id, proficiency } of technologies) {
      if (proficiency === undefined) continue;
      expect(proficiency, `proficiency of ${id}`).toBeGreaterThanOrEqual(0);
      expect(proficiency, `proficiency of ${id}`).toBeLessThanOrEqual(100);
    }
  });

  it("uses absolute https websites when present", () => {
    for (const { id, website } of technologies) {
      if (website === undefined) continue;
      expect(website, `website of ${id}`).toMatch(/^https:\/\/\S+$/);
    }
  });
});
