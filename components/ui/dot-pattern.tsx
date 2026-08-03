"use client";

import { useId } from "react";

import { cn } from "@/utils/cn";

/**
 * A tiling SVG dot-grid background (shadcn/magicui-style `DotPattern`).
 *
 * Renders an infinitely-repeating `<pattern>` of small circles, sized and
 * spaced by `width`/`height`/`cx`/`cy`/`cr`, filling its parent completely via
 * `absolute inset-0`. Intended to sit behind page content as a subtle,
 * decorative texture (`pointer-events-none`, low opacity, `-z-10` from the
 * caller) — see `app/layout.tsx` for the site-wide usage.
 *
 * `useId()` namespaces the `<pattern>` id so multiple instances on one page
 * never collide.
 */
export interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/40",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <circle id="pattern-circle" cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
