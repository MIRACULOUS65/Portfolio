import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BlogCard } from "@/components/blog-preview/BlogCard";
import type { Blog } from "@/types";

const sampleBlog: Blog = {
  id: "sample-post",
  slug: "sample-post",
  title: "A Sample Blog Post",
  excerpt: "A short summary of what this post covers.",
  coverImage: "/images/blog/sample-post.jpg",
  content: "Full post content.",
  publishedDate: "2025-11-18",
  readingTime: 9,
  author: "Portfolio Author",
  tags: ["Next.js"],
  featured: false,
  draft: false,
};

describe("BlogCard", () => {
  it("renders the cover image, title, published date, reading time, and excerpt", () => {
    render(<BlogCard blog={sampleBlog} />);

    expect(
      screen.getByRole("img", { name: sampleBlog.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: sampleBlog.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nov 18, 2025")).toBeInTheDocument();
    expect(screen.getByText("9 min read")).toBeInTheDocument();
    expect(screen.getByText(sampleBlog.excerpt)).toBeInTheDocument();
  });

  it("links the whole card to the post's detail page", () => {
    render(<BlogCard blog={sampleBlog} />);

    const link = screen.getByRole("link", { name: new RegExp(sampleBlog.title) });
    expect(link).toHaveAttribute("href", `/blog/${sampleBlog.slug}`);
  });

  it("uses a real <time> element with a matching dateTime attribute", () => {
    render(<BlogCard blog={sampleBlog} />);

    const time = screen.getByText("Nov 18, 2025");
    expect(time.tagName.toLowerCase()).toBe("time");
    expect(time).toHaveAttribute("dateTime", sampleBlog.publishedDate);
  });

  it("links to the external URL, opening in a new tab, when externalUrl is present", () => {
    const externalBlog = {
      ...sampleBlog,
      externalUrl: "https://pulseroom.hashnode.dev/some-post",
    };

    render(<BlogCard blog={externalBlog} />);

    const link = screen.getByRole("link", { name: new RegExp(sampleBlog.title) });
    expect(link).toHaveAttribute("href", externalBlog.externalUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("keeps the internal /blog/[slug] link when externalUrl is absent", () => {
    render(<BlogCard blog={sampleBlog} />);

    const link = screen.getByRole("link", { name: new RegExp(sampleBlog.title) });
    expect(link).toHaveAttribute("href", `/blog/${sampleBlog.slug}`);
    expect(link).not.toHaveAttribute("target");
  });
});
