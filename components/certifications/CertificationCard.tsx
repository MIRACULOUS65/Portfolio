import Image from "next/image";
import { CalendarDays, ExternalLink } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader } from "@/components/shared/Card";
import type { Certification } from "@/types";
import { cn } from "@/utils/cn";

export interface CertificationCardProps {
  certification: Certification;
  className?: string;
}

const BADGE_INTRINSIC_SIZE = 64;

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
        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y], index) => (
            <rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={x * width} y={y * height} />
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

function formatIssueDate(issueDate: string): string {
  const date = new Date(`${issueDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function CertificationCard({ certification, className }: CertificationCardProps) {
  const { title, issuer, issueDate, credentialUrl, badgeImage } = certification;
  const hasCredentialLink = typeof credentialUrl === "string" && credentialUrl.trim() !== "";
  const p = genRandomPattern();

  return (
    <Card
      as="article"
      variant="glow"
      data-slot="certification-card"
      className={cn("relative gap-4 overflow-hidden", className)}
    >
      {/* Grid pattern background */}
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

      {/* Content */}
      <CardHeader className="relative z-10 flex-row items-start gap-4">
        <span className="relative block size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          <Image
            src={badgeImage}
            alt={`${title} badge`}
            width={BADGE_INTRINSIC_SIZE}
            height={BADGE_INTRINSIC_SIZE}
            className="size-full object-contain"
          />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-h4 text-foreground">{title}</h3>
          <p className="text-small text-muted-foreground">{issuer}</p>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          <time dateTime={issueDate}>{formatIssueDate(issueDate)}</time>
        </span>

        {hasCredentialLink ? (
          <a
            href={credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-small font-medium text-primary underline-offset-4 hover:underline"
          >
            View credential for {title}
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
