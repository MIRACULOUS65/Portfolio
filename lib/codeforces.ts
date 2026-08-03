/**
 * Live Codeforces profile fetch for the homepage CompetitiveProgrammingSection
 * (Requirements 4.10, 13.1, 13.2).
 *
 * Uses the official Codeforces API (`https://codeforces.com/api/`):
 * - `user.info?handles=<handle>` for rating/rank.
 * - `user.status?handle=<handle>` to compute the solved-problem count: the
 *   number of *distinct* problems (by `contestId`-`index`) with at least one
 *   `"OK"` verdict submission, since a problem can be submitted (and fail)
 *   many times before it is solved once.
 *
 * Like `lib/leetcode.ts`, this module is allowed to throw on failure — the
 * caller falls back to the last-known static value for this platform only.
 */

const CODEFORCES_API_BASE = "https://codeforces.com/api";

/** Abort budget so a hung endpoint cannot stall the whole section render. */
const REQUEST_TIMEOUT_MS = 8_000;

/** A solved Codeforces submission's problem identity, for de-duplication. */
interface CodeforcesSubmission {
  readonly verdict?: unknown;
  readonly problem?: {
    readonly contestId?: unknown;
    readonly index?: unknown;
  };
}

interface CodeforcesUserInfo {
  readonly handle?: unknown;
  readonly rating?: unknown;
  readonly maxRating?: unknown;
  readonly rank?: unknown;
}

interface CodeforcesApiResponse<T> {
  readonly status?: unknown;
  readonly comment?: unknown;
  readonly result?: T;
}

/** A Codeforces user's public rating/rank and a computed solved-problem count. */
export interface CodeforcesProfile {
  readonly handle: string;
  readonly rating?: number;
  readonly maxRating?: number;
  readonly rank?: string;
  readonly solvedCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function fetchJson<T>(url: string): Promise<CodeforcesApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Codeforces API responded with ${response.status} for ${url}`);
  }

  const payload: unknown = await response.json();

  if (!isRecord(payload)) {
    throw new Error(`Codeforces API returned a malformed payload for ${url}`);
  }

  return payload as CodeforcesApiResponse<T>;
}

/**
 * Fetches `handle`'s public Codeforces rating/rank and computes their solved
 * problem count from submission history.
 *
 * Rejects when either API call fails, times out, returns a non-OK response,
 * or reports `status !== "OK"` (which the official API uses for an unknown
 * handle, among other errors) — the caller decides the fallback.
 *
 * @param handle - The Codeforces handle.
 */
export async function getCodeforcesProfile(
  handle: string,
): Promise<CodeforcesProfile> {
  if (!handle) {
    throw new Error("getCodeforcesProfile: handle is required");
  }

  const infoUrl = `${CODEFORCES_API_BASE}/user.info?handles=${encodeURIComponent(handle)}`;
  const statusUrl = `${CODEFORCES_API_BASE}/user.status?handle=${encodeURIComponent(handle)}`;

  const [infoPayload, statusPayload] = await Promise.all([
    fetchJson<CodeforcesUserInfo[]>(infoUrl),
    fetchJson<CodeforcesSubmission[]>(statusUrl),
  ]);

  if (infoPayload.status !== "OK" || !Array.isArray(infoPayload.result)) {
    throw new Error(
      `getCodeforcesProfile: user.info failed for "${handle}": ${String(
        infoPayload.comment ?? "unknown error",
      )}`,
    );
  }

  const info = infoPayload.result[0];

  if (!info || !isRecord(info)) {
    throw new Error(`getCodeforcesProfile: no Codeforces user found for "${handle}"`);
  }

  if (statusPayload.status !== "OK" || !Array.isArray(statusPayload.result)) {
    throw new Error(
      `getCodeforcesProfile: user.status failed for "${handle}": ${String(
        statusPayload.comment ?? "unknown error",
      )}`,
    );
  }

  const solvedProblemIds = new Set<string>();

  for (const submission of statusPayload.result) {
    if (
      isRecord(submission) &&
      submission.verdict === "OK" &&
      isRecord(submission.problem)
    ) {
      const { contestId, index } = submission.problem;
      solvedProblemIds.add(`${String(contestId)}-${String(index)}`);
    }
  }

  return {
    handle: typeof info.handle === "string" ? info.handle : handle,
    rating: typeof info.rating === "number" ? info.rating : undefined,
    maxRating: typeof info.maxRating === "number" ? info.maxRating : undefined,
    rank: typeof info.rank === "string" ? info.rank : undefined,
    solvedCount: solvedProblemIds.size,
  };
}
