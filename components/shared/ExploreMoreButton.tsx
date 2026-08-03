"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useSpecularShine } from "@/components/ui/useSpecularShine";
import { cn } from "@/utils/cn";
import "@/components/ui/specular-button.css";

/**
 * Fallback accessible name, used only when a caller passes a blank `label`.
 *
 * A link with no text has no accessible name at all, so a blank label degrades
 * to this rather than rendering an unnamed anchor (audited in task 44.3).
 * Callers should still pass something specific — "Explore all projects",
 * "Read the blog" — because several of these links coexist on the Homepage and
 * identical names are indistinguishable when a screen reader lists them.
 */
export const DEFAULT_EXPLORE_MORE_LABEL = "Explore More";

export interface ExploreMoreButtonProps {
  /**
   * Destination dedicated page — `/projects`, `/blog`, `/hackathons`, or
   * `/certifications` (Requirement 17.2).
   */
  href: string;
  /**
   * Visible link text, and therefore the accessible name. Must describe the
   * destination; never "click here" / "read more" on its own.
   */
  label: string;
  /** Extra utilities merged onto the link; conflicting classes win (see `cn`). */
  className?: string;
}

/**
 * The Explore More control: the single sanctioned way a Homepage preview
 * section sends a visitor to the matching dedicated page (Requirement 17.1,
 * 17.2; Routing_Architecture §3; Design_System §15).
 *
 * ## INVARIANT — this is the only shared component that routes
 *
 * `ExploreMoreButton` is the *only* shared component permitted to call
 * `next/link` for cross-route navigation away from the Homepage
 * (Requirement 17.3). See the module's earlier documentation history for the
 * full rationale; unchanged by the visual upgrade below.
 *
 * ## Styling: the same SpecularButton shine as the Hero's CTAs
 *
 * Rather than the plain `buttonVariants({ variant: "outline" })` treatment,
 * this renders with the identical `.specular-button` classes and mounts the
 * real WebGL shine effect via `useSpecularShine` (the same hook
 * `components/ui/specular-button.tsx` uses) — a `next/link` can't use
 * `SpecularButton` directly (that component renders its own `<button>`/`<a>`
 * internally), so this client component wires the ref/effect pair onto its
 * own `<Link>` instead, matching every visual and hover-proximity behaviour.
 *
 * The arrow nudges right on hover — a `translateX`, transform-only — with
 * timing mirroring `DURATION.fast` (150ms) and `EASING.out` from
 * `@/lib/motion` (Requirement 24.2). `motion-reduce:` variants cancel the
 * nudge. The arrow is `aria-hidden`, so `label` remains the sole accessible
 * name.
 *
 * Client Component: `useSpecularShine` mounts a WebGL canvas and pointer
 * listeners on the browser, so this can no longer stay server-only — the
 * only Client boundary this introduces beyond what `SpecularButton` already
 * requires elsewhere on the page.
 */
export function ExploreMoreButton({
  href,
  label,
  className,
}: ExploreMoreButtonProps) {
  const text =
    typeof label === "string" && label.trim() !== ""
      ? label
      : DEFAULT_EXPLORE_MORE_LABEL;

  const linkRef = useRef<HTMLAnchorElement>(null);
  const fxRef = useRef<HTMLSpanElement>(null);

  useSpecularShine(linkRef, fxRef, {
    baseColor: "#404040",
    lineColor: "#ededed",
  });

  return (
    <Link
      ref={linkRef}
      data-slot="explore-more-button"
      href={href}
      className={cn(
        "specular-button specular-button--md group inline-flex items-center gap-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      style={{ "--sb-text-color": "var(--foreground)" } as React.CSSProperties}
    >
      <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
      <span className="specular-button__label inline-flex items-center gap-2">
        {text}
        <ArrowRight
          aria-hidden="true"
          className="transition-transform duration-150 ease-out will-change-transform group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        />
      </span>
    </Link>
  );
}
