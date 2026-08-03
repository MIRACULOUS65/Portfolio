import { BlogCard } from "@/components/blog-preview/BlogCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Section } from "@/components/shared/Section";
import { getLatestHashnodeBlogs } from "@/lib/hashnode";
import { getRecentPublishedBlogs } from "@/lib/data-access";
import type { Blog } from "@/types";

/**
 * The Homepage's BlogPreviewSection (Requirements 10.1, 10.3, 10.4, 10.5,
 * design.md "BlogPreviewSection").
 *
 * Async Server Component: fetches the latest real posts from Hashnode
 * (`lib/hashnode.ts`) and, when that returns at least one post, renders those
 * — mapped into the `Blog` shape with `externalUrl` set to each post's
 * Hashnode `url` and `coverImage` set to its `coverImageUrl` — capped at 3 to
 * match the section's existing visual layout. When the Hashnode fetch fails
 * or returns no posts (which is the expected outcome while Hashnode's public
 * API remains on a paid tier — see `lib/hashnode.ts`), this falls back to the
 * existing static `data/blogs.ts` entries via `getRecentPublishedBlogs(2, 3)`
 * so the section is never empty:
 *
 * - `result.length >= 2` → render `BlogCard[]`, no partial-state indicator
 *   (Requirement 10.4). Exactly 2 is a normal state.
 * - `result.length < 2` (including 0) → render `EmptyState` instead of the
 *   cards, so the slot is never left blank (Requirement 10.5).
 *
 * `exploreMoreHref="/blog"` renders on `Section` regardless of which branch
 * ran, since `/blog` remains reachable — and worth visiting — even when the
 * homepage preview is short (Requirement 10.3).
 */
const MIN_PREVIEW_POSTS = 2;
const MAX_PREVIEW_POSTS = 3;

export async function BlogPreviewSection() {
  const posts = await resolvePreviewPosts();
  const hasEnoughPosts = posts.length >= MIN_PREVIEW_POSTS;

  return (
    <Section
      id="blog-content"
      title="Latest Blogs"
      exploreMoreHref="/blog"
      exploreMoreLabel="Explore all blog posts"
      className="py-6! lg:py-8!"
    >
      {hasEnoughPosts ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="More posts coming soon"
          message="There aren't enough published posts yet to fill this preview. Check back soon, or explore the blog for everything published so far."
        />
      )}
    </Section>
  );
}

/**
 * Resolves the (up to 3) posts this section renders: real Hashnode posts when
 * available, otherwise the static dataset's recent published posts.
 */
async function resolvePreviewPosts(): Promise<readonly Blog[]> {
  const hashnodePosts = await getLatestHashnodeBlogs();

  if (hashnodePosts.length > 0) {
    return hashnodePosts.slice(0, MAX_PREVIEW_POSTS).map(
      (post): Blog => ({
        id: post.slug,
        slug: post.slug,
        title: post.title,
        excerpt: post.brief,
        coverImage: post.coverImageUrl,
        content: post.brief,
        publishedDate: post.publishedAt.slice(0, 10),
        readingTime: post.readTimeInMinutes,
        author: "Sushovan Ghosh",
        tags: [],
        featured: false,
        draft: false,
        externalUrl: post.url,
      }),
    );
  }

  return getRecentPublishedBlogs(MIN_PREVIEW_POSTS, MAX_PREVIEW_POSTS);
}
