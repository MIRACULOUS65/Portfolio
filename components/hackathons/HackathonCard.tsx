import { Award, CalendarDays } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader } from "@/components/shared/Card";
import type { Hackathon } from "@/types";
import { cn } from "@/utils/cn";

export interface HackathonCardProps {
  hackathon: Hackathon;
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

function formatHackathonDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function HackathonCard({ hackathon, className }: HackathonCardProps) {
  const { name, organizer, date, achievement } = hackathon;
  const hasAchievement = typeof achievement === "string" && achievement.trim() !== "";
  const p = genRandomPattern();

  return (
    <Card
      as="article"
      variant="glow"
      data-slot="hackathon-card"
      className={cn("relative overflow-hidden", className)}
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
      <CardHeader className="relative z-10">
        <h3 className="text-h4 text-foreground">{name}</h3>
        <p className="text-small text-muted-foreground">{organizer}</p>
      </CardHeader>

      <CardContent className="relative z-10">
        <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          <time dateTime={date}>{formatHackathonDate(date)}</time>
        </span>

        {hasAchievement ? (
          <span className="inline-flex items-center gap-1.5 text-small font-medium text-foreground">
            <Award aria-hidden="true" className="size-3.5" />
            {achievement}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
