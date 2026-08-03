import Image from "next/image";
import { CalendarDays } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/shared/Card";
import type { Education } from "@/types";
import { cn } from "@/utils/cn";

/**
 * A single education history entry on the Homepage's EducationSection
 * (Requirement 15.1, Component_Specification "EducationCard — institution,
 * degree, duration, achievements").
 *
 * ## Specialization is combined into the subtitle, not a separate field
 *
 * `Education.specialization` is optional in the data model — not every entry
 * (e.g. a diploma or bootcamp) has a declared major/track. Requirement 15.1
 * only calls for "degree" among its listed fields, so `specialization` is
 * appended onto the degree line when present ("B.Sc. in Computer Science —
 * Machine Learning") rather than rendered as its own labelled row, the same
 * way `CertificationCard` folds its conditional field into an existing line
 * instead of adding new layout that most entries would never fill.
 *
 * ## Duration and the ongoing case
 *
 * `Education.endDate` is absent for a degree still in progress. Rather than
 * omitting the end date silently, the range renders as "{start} — Present" —
 * both ends of the range are always real `<time>` elements with a `dateTime`
 * attribute, but the second only takes a visible end date when one exists,
 * matching the `formatIssueDate`/`formatPublishedDate`/`formatHackathonDate`
 * UTC-parsed `Intl.DateTimeFormat` pattern this codebase already uses for
 * every other date field.
 *
 * ## Achievements list is conditional
 *
 * `Education.achievements` is a required field but may be an empty array —
 * not every entry has notable achievements to call out. The list (and its
 * heading) render only when at least one achievement exists, so no card ends
 * up with an "Achievements" heading followed by nothing.
 *
 * ## Logo
 *
 * `next/image` with explicit `width`/`height` reserves the logo's box before
 * it loads, so it cannot cause layout shift regardless of the source image's
 * own dimensions (the same reasoning `Avatar` and `CertificationCard`'s badge
 * document). The alt text names the institution rather than reading
 * "institution logo" generically, since several of these cards render side
 * by side and identical alt text is indistinguishable to a screen reader
 * listing the page's images.
 *
 * `grade` and `coursework` are part of the `Education` data model but are not
 * in Requirement 15.1's field list for this preview card, so neither renders
 * here; that richer detail belongs to a fuller education view if one is
 * added later.
 *
 * Purely presentational Server Component: no state, no effects, no data
 * access — it receives a fully-resolved `Education` record and renders it.
 */
export interface EducationCardProps {
  /** The education entry to render. Sourced by the caller from `lib/data-access.ts`. */
  education: Education;
  /** Extra utilities merged onto the card; conflicting classes win (see `cn`). */
  className?: string;
}

/** Intrinsic pixel size passed to `next/image` for the institution logo. */
const LOGO_INTRINSIC_SIZE = 64;

/**
 * Formats an `ISODateString` (`"YYYY-MM-DD"`) as a human-readable date
 * (e.g. "Sep 2021"). Parsed as UTC (`T00:00:00Z`) so the displayed date never
 * shifts a day depending on the visitor's timezone — the same helper shape
 * `BlogCard.formatPublishedDate` / `CertificationCard.formatIssueDate` /
 * `HackathonCard.formatHackathonDate` use for their own date fields.
 */
function formatEducationDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(parsed);
}

export function EducationCard({ education, className }: EducationCardProps) {
  const {
    institution,
    degree,
    specialization,
    startDate,
    endDate,
    achievements,
    logo,
  } = education;
  const hasSpecialization =
    typeof specialization === "string" && specialization.trim() !== "";
  const hasAchievements = achievements.length > 0;

  return (
    <Card
      as="article"
      variant="glow"
      data-slot="education-card"
      className={cn(className)}
    >
      <CardHeader className="flex-row items-start gap-4">
        <span className="relative block size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          <Image
            src={logo}
            alt={`${institution} logo`}
            width={LOGO_INTRINSIC_SIZE}
            height={LOGO_INTRINSIC_SIZE}
            className="size-full object-contain"
          />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-h4 text-foreground">{institution}</h3>
          <p className="text-small text-muted-foreground">
            {degree}
            {hasSpecialization ? ` — ${specialization}` : ""}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          <time dateTime={startDate}>{formatEducationDate(startDate)}</time>
          {" — "}
          {endDate ? (
            <time dateTime={endDate}>{formatEducationDate(endDate)}</time>
          ) : (
            <span>Present</span>
          )}
        </span>

        {hasAchievements ? (
          <div className="flex flex-col gap-1">
            <p className="text-small font-medium text-foreground">
              Achievements
            </p>
            <ul className="list-disc pl-4 text-small text-muted-foreground">
              {achievements.map((achievement) => (
                <li key={achievement}>{achievement}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
