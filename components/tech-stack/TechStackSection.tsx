import { Section } from "@/components/shared/Section";
import { TechCategoryRow } from "@/components/tech-stack/TechCategoryRow";
import { getAllTechnologies } from "@/lib/data-access";
import type { TechCategory } from "@/types";

/**
 * The Homepage's TechStackSection (Requirements 11.1, 11.2,
 * Component_Specification §8, design.md "TechStackSection — Marquee Design").
 *
 * ## Exactly six fixed rows, one per `TechCategory`
 *
 * {@link CATEGORIES} is the full `TechCategory` union in the fixed order
 * Requirement 11.1 lists it: Frontend, Backend, Database, DevOps, AI/ML, Web3.
 * This component maps over that list — never over `getAllTechnologies()` —
 * so the section always renders exactly six `TechCategoryRow`s regardless of
 * which categories the dataset happens to populate (the same "fixed list
 * drives the render loop, not the data" pattern `SocialLinks` uses for its own
 * platform set). Each row is fed `technologies.filter(t => t.category ===
 * category)`, computed once here rather than inside the row, so
 * `TechCategoryRow` (Property 11) stays a pure function of the list it is
 * handed.
 *
 * `rowIndex` is the category's position in {@link CATEGORIES} (0–5), passed
 * straight to `TechCategoryRow` so `resolveMarqueeDirection` alternates
 * direction across the fixed six rows regardless of how many technologies
 * populate any one category (Requirement 11.5).
 *
 * Server Component: reads only the static `Technology` dataset through
 * `lib/data-access.ts` (Requirement 4.2), no state, no effects — the hover
 * pause and marquee animation live entirely inside the Client
 * `TechCategoryRow`.
 */
const CATEGORIES: readonly TechCategory[] = [
  "Frontend",
  "Backend",
  "Database",
  "DevOps",
  "AI/ML",
  "Web3",
];

export function TechStackSection() {
  const technologies = getAllTechnologies();

  return (
    <Section
      id="tech-stack-content"
      title="Tech Stack"
      className="py-6! lg:py-8!"
    >
      <div className="flex flex-col gap-4">
        {CATEGORIES.map((category, rowIndex) => (
          <TechCategoryRow
            key={category}
            category={category}
            rowIndex={rowIndex}
            technologies={technologies.filter(
              (technology) => technology.category === category,
            )}
          />
        ))}
      </div>
    </Section>
  );
}
