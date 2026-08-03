/**
 * Blog entity type.
 *
 * Requirement 4.6 — the DataLayer defines a Blog model containing id, slug,
 * title, excerpt, coverImage, content, publishedDate, readingTime, author,
 * tags, featured, draft, and seo fields.
 *
 * Imported from `./index` (rather than `@/types`) so this module never depends
 * on the barrel that re-exports it.
 */

import type { ISODateString, SEOFields } from "./index";

/**
 * A single blog post.
 *
 * Posts are authored as markdown/MDX source stored in `content` and rendered on
 * `/blog/[slug]`. Draft posts are excluded from every public listing, from
 * prev/next navigation, and from the sitemap, and are treated exactly like a
 * non-existent slug on the article route (Requirements 10.1, 20.2, 20.6, 25.4).
 */
export interface Blog {
  /** Stable identifier used for cross-entity references. */
  id: string;

  /** URL segment for `/blog/[slug]`; unique across all posts. */
  slug: string;

  /** Post headline, rendered as the article `<h1>` and in card previews. */
  title: string;

  /** Short summary shown on blog cards and preview sections. */
  excerpt: string;

  /** Path to the cover image, also used as the social preview image. */
  coverImage: string;

  /** Markdown/MDX source; headings are the source of the table of contents. */
  content: string;

  /** Publication date (`"YYYY-MM-DD"`); drives recency sorting. */
  publishedDate: ISODateString;

  /** Estimated reading time in whole minutes. */
  readingTime: number;

  /** Display name of the post author. */
  author: string;

  /** Free-form tags; also used as the category filter values on `/blog`. */
  tags: string[];

  /** Whether the post is highlighted ahead of plain recency ordering. */
  featured: boolean;

  /** When `true`, the post is unpublished and hidden from all public views. */
  draft: boolean;

  /** Optional per-post metadata overrides; falls back to site defaults. */
  seo?: SEOFields;

  /**
   * External URL for a post sourced from a third-party platform (e.g.
   * Hashnode) that has no `/blog/[slug]` detail page of its own. When
   * present, `BlogCard` links here (in a new tab) instead of to
   * `/blog/${slug}`.
   */
  externalUrl?: string;
}
