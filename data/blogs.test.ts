import { describe, expect, it } from "vitest";

import { blogs } from "@/data/blogs";

/**
 * Fixture-shape checks for the blog dataset (Requirements 4.1, 4.6).
 *
 * These assertions protect the guarantees downstream selectors and pages rely
 * on: unique slugs, a total recency ordering, draft coverage, and enough
 * published posts to exercise the 2-or-3 card blog preview.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const published = blogs.filter((blog) => !blog.draft);
const drafts = blogs.filter((blog) => blog.draft);

describe("blogs dataset", () => {
  it("uses unique ids and unique slugs", () => {
    expect(new Set(blogs.map((blog) => blog.id)).size).toBe(blogs.length);
    expect(new Set(blogs.map((blog) => blog.slug)).size).toBe(blogs.length);
  });

  it("uses kebab-case slugs", () => {
    for (const blog of blogs) {
      expect(blog.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("covers both the draft and the 3+ published preview cases", () => {
    expect(drafts.length).toBeGreaterThanOrEqual(1);
    expect(published.length).toBeGreaterThanOrEqual(3);
  });

  it("dates every post as a distinct YYYY-MM-DD string", () => {
    for (const blog of blogs) {
      expect(blog.publishedDate).toMatch(ISO_DATE);
    }

    const dates = blogs.map((blog) => blog.publishedDate);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("gives every post markdown content with a heading hierarchy", () => {
    for (const blog of blogs) {
      const h2Count = blog.content.match(/^## /gm)?.length ?? 0;
      const h3Count = blog.content.match(/^### /gm)?.length ?? 0;

      expect(h2Count).toBeGreaterThanOrEqual(2);
      expect(h3Count).toBeGreaterThanOrEqual(1);
    }
  });

  it("tags every post from a shared, overlapping vocabulary", () => {
    const tagCounts = new Map<string, number>();

    for (const blog of blogs) {
      expect(blog.tags.length).toBeGreaterThan(0);

      for (const tag of blog.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    // Every tag is reused, so the category filter never yields a single-post
    // category, and each post shares a category with at least one other post.
    for (const [tag, count] of tagCounts) {
      expect(count, `tag "${tag}" is used by only one post`).toBeGreaterThan(1);
    }
  });

  it("gives every post a positive whole-minute reading time and a cover image", () => {
    for (const blog of blogs) {
      expect(Number.isInteger(blog.readingTime)).toBe(true);
      expect(blog.readingTime).toBeGreaterThan(0);
      expect(blog.coverImage).toMatch(/^\/images\//);
    }
  });
});
