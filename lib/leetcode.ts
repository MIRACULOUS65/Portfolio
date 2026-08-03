/**
 * Live LeetCode profile fetch for the homepage CompetitiveProgrammingSection
 * (Requirements 4.10, 13.1, 13.2).
 *
 * Uses the public, unofficial LeetCode GraphQL API at
 * `https://leetcode.com/graphql`. There is no official public API; this
 * endpoint is the same one leetcode.com's own profile pages call from the
 * browser. Verified working from a plain server-side `fetch` with no
 * `Referer` header required.
 *
 * Unlike `lib/codechef.ts`, this module is allowed to throw — the caller
 * (`CompetitiveProgrammingSection`) is responsible for catching the rejection
 * and falling back to the last-known static value for this platform only,
 * per the section's fallback contract.
 */

const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";

/** Abort budget so a hung endpoint cannot stall the whole section render. */
const REQUEST_TIMEOUT_MS = 8_000;

const PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
      topPercentage
    }
  }
`;

/**
 * A LeetCode user's public solved-problem breakdown and (when the user has
 * competed in at least one contest) contest rating/ranking.
 *
 * `rating`/`ranking` are optional — LeetCode's `userContestRanking` resolves
 * to `null` for a user who has never entered a rated contest, so this module
 * treats contest data as best-effort rather than blocking the rest of the
 * profile on it.
 */
export interface LeetCodeProfile {
  readonly username: string;
  readonly totalSolved: number;
  readonly easySolved: number;
  readonly mediumSolved: number;
  readonly hardSolved: number;
  readonly ranking?: number;
  readonly rating?: number;
}

interface AcSubmissionEntry {
  readonly difficulty?: unknown;
  readonly count?: unknown;
}

interface MatchedUser {
  readonly username?: unknown;
  readonly submitStats?: {
    readonly acSubmissionNum?: unknown;
  };
}

interface UserContestRanking {
  readonly rating?: unknown;
  readonly globalRanking?: unknown;
}

interface LeetCodeGraphQLResponse {
  readonly data?: {
    readonly matchedUser?: MatchedUser | null;
    readonly userContestRanking?: UserContestRanking | null;
  };
  readonly errors?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function countForDifficulty(
  entries: readonly AcSubmissionEntry[],
  difficulty: "Easy" | "Medium" | "Hard" | "All",
): number {
  const match = entries.find((entry) => entry.difficulty === difficulty);
  return typeof match?.count === "number" ? match.count : 0;
}

/**
 * Fetches `username`'s public LeetCode profile: total/per-difficulty solved
 * counts, and contest rating/ranking when available.
 *
 * Rejects (never resolves to a partial/undefined value) when the request
 * fails, times out, returns a non-OK response, or the username does not
 * resolve to a LeetCode user (`matchedUser` is `null`) — the caller decides
 * the fallback, this module only reports success or failure.
 *
 * @param username - The LeetCode username (the `/u/<username>` segment).
 */
export async function getLeetCodeProfile(
  username: string,
): Promise<LeetCodeProfile> {
  if (!username) {
    throw new Error("getLeetCodeProfile: username is required");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PROFILE_QUERY,
        variables: { username },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(
      `getLeetCodeProfile: LeetCode GraphQL responded with ${response.status}`,
    );
  }

  const payload: unknown = await response.json();

  if (!isRecord(payload)) {
    throw new Error("getLeetCodeProfile: malformed response payload");
  }

  const { data } = payload as LeetCodeGraphQLResponse;
  const matchedUser = data?.matchedUser;

  if (!matchedUser) {
    throw new Error(`getLeetCodeProfile: no LeetCode user found for "${username}"`);
  }

  const acSubmissionNum = matchedUser.submitStats?.acSubmissionNum;
  const entries: readonly AcSubmissionEntry[] = Array.isArray(acSubmissionNum)
    ? acSubmissionNum.filter(isRecord)
    : [];

  const contestRanking = data?.userContestRanking;
  const rating =
    isRecord(contestRanking) && typeof contestRanking.rating === "number"
      ? contestRanking.rating
      : undefined;
  const ranking =
    isRecord(contestRanking) && typeof contestRanking.globalRanking === "number"
      ? contestRanking.globalRanking
      : undefined;

  return {
    username,
    totalSolved: countForDifficulty(entries, "All"),
    easySolved: countForDifficulty(entries, "Easy"),
    mediumSolved: countForDifficulty(entries, "Medium"),
    hardSolved: countForDifficulty(entries, "Hard"),
    ranking,
    rating,
  };
}
