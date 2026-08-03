import { CertificationCard } from "@/components/certifications/CertificationCard";
import { Section } from "@/components/shared/Section";
import { getFeaturedCertifications } from "@/lib/data-access";

/**
 * The Homepage's CertificationsSection (Requirements 12.1, 12.2, 12.4,
 * design.md "CertificationsSection / ... / Footer").
 *
 * `getFeaturedCertifications()` already applies the "featured, or non-featured
 * fallback when nothing is featured" rule (Requirement 12.1, 12.2) and the
 * preview cap, so this component renders its result as-is — no filtering, no
 * re-sorting.
 *
 * Server Component: reads only the static `Certification` dataset through
 * `lib/data-access.ts` (Requirement 4.2), no state, no effects.
 */
export function CertificationsSection() {
  const certifications = getFeaturedCertifications();

  return (
    <Section
      id="certifications"
      title="Certifications"
      exploreMoreHref="/certifications"
      exploreMoreLabel="Explore all certifications"
      className="py-6! lg:py-8!"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {certifications.map((certification) => (
          <CertificationCard
            key={certification.id}
            certification={certification}
          />
        ))}
      </div>
    </Section>
  );
}
