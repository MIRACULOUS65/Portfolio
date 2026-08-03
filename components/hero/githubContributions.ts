/**
 * Pure helpers behind the custom GitHub contribution heatmap
 * (`GitHubContributionCard.tsx`, item D of the hero/homepage redesign).
 *
 * Kept in a sibling module — rather than inlined in the Server Component —
 * so the streak/total math is unit-testable without rendering anything or
 * mocking `fetch`.
 */

/** One day of contribution data, matching the shape returned by the
 * `github-contributions-api.jogruber.de` endpoint. */
export interface ContributionDay {
  /** `"YYYY-MM-DD"`. */
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/** The subset of the API's JSON response this module (and the card) reads. */
export interface GitHubContributionsResponse {
  total: Record<string, number>;
  contributions: ContributionDay[];
}

/**
 * Total contributions across the given days.
 *
 * Sums `count` directly rather than reading the API's own `total` field, so
 * this stays correct even if the caller passes a filtered/partial slice of
 * `contributions` (e.g. a single year already selected via `?y=last`).
 */
export function totalContributions(days: readonly ContributionDay[]): number {
  return days.reduce((sum, day) => sum + day.count, 0);
}

/**
 * The current streak: consecutive days with `count > 0`, walking backward
 * from the **last entry** in `days` (assumed chronologically sorted, which is
 * how the API returns them). Stops at the first zero-count day encountered.
 *
 * If the most recent day itself has `count === 0`, the current streak is `0`
 * — "current" means "still going as of the most recent day on record", not
 * "most recent nonzero day".
 */
export function currentStreak(days: readonly ContributionDay[]): number {
  let streak = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index]!.count <= 0) {
      break;
    }

    streak += 1;
  }

  return streak;
}

/**
 * The longest streak: the longest run of consecutive days with `count > 0`
 * anywhere in `days`.
 */
export function longestStreak(days: readonly ContributionDay[]): number {
  let longest = 0;
  let running = 0;

  for (const day of days) {
    if (day.count > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  return longest;
}
