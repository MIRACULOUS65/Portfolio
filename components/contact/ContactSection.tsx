import { Section } from "@/components/shared/Section";
import { getProfile, getSocials } from "@/lib/data-access";

import { ContactCard } from "./ContactCard";

/**
 * The Homepage's ContactSection (Requirements 16.1, 16.2, 16.3,
 * Component_Specification §13).
 *
 * Resolves the Social dataset and the Profile's resume path through
 * `lib/data-access.ts` — the single sanctioned entry point (Requirement 4.2)
 * — and hands plain, already-resolved props to `ContactCard`, which stays
 * presentational-only, matching the `HackathonsSection`/`CertificationsSection`
 * split between a data-resolving Server section and a props-only card.
 *
 * ## No `exploreMoreHref` — Contact is exempt (Requirement 6.3)
 *
 * `Section` renders exactly one `ExploreMoreButton` when `exploreMoreHref` is
 * supplied and none when it is omitted. This section omits it: Hero and
 * Contact are the two Homepage sections Requirement 6.3 exempts from the
 * preview + Explore More pattern, since Contact already *is* the full content
 * — there is no dedicated "/contact" page to route to.
 *
 * ## The primary CTA is a `mailto:` link to the Profile's email
 *
 * Requirement 16.3 asks for "a primary call-to-action" without dictating its
 * destination. `mailto:${getProfile().email}` is the most direct action a
 * visitor who reached the Contact section can take — start an email — and it
 * requires no additional route or form (Component_Specification's "ContactForm"
 * is explicitly marked "(future)"). It is deliberately distinct from the
 * `Email` contact method rendered by `ContactCard` (which links to the same
 * mailbox via the Social dataset's `Email` entry): the CTA is the section's
 * one emphasized action, the contact method is one of four equally-weighted
 * channels.
 *
 * Server Component: reads only static `data/*.ts` content through
 * `lib/data-access.ts`, no state, no effects.
 */
export function ContactSection() {
  const socials = getSocials();
  const profile = getProfile();

  return (
    <Section id="contact" title="Contact" className="py-6! lg:py-8!">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <ContactCard
          socials={socials}
          resumeHref={profile.resume}
          ctaHref={`mailto:${profile.email}`}
        />

        <p className="text-h2 font-bold text-foreground md:text-h1">
          not a genius,
          <br />
          just <span className="text-muted-foreground">obsessed</span>.
        </p>
      </div>
    </Section>
  );
}
