/**
 * Live Hashnode blog post fetch for the homepage BlogPreviewSection
 * (Requirements 4.1, 10.1).
 *
 * Uses Hashnode's public GraphQL API (`https://gql.hashnode.com`), querying
 * `publication(host: "pulseroom.hashnode.dev") { posts(first: 3) { ... } }`.
 *
 * As of writing, Hashnode has retired free read access to this API — every
 * request now requires a Pro plan on the target publication (see Hashnode's
 * own changelog: "GraphQL API is moving to a paid offering"). A request
 * against the free tier redirects/fails rather than returning post data, so
 * this module's graceful-failure path is expected to be the common outcome
 * today, not just a defensive edge case. This module never throws — every
 * failure mode (network error, timeout, non-OK response, malformed payload,
 * a GraphQL `errors` array, an empty publication) resolves to `[]`, exactly
 * like `lib/lanyard.ts`'s never-throws contract, so `BlogPreviewSection` can
 * fall back to `data/blogs.ts` without its own try/catch.
 */

const HASHNODE_GRAPHQL_ENDPOINT = "https://gql.hashnode.com";

/** Abort budget so a hung endpoint cannot stall the whole section render. */
const REQUEST_TIMEOUT_MS = 8_000;

const PUBLICATION_HOST = "pulseroom.hashnode.dev";

const POSTS_QUERY = `
  query PublicationPosts($host: String!) {
    publication(host: $host) {
      posts(first: 3) {
        edges {
          node {
            title
            slug
            brief
            coverImage {
              url
            }
            publishedAt
            readTimeInMinutes
            url
          }
        }
      }
    }
  }
`;

/**
 * A single Hashnode blog post, mapped to the fields `BlogCard`/
 * `BlogPreviewSection` need.
 */
export interface HashnodeBlog {
  readonly title: string;
  readonly slug: string;
  readonly brief: string;
  readonly coverImageUrl: string;
  readonly publishedAt: string;
  readonly readTimeInMinutes: number;
  /** The external Hashnode URL — the actual link target for this post. */
  readonly url: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Maps one raw GraphQL `posts.edges[].node` entry into a `HashnodeBlog`, or
 * `undefined` when a required field is missing/malformed — an untrusted
 * payload degrading one bad post to "skipped" rather than throwing for the
 * whole publication.
 */
function toHashnodeBlog(node: unknown): HashnodeBlog | undefined {
  if (!isRecord(node)) {
    return undefined;
  }

  const title = asString(node.title);
  const slug = asString(node.slug);
  const brief = asString(node.brief);
  const publishedAt = asString(node.publishedAt);
  const url = asString(node.url);
  const coverImageUrl = isRecord(node.coverImage)
    ? asString(node.coverImage.url)
    : undefined;
  const readTimeInMinutes =
    typeof node.readTimeInMinutes === "number" ? node.readTimeInMinutes : undefined;

  if (
    !title ||
    !slug ||
    !brief ||
    !publishedAt ||
    !url ||
    !coverImageUrl ||
    readTimeInMinutes === undefined
  ) {
    return undefined;
  }

  return { title, slug, brief, coverImageUrl, publishedAt, readTimeInMinutes, url };
}

/**
 * Fetches the latest posts from the `pulseroom.hashnode.dev` publication.
 *
 * Never throws and never rejects — resolves to `[]` on any failure (network
 * error, timeout, non-OK response, a GraphQL `errors` response, or a
 * malformed/empty publication), so `BlogPreviewSection` can fall back to the
 * static dataset without its own try/catch.
 */
export async function getLatestHashnodeBlogs(): Promise<readonly HashnodeBlog[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(HASHNODE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: POSTS_QUERY,
        variables: { host: PUBLICATION_HOST },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();

    if (!isRecord(payload) || payload.errors !== undefined) {
      return [];
    }

    const data = payload.data;
    const publication = isRecord(data) ? data.publication : undefined;
    const posts = isRecord(publication) ? publication.posts : undefined;
    const edges = isRecord(posts) ? posts.edges : undefined;

    if (!Array.isArray(edges)) {
      return [];
    }

    return edges
      .map((edge) => (isRecord(edge) ? toHashnodeBlog(edge.node) : undefined))
      .filter((blog): blog is HashnodeBlog => blog !== undefined);
  } catch {
    // Network error, abort/timeout, or a `response.json()` parse failure all
    // land here — every failure mode degrades to `[]`.
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
