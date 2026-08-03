import type { CSSProperties, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

/**
 * Conservative allow-list for a caller-supplied brand colour.
 *
 * `Technology.color` is an arbitrary CSS colour string coming from `data/`, so
 * it is the one value in this component that is not a design token. Only the
 * shapes a colour can legitimately take are accepted — hex, a bare colour
 * keyword, or one of the CSS colour functions — with no `;`, `{`, `}`, quotes,
 * `url(...)`, or nested parentheses, so nothing that reaches the inline style
 * can express anything other than a colour.
 */
const SAFE_CSS_COLOR =
  /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|[a-z]+|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(\s*[0-9a-z%.,/\s+-]*\))$/i;

/** Upper bound on a colour string; every legitimate form is far shorter. */
const MAX_COLOR_LENGTH = 64;

/**
 * Normalises a caller-supplied brand colour, returning `undefined` when the
 * value is missing or not a plain CSS colour. Callers never have to pre-validate
 * data: an unusable colour silently degrades to the token-based default tone
 * rather than rendering a broken badge.
 */
export function resolveBadgeColor(color?: string): string | undefined {
  if (typeof color !== "string") return undefined;

  const trimmed = color.trim();
  if (trimmed === "" || trimmed.length > MAX_COLOR_LENGTH) return undefined;

  return SAFE_CSS_COLOR.test(trimmed) ? trimmed : undefined;
}

/**
 * Badge geometry and tones. Per Design_System §12 badges are icon + label,
 * rounded, of consistent height, and their only hover affordance is a small
 * elevation — expressed here as a `translateY` so the hover stays on the
 * compositor and touches transform only (Requirement 24.4).
 *
 * The `tone` variant is derived from whether a usable brand colour was passed;
 * it is not part of the public prop contract (`{ icon?, label, color? }`).
 */
const badgeVariants = cva(
  "inline-flex h-7 max-w-full shrink-0 items-center gap-1.5 rounded-full border px-3 text-caption font-medium whitespace-nowrap transition-transform duration-150 ease-out will-change-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        // Fully token-driven, so both themes work with no component change
        // (Requirement 3.6).
        default: "border-border bg-muted text-foreground",
        // Same token-driven surface, with the border and icon tinted by the
        // `--badge-color` custom property set inline. The utilities themselves
        // are static Tailwind classes; only the colour channel is dynamic.
        brand:
          "border-[var(--badge-color)] bg-muted text-foreground [&_svg]:text-[var(--badge-color)]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export interface BadgeProps {
  /** Visible, accessible text of the badge — e.g. a technology name. */
  label: string;
  /**
   * Optional leading icon, rendered decoratively (`aria-hidden`) so `label`
   * remains the single accessible name. Icons come from Lucide React, the
   * project's exclusive icon library (Requirement 1.6).
   */
  icon?: ReactNode;
  /**
   * Optional brand colour as a CSS colour string, straight from
   * `Technology.color`. Unrecognised values are ignored.
   */
  color?: string;
  /** Extra utilities merged onto the badge; conflicting classes win (see `cn`). */
  className?: string;
}

/**
 * The single technology-tag presentation used across the site: the TechStack
 * marquee's `TechBadge` (icon + technology name, Requirement 11.7) and the
 * technology badge lists in `ProjectDetails`, certifications, and hackathons all
 * render through it, so tag styling is defined in exactly one place
 * (Component_Specification §3, Design_System §12).
 *
 * **Dynamic brand colour.** Tailwind is the exclusive styling mechanism
 * (Requirement 1.3) and no colour is hardcoded here — the palette comes from
 * theme tokens (`bg-muted`, `text-foreground`, `border-border`). A technology's
 * brand colour, however, is caller data rather than a token, and Tailwind can
 * only generate utilities it can see at build time. The resolution: the styling
 * stays in static Tailwind utilities (`border-[var(--badge-color)]`,
 * `[&_svg]:text-[var(--badge-color)]`) and the only inline style is the single
 * `--badge-color` custom property. That keeps one dynamic value — a colour —
 * out of the class string instead of generating arbitrary classes at runtime,
 * and `resolveBadgeColor` guarantees the value really is a colour.
 *
 * Purely presentational Server Component: no state, no effects, no data access.
 */
export function Badge({ label, icon, color, className }: BadgeProps) {
  const brandColor = resolveBadgeColor(color);
  const tone: BadgeTone = brandColor ? "brand" : "default";

  return (
    <span
      data-slot="badge"
      data-tone={tone}
      className={cn(badgeVariants({ tone }), className)}
      style={
        brandColor
          ? ({ "--badge-color": brandColor } as CSSProperties)
          : undefined
      }
    >
      {icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center">
          {icon}
        </span>
      ) : null}
      <span className="truncate">{label}</span>
    </span>
  );
}

export { badgeVariants };
