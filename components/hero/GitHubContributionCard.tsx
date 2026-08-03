import { GitBranch } from "lucide-react";

import { Card, CardHeader } from "@/components/shared/Card";
import {
  currentStreak,
  longestStreak,
  totalContributions,
  type ContributionDay,
  type GitHubContributionsResponse,
} from "@/components/hero/githubContributions";
import { getSocialByPlatform } from "@/lib/data-access";
import { cn } from "@/utils/cn";

/**
 * The HeroSection's GitHub contribution graph (Requirement 7.2,
 * Component_Specification §5, design.md "GitHubContributionCard (Server,
 * static image/embed)").
 *
 * ## A real, self-rendered heatmap — not a third-party embed
 *
 * This card used to embed a request-time SVG from `ghchart.rshah.org` with a
 * CSS `grayscale` filter. It now fetches real contribution data server-side
 * from the public, no-auth-required
 * `https://github-contributions-api.jogruber.de/v4/<username>?y=last`
 * endpoint and renders its own GitHub-style grid: 53 week-columns × 7
 * day-rows, one small rounded square per day. `{ next: { revalidate: 3600 } }`
 * caches the response for an hour, so the grid is not refetched on every
 * request.
 *
 * ## Async Server Component
 *
 * Next.js supports `async` Server Components natively, so this component
 * `await`s its own fetch rather than delegating to a Client Component with a
 * `useEffect` — no client JS is needed for a static grid (item D.5). If the
 * fetch fails, or the response is otherwise unusable, the card renders
 * nothing, matching this file's existing `if (!github) return null` defensive
 * style rather than surfacing a visible error.
 *
 * ## Colour: monochrome ramp, level 0 invisible
 *
 * `level` (`0`–`4`) maps to {@link LEVEL_CLASS}: `0` is exactly the card's own
 * surface colour (`bg-card`, matching `Card`'s background) so an empty day is
 * blended fully into the background rather than rendered as a visible grey
 * square; `1`–`4` step up `bg-foreground`'s opacity, giving a white/grey ramp
 * with no green — the same monochrome direction the previous `grayscale`
 * filter aimed for, now achieved natively instead of via a CSS filter over a
 * third party's green palette.
 *
 * ## Streak/total math lives in a sibling pure module
 *
 * `totalContributions`, `currentStreak`, and `longestStreak`
 * (`githubContributions.ts`) are colocated, unit-testable pure functions
 * rather than being computed inline here, so they can be tested without
 * rendering anything or mocking `fetch`.
 *
 * ## Username source
 *
 * The GitHub handle is never hardcoded in JSX (Requirement 4.3): it is
 * resolved from the `Social` entry whose `platform` is `"GitHub"` via
 * `getSocialByPlatform`, the data-access layer's single entry point
 * (Requirement 4.2).
 *
 * Wrapped in the shared `Card` (`variant="flat"`, since it is one of two
 * cards inside the already-elevated `HeroSection`, matching the resting-surface
 * convention `CurrentActivityCard` follows) so it shares the site's card
 * geometry (Component_Specification §3, Design_System §23).
 *
 * The header icon is `GitBranch` rather than a GitHub brand mark: the
 * installed `lucide-react` no longer ships trademarked brand icons (removed
 * upstream), so this uses a neutral glyph from the same set that still reads
 * as "GitHub/version control" next to the "GitHub Activity" label.
 */
export interface GitHubContributionCardProps {
  /** Extra utilities merged onto the card; conflicting classes win (see `cn`). */
  className?: string;
}

/** Number of day-rows in the grid: one per weekday. */
const DAYS_PER_WEEK = 7;

/**
 * Monochrome ramp for `ContributionDay.level`, keyed by level. Level `0`
 * matches the card's own surface colour exactly (invisible/blended in);
 * levels 1–4 step up `bg-foreground`'s opacity.
 */
const LEVEL_CLASS: Readonly<Record<0 | 1 | 2 | 3 | 4, string>> = {
  0: "bg-card",
  1: "bg-foreground/25",
  2: "bg-foreground/50",
  3: "bg-foreground/75",
  4: "bg-foreground",
};

/**
 * Fetches the visitor-facing contribution dataset for `username`, or `null`
 * on any failure (network error, non-2xx response, unexpected JSON shape).
 * Cached for an hour via `next: { revalidate: 3600 }`.
 */
async function fetchContributions(
  username: string,
): Promise<GitHubContributionsResponse | null> {
  try {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GitHubContributionsResponse;

    if (!Array.isArray(data.contributions)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Groups a chronologically-sorted list of days into week-columns of
 * {@link DAYS_PER_WEEK} rows each, padding the first week with `null` cells
 * so day-of-week stays aligned to a fixed row index (Sunday = row 0),
 * matching GitHub's own grid convention.
 */
function groupIntoWeeks(
  days: readonly ContributionDay[],
): ReadonlyArray<ReadonlyArray<ContributionDay | null>> {
  if (days.length === 0) {
    return [];
  }

  const firstWeekday = new Date(`${days[0]!.date}T00:00:00Z`).getUTCDay();
  const padded: Array<ContributionDay | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
  ];

  const weeks: Array<Array<ContributionDay | null>> = [];
  for (let index = 0; index < padded.length; index += DAYS_PER_WEEK) {
    weeks.push(padded.slice(index, index + DAYS_PER_WEEK));
  }

  return weeks;
}

export async function GitHubContributionCard({
  className,
}: GitHubContributionCardProps) {
  const github = getSocialByPlatform("GitHub");

  if (!github) {
    return null;
  }

  const data = await fetchContributions(github.username);

  if (!data || data.contributions.length === 0) {
    return null;
  }

  const { contributions } = data;
  const weeks = groupIntoWeeks(contributions);
  const total = totalContributions(contributions);
  const current = currentStreak(contributions);
  const longest = longestStreak(contributions);

  return (
    <Card
      variant="flat"
      data-slot="github-contribution-card"
      className={cn("gap-3 p-4 sm:p-4", className)}
    >
      <CardHeader className="flex-row items-center gap-2">
        <GitBranch
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        <span className="text-small font-medium text-foreground">
          GitHub Activity
        </span>
      </CardHeader>

      <div
        role="img"
        aria-label={`${github.username}'s GitHub contribution graph: ${total} contributions in the last year`}
        className="flex gap-[3px] overflow-x-auto"
      >
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {week.map((day, dayIndex) => (
              <span
                key={day?.date ?? `empty-${weekIndex}-${dayIndex}`}
                aria-hidden="true"
                className={cn(
                  "size-[10px] rounded-[2px] border border-border/50",
                  day ? LEVEL_CLASS[day.level] : "bg-card",
                )}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-caption text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{total}</span>{" "}
          contributions
        </span>
        <span>
          <span className="font-medium text-foreground">{current}</span>{" "}
          current streak
        </span>
        <span>
          <span className="font-medium text-foreground">{longest}</span>{" "}
          longest streak
        </span>
      </div>
    </Card>
  );
}
