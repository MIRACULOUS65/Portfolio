/**
 * Live CodeChef profile fetch for the homepage CompetitiveProgrammingSection
 * (Requirements 4.10, 13.1, 13.2).
 *
 * There is no official public CodeChef API. This module calls a best-effort
 * public community API (`https://codechef-stats.tashif.codes/<username>`,
 * confirmed working) wrapped in try/catch with a graceful fallback: unlike
 * `lib/leetcode.ts` and `lib/codeforces.ts`, this module never throws and
 * never rejects — every failure mode (network error, timeout, non-OK
 * response, malformed payload, unknown username) resolves to a zeroed
 * placeholder profile instead, since CodeChef's third-party API landscape is
 * the least reliable of the three platforms.
 *
 * Errors are logged only in development (`NODE_ENV !== "production"`), never
 * in production, per this module's fallback contract.
 */

const CODECHEF_STATS_API_BASE = "https://codechef-stats.tashif.codes";

/** Abort budget so a hung endpoint cannot stall the whole section render. */
const REQUEST_TIMEOUT_MS = 8_000;

/** A CodeChef user's public rating/rank and solved-problem count. */
export interface CodeChefProfile {
  readonly username: string;
  readonly rating: number;
  readonly maxRating: number;
  readonly stars?: string;
  readonly solvedCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function logDevOnly(message: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }
}

/** The zeroed placeholder returned on any failure, never a throw. */
function placeholderProfile(username: string): CodeChefProfile {
  return {
    username,
    rating: 0,
    maxRating: 0,
    stars: undefined,
    solvedCount: 0,
  };
}

/**
 * Fetches `username`'s public CodeChef rating/rank/solved-count from a
 * best-effort community API.
 *
 * Never throws and never rejects — every failure degrades to
 * {@link placeholderProfile} so the caller never needs its own try/catch for
 * this platform specifically (though `CompetitiveProgrammingSection` still
 * falls back to the static dataset value for consistency with the other two
 * platforms, since a zeroed live profile is not a good user-facing result
 * either).
 *
 * @param username - The CodeChef username.
 */
export async function getCodeChefProfile(
  username: string,
): Promise<CodeChefProfile> {
  if (!username) {
    return placeholderProfile(username);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${CODECHEF_STATS_API_BASE}/${encodeURIComponent(username)}`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      logDevOnly(
        `getCodeChefProfile: non-OK response (${response.status}) for "${username}"`,
        undefined,
      );
      return placeholderProfile(username);
    }

    const payload: unknown = await response.json();

    if (!isRecord(payload) || payload.status !== "success" || !isRecord(payload.data)) {
      logDevOnly(
        `getCodeChefProfile: malformed or unsuccessful payload for "${username}"`,
        payload,
      );
      return placeholderProfile(username);
    }

    const { data } = payload;

    return {
      username,
      rating: typeof data.currentRating === "number" ? data.currentRating : 0,
      maxRating: typeof data.maxRating === "number" ? data.maxRating : 0,
      stars: typeof data.rank === "string" ? data.rank : undefined,
      solvedCount: typeof data.totalSolved === "number" ? data.totalSolved : 0,
    };
  } catch (error) {
    logDevOnly(`getCodeChefProfile: request failed for "${username}"`, error);
    return placeholderProfile(username);
  } finally {
    clearTimeout(timeoutId);
  }
}
