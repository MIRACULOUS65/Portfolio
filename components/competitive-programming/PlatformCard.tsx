import Image from "next/image";
import { ExternalLink, Trophy } from "lucide-react";
import React from "react";

import { Card, CardHeader } from "@/components/shared/Card";
import type { CompetitiveProgrammingPlatform } from "@/types";
import { cn } from "@/utils/cn";

export interface PlatformCardProps {
  platform: CompetitiveProgrammingPlatform;
  className?: string;
}

const LOGO_INTRINSIC_SIZE = 40;

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

export function PlatformCard({ platform, className }: PlatformCardProps) {
  const {
    platform: platformName,
    username,
    profileUrl,
    rating,
    solved,
    rank,
    logo,
  } = platform;
  const hasRank = typeof rank === "string" && rank.trim() !== "";
  const p = genRandomPattern();

  return (
    <Card
      as="article"
      variant="glow"
      data-slot="platform-card"
      className={cn("relative gap-3 overflow-hidden", className)}
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
      <CardHeader className="relative z-10 flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative block size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            <Image
              src={logo}
              alt={`${platformName} logo`}
              width={LOGO_INTRINSIC_SIZE}
              height={LOGO_INTRINSIC_SIZE}
              className="size-full object-contain"
            />
          </span>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-h4 text-foreground">{platformName}</h3>
            <p className="text-small text-muted-foreground">{username}</p>
          </div>
        </div>

        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${username}'s ${platformName} profile`}
          className="inline-flex shrink-0 items-center gap-1 text-small font-medium text-primary underline-offset-4 hover:underline"
        >
          Profile
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      </CardHeader>

      <div className="relative z-10 flex items-center justify-between gap-2 text-small text-foreground">
        <span>
          <span className="text-muted-foreground">Rating</span> {rating}
        </span>
        <span>
          <span className="text-muted-foreground">Solved</span> {solved}
        </span>
        {hasRank ? (
          <span className="inline-flex items-center gap-1">
            <span className="text-muted-foreground">Rank</span>
            <Trophy aria-hidden="true" className="size-3.5" />
            {rank}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </Card>
  );
}
