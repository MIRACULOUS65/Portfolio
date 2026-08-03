import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  ERROR_FALLBACK_COPY,
  resolveStateLinks,
  type StateAction,
} from "@/components/shared/stateFallback";
import { cn } from "@/utils/cn";

export interface ErrorStateProps {
  /** Friendly, non-technical summary. Defaults to the fixed fallback copy. */
  title?: string;
  /** Friendly, non-technical explanation. Defaults to the fixed fallback copy. */
  message?: string;
  /**
   * Optional secondary call to action as structured data — never a `ReactNode`,
   * so it cannot introduce a second Homepage link. An action pointing at `/` is
   * dropped.
   */
  action?: StateAction;
  /** Heading element for `title`. Page-level boundaries should pass `"h1"`. */
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * The single error presentation rendered by `error.tsx` boundaries and by any
 * view that must report a failure instead of failing silently (Requirements
 * 18.6, 28.2, 28.3).
 *
 * TWO INVARIANTS, both structural (Property 26):
 *
 * 1. No raw error details reach the DOM (Requirement 28.2). The props accept
 *    only `string` copy — there is no `error` prop, no `Error` object, and no
 *    `ReactNode` slot — and both text props default to `ERROR_FALLBACK_COPY`.
 *    Boundaries pass a caught error to `console.error` (dev-visible) and call
 *    `resolveErrorCopy()` for the visitor-facing text, which ignores the error
 *    entirely. Never interpolate `error.message`, `error.digest`, or a stack
 *    trace into `title`/`message`.
 * 2. Exactly one link to the Homepage, rendered by this component rather than
 *    by callers (Requirement 28.3), via the pure `resolveStateLinks` helper.
 *
 * Purely presentational: no state, no effects. It carries no `"use client"`
 * directive of its own, so it works both inside a Client `error.tsx` boundary
 * and inside a Server Component.
 */
export function ErrorState({
  title = ERROR_FALLBACK_COPY.title,
  message = ERROR_FALLBACK_COPY.message,
  action,
  titleAs: Heading = "h2",
  className,
}: ErrorStateProps) {
  const links = resolveStateLinks(action);

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/40 bg-card px-6 py-12 text-center sm:py-16",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
      >
        <TriangleAlert className="size-6" />
      </span>

      <div className="flex max-w-prose flex-col gap-2">
        <Heading className="text-lg font-semibold text-foreground sm:text-xl">
          {title}
        </Heading>
        <p className="text-sm text-muted-foreground sm:text-base">{message}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {links.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              buttonVariants({ variant: index === 0 ? "default" : "outline" }),
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
