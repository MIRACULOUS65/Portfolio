import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export interface ContainerProps {
  children: ReactNode;
  /**
   * Extra utilities merged onto the container. Conflicting Tailwind classes
   * passed here win over the defaults (see `cn`).
   */
  className?: string;
}

/**
 * Centred layout wrapper that owns the site's horizontal rhythm so no section
 * has to restate it (Requirement 1.10, 23.1).
 *
 * Widths follow the design system's grid, tightened slightly for a more
 * compact reading width at 100% zoom: `max-w-6xl` (1152px) through the
 * Desktop breakpoint, widening to `max-w-[1300px]` on Large Desktop
 * (`2xl`, ≥1536px). Horizontal padding steps along the 8px scale — 16px on
 * mobile, 24px from small tablet, 32px from laptop up — so content never
 * touches the viewport edge.
 *
 * Server Component: it renders static layout markup and holds no state.
 */
export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1300px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
