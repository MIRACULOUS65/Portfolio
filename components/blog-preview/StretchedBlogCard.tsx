import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/shared/Card";
import type { Blog } from "@/types";
import { cn } from "@/utils/cn";

/**
 * A stretched, horizontal blog card for featured blog display.
 * Wider and more prominent than the standard BlogCard, designed to showcase
 * a single featured blog post with better visual hierarchy.
 */
export interface StretchedBlogCardProps {
  blog: Blog;
  className?: string;
}

function formatPublishedDate(publishedDate: string): string {
  const date = new Date(`${publishedDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function StretchedBlogCard({
  blog,
  className,
}: StretchedBlogCardProps) {
  const {
    slug,
    title,
    excerpt,
    coverImage,
    publishedDate,
    readingTime,
    externalUrl,
    tags,
  } = blog;

  const hasExternalUrl =
    typeof externalUrl === "string" && externalUrl.trim() !== "";
  const linkProps = hasExternalUrl
    ? { href: externalUrl, target: "_blank", rel: "noopener noreferrer" }
    : { href: `/blog/${slug}` };

  return (
    <Card
      as="article"
      variant="glow"
      data-slot="stretched-blog-card"
      className={cn(
        "group relative mx-auto w-full max-w-3xl overflow-hidden p-0 transition-all duration-300",
        className,
      )}
    >
      <Link
        {...linkProps}
        className="grid h-full gap-0 focus:outline-none md:grid-cols-[200px_1fr]"
      >
        {/* Cover Image - Smaller */}
        <div className="relative aspect-video h-full w-full overflow-hidden bg-muted md:aspect-auto md:h-full md:max-h-32">
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(min-width: 768px) 200px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content - More Compact */}
        <div className="flex flex-col justify-between p-3 sm:p-4">
          <div className="flex flex-col gap-1.5">
            {/* Tags - Smaller */}
            {tags && tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Title - Smaller */}
            <h3 className="text-small font-bold leading-tight text-foreground transition-colors duration-200 group-hover:text-primary sm:text-body">
              {title}
              {hasExternalUrl ? (
                <ExternalLink
                  aria-hidden="true"
                  className="ml-1 inline size-3 opacity-60"
                />
              ) : null}
            </h3>

            {/* Meta - Smaller */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <CalendarDays aria-hidden="true" className="size-2.5" />
                <time dateTime={publishedDate}>
                  {formatPublishedDate(publishedDate)}
                </time>
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Clock aria-hidden="true" className="size-2.5" />
                {readingTime} min
              </span>
            </div>

            {/* Excerpt - Only 1 line */}
            <p className="text-caption text-muted-foreground line-clamp-1">
              {excerpt}
            </p>
          </div>

          {/* Read More Link - Smaller */}
          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
            Read Article
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
