import { BadgeCheck, Download, Send } from "lucide-react";

import { Avatar } from "@/components/hero/Avatar";
import { CurrentActivityCard } from "@/components/hero/CurrentActivityCard";
import { GitHubContributionCard } from "@/components/hero/GitHubContributionCard";
import { SocialLinks } from "@/components/hero/SocialLinks";
import { Container } from "@/components/shared/Container";
import { RevealOnView } from "@/components/shared/RevealOnView";
import { RotatingText } from "@/components/shared/RotatingText";
import Galaxy from "@/components/ui/galaxy";
import SpecularButton from "@/components/ui/specular-button";
import { currentActivity } from "@/data/current-activity";
import { getProfile } from "@/lib/data-access";
import { cn } from "@/utils/cn";

/**
 * Short role phrases the hero's role pill cycles through, cross-fading every
 * 1.5s via `RotatingText` (item 1 of the hero redesign). Kept as a fixed list
 * rather than derived from `profile.role`, since the point is to show several
 * short phrases in rotation rather than one long combined description.
 */
const ROLE_PHRASES = [
  "Full-Stack Developer",
  "Robust Backend",
  "Core ML",
  "DSA Grinder",
] as const;

/**
 * Scroll offset, matching `components/shared/Section.tsx#SECTION_SCROLL_MARGIN`.
 * Duplicated rather than imported because that constant is private to `Section`
 * — Hero owns its own `<section>` landmark instead of going through `Section`
 * (see the module doc below for why) and still needs the same anchor offset so
 * a Navbar hash click lands below the sticky Navbar just like every other
 * section.
 */
const SECTION_SCROLL_MARGIN = "scroll-mt-[var(--section-scroll-margin,5rem)]";

/**
 * Vertical rhythm. Tightened from `Section`'s own `py-24 lg:py-32` (item 4 of
 * the hero redesign): Hero now carries a narrow one-liner
 * `CurrentActivityCard` (item 1) and a more compact `GitHubContributionCard`
 * (item 3), so the whole column — name, bio, buttons, socials+activity row,
 * GitHub chart — needs less top/bottom breathing room to fit within one
 * common desktop viewport without a scroll (Requirement 7.8).
 */
const SECTION_SPACING = "pt-0 pb-12 lg:pb-16";

/**
 * Tech terms emphasized within the bio (matching the reference screenshot's
 * bold-key-terms tone). Kept as a fixed list rather than markdown-in-data so
 * `data/profile.ts#bio` stays a plain, factual string with no markup
 * conventions of its own.
 */
const BIO_EMPHASIS_TERMS = ["Next.js", "React", "Node.js", "Web3", "AI"] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BIO_EMPHASIS_PATTERN = new RegExp(
  `(${BIO_EMPHASIS_TERMS.map(escapeRegExp).join("|")})`,
  "g",
);

/**
 * Splits `bio` on the fixed emphasis term list and wraps each match in a
 * `<strong>`, so the combined textContent still equals `bio` exactly (the
 * HeroSection test asserts `getByText(profile.bio)` against the rendered
 * paragraph).
 */
