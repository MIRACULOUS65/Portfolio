import Link from "next/link";
import { Inbox } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  resolveStateLinks,
  type StateAction,
} from "@/components/shared/stateFallback";
import { cn } from "@/utils/cn";

export interface EmptyStateProps {
  /** Short, specific summary of what is missing. */
  title: string;
  /** One friendly sentence explaining the state and what to do next. */
  message: string;
  /**
   * Optional secondary call to action as structured data — never a `ReactNode`.
   * This is what keeps the Homepage link unique: callers describe where they
   * want to send the visitor, the component decides what is rendered. An action
   * pointing at `/` is dropped rather than rendered twice.
   */
  action?: StateAction;
  /** Heading element for `title`. Page-level fallbacks should pass `"h1"`. */
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * The single empty-state presentation used everywhere content can legitimately
 * be absent — no search results on `/projects`, fewer than two published blog
 * posts, no certifications, no related projects — so the visual language is
 * identical across the site (Requirements 18.7, 28.1) and no view ever renders
 * blank space.
 *
 * INVARIANT (Requirement 28.3, Property 26): the component renders exactly one
 * link to the Homepage, always, and it renders it itself. Callers never supply
 * the Homepage link, which is why `action` is `{ href, label }` rather than a
 * `ReactNode` — there is no way to inject a second one. The rendered link set is
 * decided by the pure `resolveStateLinks` helper.
 *
 * Purely presentational Server Component: no state, no effects, no data access.
 */
export function EmptyState({
  title,
  message,
  action,
  titleAs: Heading = "h2",
  className,
}: EmptyStateProps) {
  const links = resolveStateLinks(action);

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-12 text-center sm:py-16",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Inbox className="size-6" />
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
