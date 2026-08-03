import Image from "next/image";
import { ExternalLink, Trophy } from "lucide-react";

import { Card, CardHeader } from "@/components/shared/Card";
import type { CompetitiveProgrammingPlatform } from "@/types";
import { cn } from "@/utils/cn";

/**
 * A single competitive programming profile on the homepage's
 * `CompetitiveProgrammingSection` (Requirement 13.2, Component_Specification
 * §10 "PlatformCard — Platform logo, rating, solved, rank, profile link").
 *
 * ## Header row: logo — name/username — Profile link (item G)
 *
 * Line 1 is a three-part header: the logo on the left, platform name +
 * username stacked in the middle with a comfortable gap from the logo, and
 * the "Profile" link pinned to the top-right corner of the card via
 * `justify-between` — no longer buried in the stats row. Line 2 spreads
 * Rating/Solved/Rank evenly across the card's width via `justify-between`
 * rather than left-packing them with bullet dividers, so the three stats
 * read as parallel columns instead of a single run-on line.
 *
 * ## Rank is conditional, everything else is not
 *
 * `CompetitiveProgrammingPlatform.rank` is optional in the data model — a
 * platform whose profile does not expose a rank/tier simply omits its
 * segment from the stats row. Every other field (`logo`, `rating`, `solved`,
 * `profileUrl`) is required and always renders. An empty `<span />`
 * placeholder fills the rank slot when absent, so `justify-between` still
 * distributes Rating and Solved to their original two positions rather than
 * collapsing them together.
 *
 * ## Profile link: one-word visible text, descriptive accessible name
 *
 * The visible link text is just "Profile", but the anchor's `aria-label`
 * still carries the fuller "View {username}'s {platform} profile" text,
 * since several of these cards render side by side in the section grid and
 * identical *visible* link text would otherwise be indistinguishable when a
 * screen reader lists the page's links (the same reasoning `CertificationCard`
 * documents for its own link, now carried by `aria-label` instead of by the
 * visible text). It remains a real external anchor with `target="_blank"` and
 * `rel="noopener noreferrer"`, matching this codebase's convention for links
 * that leave the site.
 *
 * ## Platform logo
 *
 * `next/image` with explicit `width`/`height` reserves the logo's box before
 * it loads, so it cannot cause layout shift regardless of the source SVG's
 * own dimensions (the same reasoning `CertificationCard`'s badge image
 * documents). `object-contain` keeps the logo's own aspect ratio intact
 * instead of cropping it.
 *
 * Purely presentational Server Component: no state, no effects, no data
 * access — it receives a fully-resolved `CompetitiveProgrammingPlatform`
 * record and renders it.
 */
export interface PlatformCardProps {
  /** The platform profile to render. Sourced by the caller from `lib/data-access.ts`. */
  platform: CompetitiveProgrammingPlatform;
  /** Extra utilities merged onto the card; conflicting classes win (see `cn`). */
  className?: string;
}

/** Intrinsic pixel size passed to `next/image` for the platform logo. */
const LOGO_INTRINSIC_SIZE = 40;

export function PlatformCard({ platform, className }: PlatformCardProps) {
  const { platform: platformName, username, profileUrl, rating, solved, rank, logo } =
    platform;
  const hasRank = typeof rank === "string" && rank.trim() !== "";

  return (
    <Card
      as="article"
      variant="glow"
      data-slot="platform-card"
      className={cn("gap-3", className)}
    >
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative block size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            <Image
              src={logo}
              alt={`${platformName} logo`}
              width={LOGO_INTRINSIC_SIZE}
              height={LOGO_INTRINSIC_SIZE}
              className="size-full object-contain"
            />
          </span>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-h4 text-foreground">{platformName}</h3>
            <p className="text-small text-muted-foreground">{username}</p>
          </div>
        </div>

        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${username}'s ${platformName} profile`}
          className="inline-flex shrink-0 items-center gap-1 text-small font-medium text-primary underline-offset-4 hover:underline"
        >
          Profile
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      </CardHeader>

      <div className="flex items-center justify-between gap-2 text-small text-foreground">
        <span>
          <span className="text-muted-foreground">Rating</span> {rating}
        </span>
        <span>
          <span className="text-muted-foreground">Solved</span> {solved}
        </span>
        {hasRank ? (
          <span className="inline-flex items-center gap-1">
            <span className="text-muted-foreground">Rank</span>
            <Trophy aria-hidden="true" className="size-3.5" />
            {rank}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </Card>
  );
}
