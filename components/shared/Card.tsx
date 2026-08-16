import type {
  ComponentPropsWithoutRef,
  HTMLAttributes,
  ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

/**
 * Resting elevation (Design_System §8 level 1: "increase shadow gradually,
 * avoid heavy shadows"). Both the geometry and the theme-aware tint live in the
 * `shadow-elevation` token declared in `tailwind.config.ts`, so this file names
 * an elevation level rather than restating a shadow — and no colour is
 * hardcoded here (Requirement 3.6).
 */
const ELEVATION = "shadow-elevation";

/**
 * Card surfaces and the site's single hover language (Design_System §8, §11,
 * §23, Component_Specification §3, Animation_Guidelines §12–13).
 *
 * ## Transform-safe hover (Requirement 24.4) — the constraint of this file
 *
 * The `interactive` variant's hover/focus state touches **transform and
 * paint-only colour properties, nothing else**:
 *
 * - The lift is `hover:-translate-y-0.5` — a 2px `translateY`, exactly the
 *   `translateY(-2px)` Animation_Guidelines §12 specifies, and a transform, so
 *   it stays on the compositor and triggers no layout.
 * - "Border emphasis" is a `border-color` change. The border *width* is set once
 *   in the base class and never changes between states, so the box never
 *   resizes and no sibling can be pushed around.
 * - The transition property list is enumerated
 *   (`transition-[transform,translate,opacity,border-color]`) rather than
 *   `transition-all`, so `width`, `height`, `top`, `left`, margin, padding, and
 *   `box-shadow` cannot be animated even by a later edit. `translate` is named
 *   next to `transform` because Tailwind v4 emits the standalone `translate:`
 *   property for `-translate-y-*`; it is the same compositor-only transform.
 * - **No shadow change on hover.** Design_System §11 and Animation_Guidelines
 *   §12 describe a "shadow increase" on hover, but Requirement 24.4 forbids
 *   animating `box-shadow` "for any purpose" and that requirement wins. The
 *   elevation difference is therefore static per variant (`elevated` and
 *   `interactive` carry `ELEVATION`, `flat` carries none) and the hover
 *   affordance is carried by the lift plus the border emphasis.
 *
 * Timing mirrors `DURATION.fast` (150ms) and `EASING.out` from `@/lib/motion`;
 * these states are pure CSS, so the utilities mirror the tokens rather than
 * importing them (Requirement 24.2). `motion-reduce:` variants cancel both the
 * transition and the lift for visitors who asked for reduced motion, leaving
 * the border emphasis as instant, still-understandable feedback
 * (Requirement 24.5, Animation_Guidelines §22).
 */
const cardVariants = cva(
  "relative flex flex-col gap-4 rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-6",
  {
    variants: {
      variant: {
        /** Elevation level 1 (Design_System §8): the default resting surface. */
        elevated: ELEVATION,
        /** Elevation level 0: no shadow, for cards inside an already-raised surface. */
        flat: "",
        /**
         * A card that is itself a link/selection target. Adds the shared hover
         * language; `focus-within` mirrors it so a keyboard user tabbing to the
         * link inside the card gets the same affordance plus a visible focus
         * indicator (Design_System §19).
         */
        interactive: [
          ELEVATION,
          "transition-[transform,translate,opacity,border-color] duration-150 ease-out will-change-transform",
          "hover:-translate-y-0.5 hover:border-muted-foreground",
          "focus-within:-translate-y-0.5 focus-within:border-muted-foreground",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
          "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0",
        ],
        /**
         * A dark, editorial surface for cards that want the site's other
         * glow treatment instead of the token-driven `bg-card`. Hover is
         * transform-only (`scale` and `translateY` for float up), following 
         * the same Requirement 24.4 constraint as `interactive` above: no 
         * `box-shadow` transition, an enumerated transition property list 
         * instead of `transition-all`, and a `motion-reduce` variant that 
         * cancels the transform.
         */
        glow: [
          "bg-linear-to-br from-[#010101] via-[#090909] to-[#010101]",
          "rounded-2xl border border-white/10",
          "transition-[transform,scale,translate,border-color] duration-500 ease-out will-change-transform",
          "hover:scale-105 hover:-translate-y-2 hover:border-white/25",
          "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0",
        ],
      },
    },
    defaultVariants: {
      variant: "elevated",
    },
  },
);

export type CardVariant = NonNullable<
  VariantProps<typeof cardVariants>["variant"]
>;

/**
 * Elements a card may render as. Cards wrap self-contained content, so
 * `article` is common for blog/project cards and `li` for cards inside a list —
 * the semantics belong to the caller, the styling stays here.
 */
export type CardElement = "div" | "article" | "section" | "li";

/**
 * Attributes are typed against `HTMLElement` rather than a specific tag, since
 * `as` decides the element at the call site.
 */
export type CardProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  /** Surface treatment. Defaults to `elevated`. */
  variant?: CardVariant;
  /** Element to render. Defaults to `div`. */
  as?: CardElement;
  /** Extra utilities merged onto the card; conflicting classes win (see `cn`). */
  className?: string;
};

/**
 * The single card surface used across the site — projects, blog posts,
 * certifications, hackathons, education, contact (Component_Specification §3) —
 * so radius, border, padding, elevation, and hover language are defined once
 * (Design_System §23).
 *
 * Composition follows the common anatomy from Design_System §11 via
 * `CardHeader` / `CardContent` / `CardFooter`. Those parts carry layout only;
 * the card owns the padding, so nesting them never double-pads.
 *
 * Purely presentational Server Component: no state, no effects, no data access.
 * A card that navigates does so through a real `<a>`/`<button>` placed in its
 * content, which is what `focus-within` on the `interactive` variant hooks
 * into — the card element itself is never made clickable.
 */
export function Card({
  children,
  variant = "elevated",
  as: Component = "div",
  className,
  ...props
}: CardProps) {
  return (
    <Component
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}

/** Title/eyebrow/meta block at the top of a card. Layout only — `Card` owns padding. */
export function CardHeader({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** Main body of a card; grows so footers of sibling cards in a grid line up. */
export function CardContent({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("flex flex-1 flex-col gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** Optional actions/meta row pinned to the bottom of a card. */
export function CardFooter({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-auto flex flex-wrap items-center gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { cardVariants };
