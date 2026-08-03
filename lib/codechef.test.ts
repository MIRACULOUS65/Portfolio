import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCodeChefProfile } from "@/lib/codechef";

/**
 * Unit tests for `lib/codechef.ts#getCodeChefProfile`, mocking
 * `global.fetch`.
 *
 * Covers the never-throws contract this module documents: every failure mode
 * (network error, timeout/abort, non-OK response, malformed/unsuccessful
 * payload) resolves to a zeroed placeholder profile instead of rejecting.
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

describe("getCodeChefProfile", () => {
  it("maps a successful payload to a CodeChefProfile", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        status: "success",
        message: "retrieved",
        platform: "codechef",
        username: "sushovan_680",
        cached: false,
        data: {
          totalSolved: 61,
          totalActiveDays: 6,
          totalContests: 2,
          currentRating: 1511,
          maxRating: 1511,
          rank: "2★",
          badgesCount: 0,
        },
      }),
    );

    const profile = await getCodeChefProfile("sushovan_680");

    expect(profile).toEqual({
      username: "sushovan_680",
      rating: 1511,
      maxRating: 1511,
      stars: "2★",
      solvedCount: 61,
    });
  });

  it("resolves to a zeroed placeholder (never rejects) on a non-OK HTTP response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, { ok: false, status: 402 }));

    const profile = await getCodeChefProfile("sushovan_680");

    expect(profile).toEqual({
      username: "sushovan_680",
      rating: 0,
      maxRating: 0,
      stars: undefined,
      solvedCount: 0,
    });
  });

  it("resolves to a zeroed placeholder on an unsuccessful/malformed payload", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ status: "error", message: "user not found" }),
    );

    const profile = await getCodeChefProfile("no_such_user");

    expect(profile.rating).toBe(0);
    expect(profile.solvedCount).toBe(0);
  });

  it("resolves to a zeroed placeholder (never rejects) on a network error", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    await expect(getCodeChefProfile("sushovan_680")).resolves.toEqual({
      username: "sushovan_680",
      rating: 0,
      maxRating: 0,
      stars: undefined,
      solvedCount: 0,
    });
  });

  it("resolves to a zeroed placeholder for an empty username without calling fetch", async () => {
    const profile = await getCodeChefProfile("");

    expect(profile.solvedCount).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});
