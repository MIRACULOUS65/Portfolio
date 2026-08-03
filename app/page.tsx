import { BlogPreviewSection } from "@/components/blog-preview/BlogPreviewSection";
import { CertificationsSection } from "@/components/certifications/CertificationsSection";
import { CompetitiveProgrammingSection } from "@/components/competitive-programming/CompetitiveProgrammingSection";
import { ContactSection } from "@/components/contact/ContactSection";
import { EducationSection } from "@/components/education/EducationSection";
import { FeaturedProjectsSection } from "@/components/featured-projects/FeaturedProjectsSection";
import { HackathonsSection } from "@/components/hackathons/HackathonsSection";
import { HeroSection } from "@/components/hero/HeroSection";
import { HashScrollRestoration } from "@/components/shared/HashScrollRestoration";
import { Section } from "@/components/shared/Section";
import { TechStackSection } from "@/components/tech-stack/TechStackSection";

/**
 * The Homepage (Server Component), grouped into six full-viewport-height
 * sections that each carry exactly one Navbar entry (`data/navigation.ts`):
 *
 * - **`#hero`** — Hero only.
 * - **`#projects`** — Featured Projects only.
 * - **`#tech-stack`** — Tech Stack + Competitive Programming, the latter
 *   nested with its own `#competitive-programming` anchor for internal
 *   scroll-into-view, no separate nav entry.
 * - **`#blog`** — Blog Preview + Certifications, the latter nested with no
 *   separate nav entry.
 * - **`#hackathon`** — Hackathons only.
 * - **`#connect`** — Education + Contact, the former nested with no separate
 *   nav entry.
 *
 * Recommendations moved off the homepage entirely: it is now a dedicated
 * route (`app/recommendation/page.tsx`), not a homepage section, so it no
 * longer appears in this list — see `data/navigation.ts` for the Navbar's
 * corresponding real-route link.
 *
 * ## What lives here vs. elsewhere
 *
 * - **Group order and outer ids** live here, and only here: each `min-h-screen`
 *   wrapper below carries the group id that matches `data/navigation.ts`'s
 *   `sectionId`s one-to-one, so a Navbar click always finds a target.
 * - **Nested content ids** (`#tech-stack-content`,
 *   `#competitive-programming`, `#blog-content`, `#certifications`,
 *   `#hackathons`, `#education`, `#contact`) sit on the individual `Section`s
 *   inside each group for internal anchors/deep links. `useActiveSection()`
 *   only observes the outermost `<section id>` per subtree (see its own doc
 *   comment), so a nested section never out-ranks its group wrapper for the
 *   Navbar highlight.
 * - **Vertical rhythm and heading structure inside a group** are each
 *   `Section`'s job (`components/shared/Section.tsx`), not restated here —
 *   Requirement 6.5.
 * - **Explore More placement** follows Requirement 6.3: every preview section
 *   other than Hero and Contact gets an `exploreMoreHref` to its dedicated
 *   page. Featured Projects now also renders its Explore More button via
 *   `Section`'s built-in mechanism, below the entire grid (video + selector +
 *   details) rather than tucked under just the details panel — matching the
 *   reference design's full-width button beneath both columns.
 * - **Footer** is rendered once, by `RootLayout` (`app/layout.tsx`), on every
 *   route — not here, so it is never duplicated on the Homepage.
 *
 * ## `HashScrollRestoration` and Requirement 5.9
 *
 * `Homepage` stays a Server Component: reading `window.location.hash` and
 * scheduling a post-paint `requestAnimationFrame` both need the browser, so
 * that effect is isolated in its own Client Component
 * (`components/shared/HashScrollRestoration.tsx`) rather than converting this
 * whole page. It renders nothing and can sit anywhere in the tree; it is
 * mounted first so the effect's `requestAnimationFrame` is scheduled as early
 * as possible relative to the sections settling into their layout.
 */
export default function Homepage() {
  return (
    <>
      <HashScrollRestoration />

      <HeroSection />

      <Section
        id="projects"
        title="Featured Projects"
        exploreMoreHref="/projects"
        exploreMoreLabel="Explore all projects"
        className="flex min-h-screen flex-col justify-center py-8! lg:py-12!"
      >
        <FeaturedProjectsSection />
      </Section>

      <section
        id="tech-stack"
        aria-label="Tech Stack and Competitive Programming"
        className="flex min-h-screen flex-col justify-center gap-6"
      >
        <TechStackSection />
        <CompetitiveProgrammingSection />
      </section>

      <section
        id="blog"
        aria-label="Blog and Certifications"
        className="flex min-h-screen flex-col justify-center gap-2"
      >
        <BlogPreviewSection />
        <CertificationsSection />
      </section>

      <section
        id="hackathon"
        aria-label="Hackathons"
        className="flex min-h-screen flex-col justify-center"
      >
        <HackathonsSection />
      </section>

      <section
        id="connect"
        aria-label="Education and Contact"
        className="flex min-h-screen flex-col justify-center gap-6"
      >
        <EducationSection />
        <ContactSection />
      </section>
    </>
  );
}
