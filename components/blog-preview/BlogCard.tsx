import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader } from "@/components/shared/Card";
import type { Blog } from "@/types";
import { cn } from "@/utils/cn";

export interface BlogCardProps {
  blog: Blog;
  className?: string;
}

// Grid pattern helper
function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: React.ComponentProps<"svg"> & {
  width: number;
  height: number;
  x: string;
  y: string;
  squares?: number[][];
}) {
  const patternId = React.useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y], index) => (
            <rect
              strokeWidth="0"
              key={index}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

function genRandomPattern(length?: number): number[][] {
  length = length ?? 5;
  return Array.from({ length }, () => [
    Math.floor(Math.random() * 4) + 7,
    Math.floor(Math.random() * 6) + 1,
  ]);
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

export function BlogCard({ blog, className }: BlogCardProps) {
  const { slug, title, excerpt, publishedDate, readingTime, externalUrl } = blog;

  const hasExternalUrl = typeof externalUrl === "string" && externalUrl.trim() !== "";
  const linkProps = hasExternalUrl
    ? { href: externalUrl, target: "_blank", rel: "noopener noreferrer" }
    : { href: `/blog/${slug}` };

  const p = genRandomPattern();

  return (
    <Card
      as="article"
      variant="glow"
      data-slot="blog-card"
      className={cn("relative gap-0 overflow-hidden p-0", className)}
    >
      <Link {...linkProps} className="flex h-full flex-col focus:outline-none">
        {/* Grid pattern background on content area */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full mask-[linear-gradient(white,transparent)]">
            <div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-linear-to-r mask-[radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
              <GridPattern
                width={20}
                height={20}
                x="-12"
                y="4"
                squares={p}
                className="fill-foreground/5 stroke-foreground/25 absolute inset-0 h-full w-full mix-blend-overlay"
              />
            </div>
          </div>

          <CardHeader className="relative z-10 px-5 pt-5 sm:px-6">
            <h3 className="text-h4 text-foreground">{title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                <time dateTime={publishedDate}>{formatPublishedDate(publishedDate)}</time>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-3.5" />
                {readingTime} min read
              </span>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 px-5 pb-5 sm:px-6 sm:pb-6">
            <p className="text-small text-muted-foreground">{excerpt}</p>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
}
