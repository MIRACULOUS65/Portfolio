import { EducationCard } from "@/components/education/EducationCard";
import { Section } from "@/components/shared/Section";
import { getEducationSortedByDate } from "@/lib/data-access";

/**
 * The Homepage's EducationSection (Requirements 15.1, 15.2, design.md
 * "CertificationsSection / .../ EducationSection / ...").
 *
 * `getEducationSortedByDate()` returns **every** education entry, ordered
 * most-recent-first by `startDate` (see its doc comment in
 * `lib/data-access.ts`) — there is no cap and no dedicated education page, so
 * this section renders the full list with no Explore More button, matching
 * `CompetitiveProgrammingSection`'s exemption for the same reason
 * (Requirement 6.3).
 *
 * Rendered as a single-column vertical stack (a simple timeline: each card is
 * one entry in chronological order top to bottom) rather than a grid, since
 * ordering — not density — is the point of this section (Requirement 15.2).
 *
 * Server Component: reads only the static `Education` dataset through
 * `lib/data-access.ts` (Requirement 4.2), no state, no effects.
 */
export function EducationSection() {
  const education = getEducationSortedByDate();

  return (
    <Section id="education" title="Education" className="py-6! lg:py-8!">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {education.map((entry) => (
          <EducationCard key={entry.id} education={entry} />
        ))}
      </div>
    </Section>
  );
}
