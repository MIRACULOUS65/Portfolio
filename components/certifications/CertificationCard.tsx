import Image from "next/image";
import { CalendarDays, ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/shared/Card";
import type { Certification } from "@/types";
import { cn } from "@/utils/cn";

/**
 * A single certification preview on the Homepage's CertificationsSection, and
 * in the full listing on the `/certifications` page (Requirement 12.3,
 * Component_Specification §9 "CertificationCard — Issuer, Title, Date,
 * Credential link").
 *
 * ## Credential link is conditional, everything else is not
 *
 * `Certification.credentialUrl` is optional in the data model — an internal
 * programme with no public verification page simply omits it
 * (`data/certifications.ts` documents `nordwind-frontend-performance-specialist`
 * as exactly this case). Requirement 12.3 asks for "a link to the credential
 * where available," so the link renders only when `credentialUrl` is a
 * non-empty string; issuer, title, badge image, and issue date always render,
 * since those fields are required on every `Certification`.
 *
 * The link text names the certification ("View credential for {title}")
 * rather than a generic "View credential" — several of these cards render
 * side by side in the preview grid, and identical link text is
 * indistinguishable when a screen reader lists the page's links (the same
 * reasoning `ExploreMoreButton` documents for its own label). It is a real
 * external anchor with `target="_blank"` and `rel="noopener noreferrer"`,
 * matching this codebase's convention for links that leave the site
 * (`SocialLinks`'s active profile links use the same pair).
 *
 * ## Badge image
 *
 * `next/image` with explicit `width`/`height` reserves the badge's box before
 * it loads, so it cannot cause layout shift regardless of the source SVG's own
 * dimensions (the same reasoning `Avatar` documents). `object-contain` (rather
 * than `object-cover`, which `Avatar`/`BlogCard` use for photography) keeps a
 * badge's own aspect ratio intact instead of cropping it, since badge artwork
 * is a fixed logo/seal rather than a photo that tolerates cropping.
 *
 * Purely presentational Server Component: no state, no effects, no data
 * access — it receives a fully-resolved `Certification` record and renders it.
 */
export interface CertificationCardProps {
  /** The certification to render. Sourced by the caller from `lib/data-access.ts`. */
  certification: Certification;
  /** Extra utilities merged onto the card; conflicting classes win (see `cn`). */
  className?: string;
}

/** Intrinsic pixel size passed to `next/image` for the badge artwork. */
const BADGE_INTRINSIC_SIZE = 64;

/**
 * Formats an `ISODateString` (`"YYYY-MM-DD"`) as a human-readable date
 * (e.g. "Mar 12, 2024"). Parsed as UTC (`T00:00:00Z`) so the displayed date
 * never shifts a day depending on the visitor's timezone — the same helper
 * shape `BlogCard.formatPublishedDate` uses for its own date field.
 */
function formatIssueDate(issueDate: string): string {
  const date = new Date(`${issueDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function CertificationCard({
  certification,
  className,
}: CertificationCardProps) {
  const { title, issuer, issueDate, credentialUrl, badgeImage } =
    certification;
  const hasCredentialLink =
    typeof credentialUrl === "string" && credentialUrl.trim() !== "";

  return (
    <Card
      as="article"
      variant="glow"
      data-slot="certification-card"
      className={cn("gap-4", className)}
    >
      <CardHeader className="flex-row items-start gap-4">
        <span className="relative block size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          <Image
            src={badgeImage}
            alt={`${title} badge`}
            width={BADGE_INTRINSIC_SIZE}
            height={BADGE_INTRINSIC_SIZE}
            className="size-full object-contain"
          />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-h4 text-foreground">{title}</h3>
          <p className="text-small text-muted-foreground">{issuer}</p>
        </div>
      </CardHeader>

      <CardContent>
        <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          <time dateTime={issueDate}>{formatIssueDate(issueDate)}</time>
        </span>

        {hasCredentialLink ? (
          <a
            href={credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-small font-medium text-primary underline-offset-4 hover:underline"
          >
            View credential for {title}
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
