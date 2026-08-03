import type { ReactNode } from "react";

import { Container } from "@/components/shared/Container";
import {
  DEFAULT_EXPLORE_MORE_LABEL,
  ExploreMoreButton,
} from "@/components/shared/ExploreMoreButton";
import {
  SectionHeading,
  type SectionHeadingLevel,
} from "@/components/shared/SectionHeading";
import { cn } from "@/utils/cn";

/**
 * Scroll offset applied to every section so a hash jump doesn't land the
 * section's top edge underneath the sticky Navbar (design.md "Navbar
 * Scroll-Only Pattern").
 *
 * Written as a custom property read with a fallback rather than a fixed
 * `scroll-mt-20`: task 18 owns the sizing convention and can define
 * `--section-scroll-margin` once in `styles/globals.css` (sized to the real
 * Navbar height, breakpoint by breakpoint) without editing this component or
 * every section. Until it does, the `5rem` (80px) fallback — an 8px-scale step
 * from Design_System §4 — keeps hash navigation correct today.
 *
 * It stays in the `scroll-mt-*` utility group, so a caller passing
 * `scroll-mt-*` through `className` overrides it (see `cn`).
 */
const SECTION_SCROLL_MARGIN = "scroll-mt-[var(--section-scroll-margin,5rem)]";

/**
 * Vertical rhythm shared by every section: 96px, widening to 128px from laptop
 * up — the 96–128px band Design_System §4 specifies for section spacing, and
 * the "identical vertical rhythm" §15 asks for (Requirement 6.5).
 *
 * Horizontal rhythm is deliberately absent: `Container` owns max-width and
 * horizontal padding (Requirement 23.1), so no section restates them.
 */
const SECTION_SPACING = "py-24 lg:py-32";

export interface SectionProps {
  /**
   * The section's HTML `id`, and its navigation target. Homepage sections use
   * the ids mandated by Requirement 6.2: `hero`, `projects`, `blog`,
   * `tech-stack`, `certifications`, `competitive-programming`, `hackathons`,
   * `education`, `contact`. Also used to derive the heading's `id`, which names
   * the region.
   */
  id: string;
  /** Section title, rendered by `SectionHeading`. */
  title: string;
  /** Optional one-line description under the title. */
  subtitle?: string;
  /**
   * Destination dedicated page for this section's Explore More control. Supply
   * it and the section renders exactly one `ExploreMoreButton`; omit it and the
   * section renders none (Requirement 6.3, 17.1).
   */
  exploreMoreHref?: string;
  /**
   * Visible text — and accessible name — for the Explore More link. Defaults to
   * `DEFAULT_EXPLORE_MORE_LABEL`, but callers should pass something specific
   * ("Explore all projects", "Read the blog"), because several of these links
   * coexist on the Homepage and identical names are indistinguishable when a
   * screen reader lists them (audited in task 44.3).
   */
  exploreMoreLabel?: string;
  /**
   * Heading level for `title`. Defaults to `"h2"`: the Homepage's single `h1`
   * belongs to the Hero, and task 44.2 audits that. Dedicated pages whose page
   * title *is* the section heading pass `"h1"`.
   */
  titleAs?: SectionHeadingLevel;
  /** Renders `SectionHeading`'s decorative rule. Defaults to `false`. */
  divider?: boolean;
  /** The section's primary content. */
  children: ReactNode;
  /** Extra utilities merged onto the `<section>`; conflicting classes win (see `cn`). */
  className?: string;
  /** Extra utilities merged onto the content wrapper; conflicting classes win. */
  contentClassName?: string;
}

/**
 * The shell every Homepage section (and every dedicated page's main block) is
 * wrapped in, so section anatomy exists in exactly one place: heading, optional
 * description, primary content, and — where applicable — the Explore More
 * button (Design_System §15, Component_Specification §3 "Section: id, spacing,
 * heading, optional description").
 *
 * ## What it owns
 *
 * - **The `id`** (Requirement 6.2). `SectionHeading` deliberately owns no
 *   section element and no `id`, so the landmark and its anchor target live
 *   here — one component, one place a Navbar hash can point at. Paired with
 *   `SECTION_SCROLL_MARGIN` so the anchor lands below the sticky Navbar.
 * - **The region's accessible name.** A real `<section>` (task 44.1 audits
 *   semantic HTML) is only exposed as a landmark once it is named, so
 *   `aria-labelledby` points at the heading through `SectionHeading`'s
 *   `titleId`. The id is derived from `id` (`${id}-title`), not accepted as a
 *   prop, so it cannot drift from the section it names or collide between
 *   sections.
 * - **Vertical rhythm** (Requirement 6.5), while `Container` keeps horizontal
 *   rhythm.
 *
 * ## INVARIANT — exactly one Explore More button, and only when asked
 *
 * Requirement 17.1 (and Property 4, asserted in task 9.11) requires each
 * preview section to provide exactly one Explore More control. That is
 * structural here, not a convention:
 *
 * - `ExploreMoreButton` appears **once** in this file, inside a single
 *   conditional expression. There is no second branch, no `.map`, and no way for
 *   a caller to pass one in — the only inputs are a single `exploreMoreHref`
 *   string and its label, so `[data-slot="explore-more-button"]` in a section's
 *   rendered output is countable and can only ever be 0 or 1.
 * - A blank/whitespace `exploreMoreHref` counts as absent, so an unresolved
 *   value can't produce a link to nowhere.
 * - Sections that legitimately have no Explore More simply omit the prop and
 *   render zero: Hero and Contact are exempt by Requirement 6.3, and
 *   `FeaturedProjectsSection` passes no `exploreMoreHref` because its button
 *   lives inside `ProjectDetails` (task 23.4), next to the selected project it
 *   refers to.
 *
 * `children` is the one thing this component cannot police — a caller could
 * render its own routing control there — which is exactly why
 * `ExploreMoreButton` is the only shared component allowed to route
 * (Requirement 17.3) and why FeaturedProjects' in-content button is called out
 * above rather than left implicit.
 *
 * Purely presentational Server Component: no state, no effects, no data access.
 * A section's entrance animation is applied by wrapping this in `RevealOnView`,
 * so the shell itself introduces no client boundary.
 */
export function Section({
  id,
  title,
  subtitle,
  exploreMoreHref,
  exploreMoreLabel = DEFAULT_EXPLORE_MORE_LABEL,
  titleAs = "h2",
  divider = false,
  children,
  className,
  contentClassName,
}: SectionProps) {
  const headingId = `${id}-title`;
  // Resolved to a single nullable value so the render below has one branch and
  // one `ExploreMoreButton`, with no cast needed to narrow the href.
  const exploreMoreTarget =
    typeof exploreMoreHref === "string" && exploreMoreHref.trim() !== ""
      ? exploreMoreHref
      : null;

  return (
    <section
      id={id}
      data-slot="section"
      aria-labelledby={headingId}
      className={cn(SECTION_SPACING, SECTION_SCROLL_MARGIN, className)}
    >
      <Container>
        <div className="flex flex-col gap-10 sm:gap-12">
          <SectionHeading
            title={title}
            subtitle={subtitle}
            divider={divider}
            titleAs={titleAs}
            titleId={headingId}
          />

          <div
            data-slot="section-content"
            className={cn("flex flex-col gap-8", contentClassName)}
          >
            {children}
          </div>

          {exploreMoreTarget !== null ? (
            <div
              data-slot="section-explore-more"
              className="flex flex-wrap justify-center"
            >
              <ExploreMoreButton
                href={exploreMoreTarget}
                label={exploreMoreLabel}
              />
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
