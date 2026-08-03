import { Award, CalendarDays } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/shared/Card";
import type { Hackathon } from "@/types";
import { cn } from "@/utils/cn";

/**
 * A single hackathon preview on the Homepage's HackathonsSection
 * (Requirement 14.2, Component_Specification "HackathonCard — name,
 * organizer, date, achievement").
 *
 * ## Achievement is conditional, everything else is not
 *
 * `Hackathon.achievement` is optional in the data model — not every entry
 * placed or won an award. Requirement 14.2 asks for "the name, organizer,
 * date, and achievement," so the achievement renders only when present;
 * name, organizer, and date always render since those fields are required
 * on every `Hackathon` (the same conditional-field reasoning
 * `CertificationCard` documents for `credentialUrl`).
 *
 * Purely presentational Server Component: no state, no effects, no data
 * access — it receives a fully-resolved `Hackathon` record and renders it.
 * This preview card renders only the name/organizer/date/achievement subset;
 * the richer detail (description, images, team members, technologies,
 * demo/github links) belongs to the `/hackathons` listing page.
 */
export interface HackathonCardProps {
  /** The hackathon to render. Sourced by the caller from `lib/data-access.ts`. */
  hackathon: Hackathon;
  /** Extra utilities merged onto the card; conflicting classes win (see `cn`). */
  className?: string;
}

/**
 * Formats an `ISODateString` (`"YYYY-MM-DD"`) as a human-readable date
 * (e.g. "Oct 14, 2023"). Parsed as UTC (`T00:00:00Z`) so the displayed date
 * never shifts a day depending on the visitor's timezone — the same helper
 * shape `BlogCard.formatPublishedDate` / `CertificationCard.formatIssueDate`
 * use for their own date fields.
 */
function formatHackathonDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function HackathonCard({ hackathon, className }: HackathonCardProps) {
  const { name, organizer, date, achievement } = hackathon;
  const hasAchievement =
    typeof achievement === "string" && achievement.trim() !== "";

  return (
    <Card
      as="article"
      variant="glow"
      data-slot="hackathon-card"
      className={cn(className)}
    >
      <CardHeader>
        <h3 className="text-h4 text-foreground">{name}</h3>
        <p className="text-small text-muted-foreground">{organizer}</p>
      </CardHeader>

      <CardContent>
        <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          <time dateTime={date}>{formatHackathonDate(date)}</time>
        </span>

        {hasAchievement ? (
          <span className="inline-flex items-center gap-1.5 text-small font-medium text-foreground">
            <Award aria-hidden="true" className="size-3.5" />
            {achievement}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
