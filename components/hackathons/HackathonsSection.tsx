import { HackathonCard } from "@/components/hackathons/HackathonCard";
import { Section } from "@/components/shared/Section";
import { Component as ImageAutoSlider } from "@/components/ui/image-auto-slider";
import { getHackathonsPreview } from "@/lib/data-access";

/**
 * Real event photos for the auto-scrolling strip above the hackathon cards,
 * sourced from `public/images/hackathons/`.
 */
const HACKATHON_GALLERY_IMAGES = [
  "/images/hackathons/pic1.webp",
  "/images/hackathons/pic2.webp",
  "/images/hackathons/pic3.webp",
  "/images/hackathons/pic4.webp",
  "/images/hackathons/pic5.webp",
  "/images/hackathons/pic6.webp",
];

/**
 * The Homepage's HackathonsSection (Requirements 14.1, 14.3, design.md
 * "CertificationsSection / CompetitiveProgrammingSection / HackathonsSection
 * / ...").
 *
 * `getHackathonsPreview()` already applies the recency ordering and preview
 * cap (Requirement 14.1), so this component renders its result as-is.
 *
 * Server Component: reads only the static `Hackathon` dataset through
 * `lib/data-access.ts` (Requirement 4.2), no state, no effects.
 */
export function HackathonsSection() {
  const hackathons = getHackathonsPreview();

  return (
    <Section
      id="hackathons"
      title="Hackathons"
      exploreMoreHref="/hackathons"
      exploreMoreLabel="Explore all hackathons"
    >
      <ImageAutoSlider images={HACKATHON_GALLERY_IMAGES} className="mb-2" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hackathons.map((hackathon) => (
          <HackathonCard key={hackathon.id} hackathon={hackathon} />
        ))}
      </div>
    </Section>
  );
}
