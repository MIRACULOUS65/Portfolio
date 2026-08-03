import type { TechCategory } from "./index";

/**
 * A single technology, tool, or framework in the tech stack.
 *
 * The homepage TechStackSection renders six TechCategoryRow marquees directly
 * from this dataset, each row filtering the list by its own {@link TechCategory}
 * (`getTechnologiesByCategory`). Every badge displays `icon` + `name`.
 *
 * Technologies are referenced by `id` from `Project.technologies`,
 * `Hackathon.technologies`, and `Certification.technologies` — never embedded —
 * so `id` must be stable and unique across the dataset.
 *
 * Requirement 4.11
 */
export interface Technology {
  /** Stable unique identifier used by `Technology.id` references and React keys. */
  id: string;
  /** Display name rendered on the badge, e.g. `"TypeScript"`. */
  name: string;
  /** Marquee row this technology belongs to. */
  category: TechCategory;
  /** Icon rendered on the badge (path under `public/` or icon identifier). */
  icon: string;
  /** Official website URL. Omitted when no canonical link exists. */
  website?: string;
  /** Brand color as a CSS color string, e.g. `"#3178C6"`. */
  color?: string;
  /** Self-assessed proficiency on a 0–100 scale. */
  proficiency?: number;
}
