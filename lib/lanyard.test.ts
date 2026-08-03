import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchLanyardStatus } from "@/lib/lanyard";

/**
 * Unit tests for `lib/lanyard.ts#fetchLanyardStatus`, mocking `global.fetch`.
 *
 * Covers the never-throws contract (Requirement 8.2, 8.6) that
 * `useCurrentActivity` (task 20.6) depends on: every failure mode resolves to
 * `undefined` instead of rejecting.
 */

const DISCORD_USER_ID = "94490510688792576";

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

describe("fetchLanyardStatus", () => {
  it("maps a successful Spotify-listening payload to a Listening CurrentActivity", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          discord_status: "online",
          listening_to_spotify: true,
          spotify: {
            song: "Let Go",
            artist: "Ark Patrol; Veronika Redd",
            album_art_url: "https://i.scdn.co/image/abc",
          },
          activities: [],
        },
      }),
    );

    const result = await fetchLanyardStatus(DISCORD_USER_ID);

    expect(result).toBeDefined();
    expect(result?.source).toBe("lanyard");
    expect(result?.status).toBe("Listening");
    expect(result?.title).toBe("Let Go");
    expect(result?.subtitle).toBe("Ark Patrol; Veronika Redd");
    expect(result?.image).toBe("https://i.scdn.co/image/abc");
    expect(typeof result?.updatedAt).toBe("string");
    expect(() => new Date(result!.updatedAt).toISOString()).not.toThrow();
  });

  it("maps a VS Code activity payload to a Coding CurrentActivity", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          discord_status: "online",
          listening_to_spotify: false,
          spotify: null,
          activities: [
            {
              type: 0,
              name: "Visual Studio Code",
              details: "Editing README.md",
              state: "Workspace: lanyard",
              application_id: "383226320970055681",
            },
          ],
        },
      }),
    );

    const result = await fetchLanyardStatus(DISCORD_USER_ID);

    expect(result?.source).toBe("lanyard");
    expect(result?.status).toBe("Coding");
    expect(result?.title).toBe("Editing README.md");
    expect(result?.subtitle).toBe("Workspace: lanyard");
  });

  it("maps a non-VS-Code type-0 activity payload to a Gaming CurrentActivity", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          discord_status: "online",
          listening_to_spotify: false,
          activities: [
            {
              type: 0,
              name: "Elden Ring",
              details: "Exploring Limgrave",
              application_id: "111111111111111111",
            },
          ],
        },
      }),
    );

    const result = await fetchLanyardStatus(DISCORD_USER_ID);

    expect(result?.source).toBe("lanyard");
    expect(result?.status).toBe("Gaming");
    expect(result?.title).toBe("Elden Ring");
  });

  it("maps a bare offline status to an Offline CurrentActivity", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          discord_status: "offline",
          listening_to_spotify: false,
          activities: [],
        },
      }),
    );

    const result = await fetchLanyardStatus(DISCORD_USER_ID);

    expect(result?.source).toBe("lanyard");
    expect(result?.status).toBe("Offline");
  });

  it("returns undefined (not a throw) on a non-OK HTTP response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, { ok: false, status: 404 }));

    await expect(fetchLanyardStatus(DISCORD_USER_ID)).resolves.toBeUndefined();
  });

  it("returns undefined on a network error, without throwing", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    await expect(fetchLanyardStatus(DISCORD_USER_ID)).resolves.toBeUndefined();
  });

  it("returns undefined on an AbortError (timeout), without throwing", async () => {
    vi.mocked(fetch).mockImplementation(() => {
      const error = new DOMException("The operation was aborted.", "AbortError");
      return Promise.reject(error);
    });

    await expect(fetchLanyardStatus(DISCORD_USER_ID)).resolves.toBeUndefined();
  });

  it("returns undefined on malformed JSON, without throwing", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
    } as unknown as Response);

    await expect(fetchLanyardStatus(DISCORD_USER_ID)).resolves.toBeUndefined();
  });

  it("returns undefined when the payload reports success: false", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: false, data: null }),
    );

    await expect(fetchLanyardStatus(DISCORD_USER_ID)).resolves.toBeUndefined();
  });

  it("returns undefined for an empty discordUserId without calling fetch", async () => {
    await expect(fetchLanyardStatus("")).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
