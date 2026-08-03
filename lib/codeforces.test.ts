import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCodeforcesProfile } from "@/lib/codeforces";

/**
 * Unit tests for `lib/codeforces.ts#getCodeforcesProfile`, mocking
 * `global.fetch`. Two API calls are made (`user.info`, `user.status`), so the
 * mock is a sequenced implementation keyed off the requested URL.
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

const INFO_RESULT = [
  {
    handle: "sushovan1908",
    rating: 369,
    maxRating: 369,
    rank: "newbie",
  },
];

const STATUS_RESULT_WITH_DUPLICATES = [
  { verdict: "OK", problem: { contestId: 2248, index: "A" } },
  { verdict: "SKIPPED", problem: { contestId: 2210, index: "D" } },
  { verdict: "OK", problem: { contestId: 2248, index: "A" } }, // duplicate solve
  { verdict: "OK", problem: { contestId: 2100, index: "B" } },
];

describe("getCodeforcesProfile", () => {
  it("maps user.info + user.status into a CodeforcesProfile with a de-duplicated solved count", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input);

      if (url.includes("user.info")) {
        return Promise.resolve(
          jsonResponse({ status: "OK", result: INFO_RESULT }),
        );
      }

      return Promise.resolve(
        jsonResponse({
          status: "OK",
          result: STATUS_RESULT_WITH_DUPLICATES,
        }),
      );
    });

    const profile = await getCodeforcesProfile("sushovan1908");

    expect(profile).toEqual({
      handle: "sushovan1908",
      rating: 369,
      maxRating: 369,
      rank: "newbie",
      solvedCount: 2, // two distinct problems: 2248-A and 2100-B
    });
  });

  it("rejects when user.info reports a non-OK status (unknown handle)", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input);

      if (url.includes("user.info")) {
        return Promise.resolve(
          jsonResponse({
            status: "FAILED",
            comment: "handle: User with handle ghost not found",
          }),
        );
      }

      return Promise.resolve(jsonResponse({ status: "OK", result: [] }));
    });

    await expect(getCodeforcesProfile("ghost")).rejects.toThrow();
  });

  it("rejects when user.status fails even if user.info succeeds", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input);

      if (url.includes("user.info")) {
        return Promise.resolve(
          jsonResponse({ status: "OK", result: INFO_RESULT }),
        );
      }

      return Promise.resolve(
        jsonResponse({ status: "FAILED", comment: "call limit exceeded" }),
      );
    });

    await expect(getCodeforcesProfile("sushovan1908")).rejects.toThrow();
  });

  it("rejects on a network error", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    await expect(getCodeforcesProfile("sushovan1908")).rejects.toThrow();
  });

  it("rejects for an empty handle without calling fetch", async () => {
    await expect(getCodeforcesProfile("")).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
