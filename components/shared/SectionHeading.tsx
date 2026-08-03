import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

/**
 * Heading elements a section title may render as.
 *
 * Task 44.2 audits the document outline: exactly one `h1` per page and no
 * skipped levels. The homepage's `h1` belongs to the Hero, so every homepage
 * preview section heading is an `h2` — which is why `h2` is the default here.
 * `h1` exists for dedicated pages (`/projects`, `/blog`, ...) whose page title
 * *is* the section heading, and `h3` for a heading nested inside a subsection.
 * The `titleAs` name and this three-value union follow the precedent set by
 * `EmptyState` / `ErrorState`.
 */
export type SectionHeadingLevel = "h1" | "h2" | "h3";

/**
 * Title typography, keyed to the heading level so the visual scale and the
 * document outline can never drift apart (Design_System §5 type scale, exposed
 * as the `text-h1..text-h4` tokens in `tailwind.config.ts`).
 *
 * Each token already carries its own line-height, letter-spacing, and weight,
 * so nothing else is restated here. No raw font sizes and no hex colours: the
 * palette comes from `text-foreground` (Requirement 3.6).
 */
const sectionHeadingTitleVariants = cva("text-balance text-foreground", {
  variants: {
    level: {
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
    },
  },
  defaultVariants: {
    level: "h2",
  },
});

export type SectionHeadingTitleVariantProps = VariantProps<
  typeof sectionHeadingTitleVariants
>;

export interface SectionHeadingProps {
  /** The section's visible title. Becomes the heading element's text. */
  title: string;
  /**
   * Optional one-line description shown under the title
   * (Component_Specification §3 "Title / Description / Decorative divider").
   */
  subtitle?: string;
  /**
   * Renders the optional decorative rule under the title/subtitle block.
   * Defaults to `false`; it carries no meaning and is hidden from assistive
   * technology.
   */
  divider?: boolean;
  /**
   * Heading element for `title`. Defaults to `"h2"`, the correct level for a
   * homepage preview section. Dedicated pages pass `"h1"`.
   */
  titleAs?: SectionHeadingLevel;
  /**
   * Optional `id` placed on the heading element so a wrapping `<section>` can
   * point `aria-labelledby` at it, naming the region with the same text the
   * visitor reads.
   */
  titleId?: string;
  /** Extra utilities merged onto the wrapper; conflicting classes win (see `cn`). */
  className?: string;
}

/**
 * The single section-heading presentation used by every homepage section and
 * dedicated page (Component_Specification §3, Design_System §15 "Every homepage
 * section contains: Heading, Optional description, Primary content, Explore
 * More button"), so vertical rhythm and type scale are defined in exactly one
 * place (Design_System §23).
 *
 * Deliberately layout-and-type only:
 *
 * - It owns no navigation. Requirement 17.3 allows exactly one kind of
 *   route-changing control per homepage preview section, and that control is
 *   `ExploreMoreButton`; a heading that could render a link would be a second
 *   way to leave the Homepage. There is no `action`/`href`/`children` prop here
 *   for one to be injected through.
 * - It owns no section element and no `id`. `Section` (task 15.5) wraps this and
 *   assigns the section's HTML `id` (Requirement 6.2), so the heading can be
 *   reused inside cards, page headers, and subsections without smuggling in a
 *   landmark.
 *
 * Purely presentational Server Component: no state, no effects, no data access,
 * and no animation — a heading's entrance animation belongs to the
 * `RevealOnView` wrapper around the section, not to the heading itself.
 */
export function SectionHeading({
  title,
  subtitle,
  divider = false,
  titleAs: Heading = "h2",
  titleId,
  className,
}: SectionHeadingProps) {
  return (
    <div
      data-slot="section-heading"
      className={cn("flex flex-col gap-3", className)}
    >
      <Heading
        id={titleId}
        data-slot="section-heading-title"
        className={sectionHeadingTitleVariants({ level: Heading })}
      >
        {title}
      </Heading>

      {subtitle ? (
        <p
          data-slot="section-heading-subtitle"
          className="max-w-prose text-body text-pretty text-muted-foreground"
        >
          {subtitle}
        </p>
      ) : null}

      {divider ? (
        // Decorative only: an accent rule, never announced, never focusable.
        // Fixed dimensions (no state changes it) so it cannot cause layout
        // shift, and full-strength `bg-primary` so the rule stays visible at
        // its 4px height in both themes (Requirement 44.4 palette values).
        <span
          aria-hidden="true"
          data-slot="section-heading-divider"
          className="block h-1 w-16 rounded-full bg-primary"
        />
      ) : null}
    </div>
  );
}

export { sectionHeadingTitleVariants };