function renderBioWithEmphasis(bio: string) {
  return bio.split(BIO_EMPHASIS_PATTERN).map((part, index) =>
    (BIO_EMPHASIS_TERMS as readonly string[]).includes(part) ? (
      <strong key={index} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/**
 * The Homepage's Hero (Requirements 7.1–7.8, Component_Specification §5,
 * design.md "HeroSection").
 *
 * ## Why this owns its own `<section>` instead of using the shared `Section`
 *
 * Every other Homepage section is generic: a title/subtitle heading, primary
 * content, and an optional Explore More button, which is exactly what
 * `components/shared/Section.tsx` provides. Hero is the one exception —
 * Requirement 26.4 requires exactly one `<h1>` per page and "the Homepage's
 * single h1 belongs to the Hero" (`SectionHeading`'s own module doc), and that
 * `<h1>` is the developer's **name**, not a generic section title like
 * "Hero". Routing the name through `Section`'s `title` prop would either
 * render a redundant second heading above it or force an awkward
 * `title={name}` call that couples this component to a specific host
 * composition. Owning the `<section>` landmark directly keeps the name as the
 * one and only heading, with the same `id`, scroll-margin, and vertical rhythm
 * every other section carries (`SECTION_SCROLL_MARGIN`, `SECTION_SPACING`,
 * copied from `Section` rather than imported, since those constants are
 * private to it). Hero is also exempt from the Explore More pattern
 * (Requirement 6.3), so nothing here is lost by not composing `Section`.
 *
 * ## Layout: one narrow, left-aligned column at every breakpoint
 *
 * Matching the reference design, Hero is a single vertical flow inside a
 * narrow column (`max-w-2xl`, well inside `Container`'s own max-width) rather
 * than a two-column grid: avatar + name/role inline, then the bio, then the
 * CTA buttons, then the social links, then the GitHub contribution graph and
 * Current Activity card stacked below. There is no `lg:grid-cols-2` split —
 * the same markup renders at every breakpoint (Requirement 7.7 — "no separate
 * mobile-only markup" — now applies to *all* breakpoints, not just mobile).
 *
 * ## Fitting above the fold (Requirement 7.8)
 *
 * Content is kept lean deliberately: no decorative filler, a single avatar
 * size, and compact vertical gaps, so the hero fits within the first viewport
 * on common desktop screen sizes without requiring a scroll to see the primary
 * introduction. This is a layout budget, not a hard guarantee for every
 * possible viewport — task 20.12's snapshot test pins it at a fixed desktop
 * size.
 *
 * ## Data sources
 *
 * `name`, `role`, and `bio` come from `getProfile()` — the data-access layer's
 * single entry point (Requirement 4.2) — never hardcoded in JSX
 * (Requirement 4.3). The resume download button uses `profile.resume`; the
 * email CTA is a `mailto:` link built from `profile.email`, mirroring
 * `ContactSection`'s own primary CTA. `CurrentActivityCard` receives
 * `data/current-activity.ts`'s `currentActivity` as its `fallback` prop, the
 * server-computed snapshot design.md's Data-Fetching Design describes
 * (Requirement 8.3, 8.4) — this Server Component reads it synchronously and
 * hands it down as a plain prop; no fetch happens here.
 *
 * ## `RevealOnView`
 *
 * The Hero's content is wrapped in `RevealOnView` so it fades/rises into place
 * on first paint like every other section (Requirement 24.3), while
 * `CurrentActivityCard` remains the only *other* Client boundary within it
 * (Requirement 8.6) — `RevealOnView` itself is already a Client Component, so
 * wrapping the section does not introduce a second one.
 *
 * Server Component: the section itself performs no data fetching and holds no
 * state; only `CurrentActivityCard`, nested inside, needs the browser.
 */
export function HeroSection() {
  const profile = getProfile();

  return (
    <section
      id="hero"
      data-slot="hero-section"
      aria-label="Introduction"
      className={cn(
        SECTION_SPACING,
        SECTION_SCROLL_MARGIN,
        "-mt-16 flex min-h-screen flex-col justify-center md:-mt-20",
      )}
    >
      <RevealOnView>
        <Container>
          <div
            data-slot="hero-column"
            className="mx-auto flex w-full pt-16 max-w-2xl flex-col items-start gap-5 text-left"
          >
            {/* Decorative galaxy banner - desktop only for performance */}
            <div
              aria-hidden="true"
              className="pointer-events-none hidden lg:block h-40 w-full overflow-hidden rounded-xl border border-border lg:h-47"
            >
              <Galaxy
                density={1.2}
                hueShift={200}
                speed={0.8}
                glowIntensity={0.2}
                saturation={0}
                twinkleIntensity={0.3}
                rotationSpeed={0.05}
                mouseRepulsion={false}
                mouseInteraction={false}
                transparent={false}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar />
                {/* `aria-label` pins the accessible name to the bare name
                    (matching every other page's h1 convention). The
                    checkmark badge sits immediately beside the name itself,
                    not inside the role pill. */}
                <h1
                  aria-label={profile.name}
                  className="flex items-center gap-1.5 text-h3 text-foreground"
                >
                  I&rsquo;m {profile.name}
                  <BadgeCheck
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />
                </h1>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-small text-muted-foreground">
                  <RotatingText phrases={ROLE_PHRASES} />
                </span>
              </div>

              <p className="max-w-prose text-body text-pretty text-muted-foreground">
                {renderBioWithEmphasis(profile.bio)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <SpecularButton
                data-slot="hero-resume-download"
                href={profile.resume}
                download
                size="sm"
                baseColor="#404040"
                lineColor="#ededed"
                textColor="var(--foreground)"
              >
                <Download aria-hidden="true" className="size-4" />
                Download Resume
              </SpecularButton>
              <SpecularButton
                data-slot="hero-contact-cta"
                href={`mailto:${profile.email}`}
                size="sm"
                baseColor="#333333"
                lineColor="#a1a1a1"
                textColor="var(--foreground)"
              >
                <Send aria-hidden="true" className="size-4" />
                Get in Touch
              </SpecularButton>
            </div>

            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex flex-1 flex-col items-start gap-2">
                <p className="text-small text-muted-foreground">
                  Here are my socials
                </p>
                <SocialLinks />
              </div>
              <div className="flex flex-1 flex-col items-start gap-2">
                <p className="text-small text-muted-foreground">
                  Current Activity
                </p>
                <CurrentActivityCard fallback={currentActivity} />
              </div>
            </div>

            <div className="w-full">
              <GitHubContributionCard />
            </div>
          </div>
        </Container>
      </RevealOnView>
    </section>
  );
}
