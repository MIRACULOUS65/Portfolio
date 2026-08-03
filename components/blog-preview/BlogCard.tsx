import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/shared/Card";
import type { Blog } from "@/types";
import { cn } from "@/utils/cn";

/**
 * A single post preview on the Homepage's BlogPreviewSection
 * (Requirement 10.2, Component_Specification §7 "BlogCard — Cover, Title,
 * Date, Reading time, Excerpt").
 *
 * ## Card-to-detail-page link, not `ExploreMoreButton`
 *
 * `ExploreMoreButton` is the only *shared* component allowed to call
 * `next/link` for cross-route navigation (Requirement 17.3) — but that
 * invariant is scoped to `components/shared/*`, and Requirement 17.3 itself
 * carves out an explicit exception for "project/blog links inside preview
 * cards that lead to detail pages." This card is exactly that exception:
 * the whole surface links to `/blog/[slug]`, matching how a typical blog
 * card behaves (design.md's Explore More Pattern names "a blog card's own
 * link" as one of the two sanctioned exceptions alongside the section-level
 * Explore More button).
 *
 * ## `externalUrl`: linking out for third-party-sourced posts
 *
 * A post fetched from Hashnode (`lib/hashnode.ts`) has no `/blog/[slug]`
 * detail page on this site — it lives on the external platform. When
 * `blog.externalUrl` is set, the whole card links there instead, opening in
 * a new tab (`target="_blank" rel="noopener noreferrer"`, matching this
 * codebase's convention for links that leave the site). Every other post
 * (no `externalUrl`) keeps the original internal `/blog/${slug}` behavior.
 * Only the link target changes — the visual design is identical either way.
 *
 * `variant="interactive"` is used because the entire card is the link target,
 * so the shared hover/focus lift on `Card` communicates that correctly
 * (Component_Specification §7 "Hover: Lift + shadow" — the shadow-on-hover
 * part is superseded by `Card`'s transform-only hover language, see
 * `Card.tsx`'s own documentation for why). The anchor wraps the whole card so
 * the entire surface — not just the title — is clickable and keyboard
 * reachable as one focus stop, with `focus-within` on `Card` supplying the
 * visible focus ring.
 *
 * ## Cover image
 *
 * `next/image` renders the cover inside a fixed-aspect-ratio (`aspect-[16/10]`,
 * capped at `max-h-44` — tightened from the earlier 16:9 `aspect-video` so the
 * cover takes less vertical space and the card reads as more compact)
 * container using `fill`, so the image's box is reserved before it loads
 * regardless of the source asset's own dimensions, and no layout shift can
 * occur as covers stream in. `alt` is the post title, per Requirement 10.2 —
 * the image is decorative repetition of information already present as text,
 * but blog cover art is still meaningfully distinct per post, so it gets a
 * real accessible name rather than an empty `alt`.
 *
 * Purely presentational Server Component: no state, no effects, no data
 * access — it receives a fully-resolved `Blog` record and renders it.
 */
export interface BlogCardProps {
  /** The post to render. Sourced by the caller from `lib/data-access.ts`. */
  blog: Blog;
  /** Extra utilities merged onto the card; conflicting classes win (see `cn`). */
  className?: string;
}

/**
 * Formats an `ISODateString` (`"YYYY-MM-DD"`) as a human-readable date
 * (e.g. "Nov 18, 2025"). Parsed as UTC (`T00:00:00Z`) so the displayed date
 * never shifts a day depending on the visitor's timezone.
 */
function formatPublishedDate(publishedDate: string): string {
  const date = new Date(`${publishedDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function BlogCard({ blog, className }: BlogCardProps) {
  const {
    slug,
    title,
    excerpt,
    coverImage,
    publishedDate,
    readingTime,
    externalUrl,
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
      data-slot="blog-card"
      className={cn("gap-0 overflow-hidden p-0", className)}
    >
      <Link {...linkProps} className="flex h-full flex-col focus:outline-none">
        <div className="relative aspect-[16/10] max-h-44 w-full overflow-hidden bg-muted">
          <Image
            src={coverImage}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <CardHeader className="px-5 pt-5 sm:px-6">
          <h3 className="text-h4 text-foreground">{title}</h3>
          <div className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              <time dateTime={publishedDate}>
                {formatPublishedDate(publishedDate)}
              </time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-3.5" />
              {readingTime} min read
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          <p className="text-small text-muted-foreground">{excerpt}</p>
        </CardContent>
      </Link>
    </Card>
  );
}
