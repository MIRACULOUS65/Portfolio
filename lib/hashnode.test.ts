import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLatestHashnodeBlogs } from "@/lib/hashnode";

/**
 * Unit tests for `lib/hashnode.ts#getLatestHashnodeBlogs`, mocking
 * `global.fetch` following the pattern established in `lib/lanyard.test.ts`.
 *
 * Covers the never-throws contract: every failure mode (network error,
 * non-OK response, a GraphQL `errors` array, a malformed/empty publication)
 * resolves to `[]` instead of rejecting, which `BlogPreviewSection` depends on
 * to fall back to the static `data/blogs.ts` dataset.
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

describe("getLatestHashnodeBlogs", () => {
  it("maps a successful publication payload to HashnodeBlog[]", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        data: {
          publication: {
            posts: {
              edges: [
                {
                  node: {
                    title: "Pulseroom is a real-time chat application",
                    slug: "pulseroom-is-a-real-time-chat-application",
                    brief: "A NestJS + Next.js real-time chat app.",
                    coverImage: { url: "https://cdn.hashnode.com/cover.png" },
                    publishedAt: "2026-01-15T10:00:00.000Z",
                    readTimeInMinutes: 6,
                    url: "https://pulseroom.hashnode.dev/pulseroom-is-a-real-time-chat-application",
                  },
                },
              ],
            },
          },
        },
      }),
    );

    const posts = await getLatestHashnodeBlogs();

    expect(posts).toEqual([
      {
        title: "Pulseroom is a real-time chat application",
        slug: "pulseroom-is-a-real-time-chat-application",
        brief: "A NestJS + Next.js real-time chat app.",
        coverImageUrl: "https://cdn.hashnode.com/cover.png",
        publishedAt: "2026-01-15T10:00:00.000Z",
        readTimeInMinutes: 6,
        url: "https://pulseroom.hashnode.dev/pulseroom-is-a-real-time-chat-application",
      },
    ]);
  });

  it("skips a malformed edge but keeps well-formed ones", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        data: {
          publication: {
            posts: {
              edges: [
                { node: { title: "Missing everything else" } },
                {
                  node: {
                    title: "Good Post",
                    slug: "good-post",
                    brief: "Brief.",
                    coverImage: { url: "https://cdn.hashnode.com/x.png" },
                    publishedAt: "2026-02-01T00:00:00.000Z",
                    readTimeInMinutes: 3,
                    url: "https://pulseroom.hashnode.dev/good-post",
                  },
                },
              ],
            },
          },
        },
      }),
    );

    const posts = await getLatestHashnodeBlogs();

    expect(posts).toHaveLength(1);
    expect(posts[0]?.slug).toBe("good-post");
  });

  it("returns [] (not a throw) on a non-OK HTTP response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, { ok: false, status: 402 }));

    await expect(getLatestHashnodeBlogs()).resolves.toEqual([]);
  });

  it("returns [] when the response carries a GraphQL errors array (e.g. paid-tier-only API)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        errors: [{ message: "This API requires a Pro plan." }],
      }),
    );

    await expect(getLatestHashnodeBlogs()).resolves.toEqual([]);
  });

  it("returns [] when the publication has no posts", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        data: { publication: { posts: { edges: [] } } },
      }),
    );

    await expect(getLatestHashnodeBlogs()).resolves.toEqual([]);
  });

  it("returns [] on a network error, without throwing", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    await expect(getLatestHashnodeBlogs()).resolves.toEqual([]);
  });

  it("returns [] on malformed JSON, without throwing", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
    } as unknown as Response);

    await expect(getLatestHashnodeBlogs()).resolves.toEqual([]);
  });
});
