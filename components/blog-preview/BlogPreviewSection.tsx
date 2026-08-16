import { StretchedBlogCard } from "@/components/blog-preview/StretchedBlogCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Section } from "@/components/shared/Section";
import { getLatestHashnodeBlogs } from "@/lib/hashnode";
import { getRecentPublishedBlogs } from "@/lib/data-access";
import type { Blog } from "@/types";

/**
 * The Homepage's BlogPreviewSection - now showing a single stretched blog card
 * for a more prominent, featured blog display.
 */
const MIN_PREVIEW_POSTS = 1;
const MAX_PREVIEW_POSTS = 1;

export async function BlogPreviewSection() {
  const posts = await resolvePreviewPosts();
  const hasEnoughPosts = posts.length >= MIN_PREVIEW_POSTS;

  return (
    <Section
      id="blog-content"
      title="Latest Blogs"
      exploreMoreHref="/blog"
      exploreMoreLabel="Explore all blog posts"
      className="py-4! lg:py-6!"
    >
      {hasEnoughPosts ? (
        <div className="w-full">
          <StretchedBlogCard blog={posts[0]} />
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
 * Resolves the single post this section renders: first from Hashnode, 
 * otherwise from the static dataset.
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
