import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLeetCodeProfile } from "@/lib/leetcode";

/**
 * Unit tests for `lib/leetcode.ts#getLeetCodeProfile`, mocking `global.fetch`
 * following the pattern established in `lib/lanyard.test.ts`.
 *
 * Unlike `fetchLanyardStatus`, this module is allowed to reject — the caller
 * (`CompetitiveProgrammingSection`) is responsible for the per-platform
 * static fallback — so these tests cover both the success shape and every
 * rejection path.
 */

function jsonResponse(body: unknown, init?: { ok?: boolean; status?: number }) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: () => Promise.resolve(body),
  } as Response;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLeetCodeProfile", () => {
  it("maps a successful payload with contest ranking to a LeetCodeProfile", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        data: {
          matchedUser: {
            username: "Ayanokoji_65",
            submitStats: {
              acSubmissionNum: [
                { difficulty: "All", count: 52 },
                { difficulty: "Easy", count: 18 },
                { difficulty: "Medium", count: 26 },
                { difficulty: "Hard", count: 8 },
              ],
            },
          },
          userContestRanking: {
            rating: 1684.782,
            globalRanking: 129904,
            topPercentage: 15.07,
          },
        },
      }),
    );

    const profile = await getLeetCodeProfile("Ayanokoji_65");

    expect(profile).toEqual({
      username: "Ayanokoji_65",
      totalSolved: 52,
      easySolved: 18,
      mediumSolved: 26,
      hardSolved: 8,
      ranking: 129904,
      rating: 1684.782,
    });
  });

  it("omits rating/ranking when userContestRanking is null (never-contested user)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        data: {
          matchedUser: {
            username: "someuser",
            submitStats: {
              acSubmissionNum: [{ difficulty: "All", count: 10 }],
            },
          },
          userContestRanking: null,
        },
      }),
    );

    const profile = await getLeetCodeProfile("someuser");

    expect(profile.totalSolved).toBe(10);
    expect(profile.rating).toBeUndefined();
    expect(profile.ranking).toBeUndefined();
  });

  it("rejects when matchedUser is null (unknown username)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        data: { matchedUser: null, userContestRanking: null },
      }),
    );

    await expect(getLeetCodeProfile("no_such_user")).rejects.toThrow();
  });

  it("rejects on a non-OK HTTP response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, { ok: false, status: 500 }));

    await expect(getLeetCodeProfile("Ayanokoji_65")).rejects.toThrow();
  });

  it("rejects on a network error", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    await expect(getLeetCodeProfile("Ayanokoji_65")).rejects.toThrow();
  });

  it("rejects for an empty username without calling fetch", async () => {
    await expect(getLeetCodeProfile("")).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
