"use client";

import { useActiveSection } from "@/hooks/useActiveSection";
import type { NavigationItem } from "@/types";
import { cn } from "@/utils/cn";

/**
 * The active-section highlight for the Navbar (Requirement 5.5,
 * Component_Specification §4, design.md "Navbar").
 *
 * ## Division of labour with `Navbar.tsx` (task 17.5)
 *
 * `Navbar` owns the link list: it reads `data/navigation.ts`, sorts by `order`,
 * filters to `visible`, renders the anchors, and owns activation behaviour —
 * smooth scroll on the homepage (Requirement 5.2) and `router.push("/#id")`
 * from a dedicated page (Requirement 5.9). This module owns one thing only:
 * **which single link is highlighted, and what that highlight looks like.**
 *
 * Three exports make up the seam, and `Navbar` uses all three:
 *
 * 1. {@link useActiveNavigationItemId} — called **once** per Navbar render.
 *    Wraps `useActiveSection()` and maps the active *section* onto the active
 *    *link*, returning a single `NavigationItem.id` or `null`.
 * 2. {@link navLinkStateProps} — spread onto each anchor. Emits
 *    `data-active="true"` and `aria-current="location"`, and nothing else.
 * 3. {@link ActiveSectionIndicator} — the visible underline, rendered once
 *    inside each anchor.
 *
 * ```tsx
 * // Navbar.tsx (task 17.5), desktop link list
 * const items = getNavigationItems();            // via lib/data-access
 * const activeItemId = useActiveNavigationItemId(items);
 *
 * return items.map((item) => (
 *   <a
 *     key={item.id}
 *     href={hrefFor(item)}
 *     onClick={(event) => scrollToSection(item, event)}
 *     {...navLinkStateProps(item, activeItemId)}
 *     className="group inline-flex flex-col items-center gap-1 text-muted-foreground
 *                transition-colors duration-150 ease-out hover:text-foreground
 *                data-[active=true]:text-foreground
 *                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 *   >
 *     {item.label}
 *     <ActiveSectionIndicator item={item} activeItemId={activeItemId} />
 *   </a>
 * ));
 * ```
 *
 * Why the indicator is not the list renderer: task 17.5 assigns link rendering,
 * ordering, and click behaviour to `Navbar`, and the mobile drawer
 * (task 17.6) renders a *second* list of the same links. A component that owned
 * the list would either have to be duplicated for the drawer — two lists, two
 * highlights, the invariant broken at the page level — or absorb Navbar's
 * routing logic. Keeping the *decision* in one pure function that both lists
 * read means the highlight can never disagree between them.
 *
 * ## INVARIANT — at most one link is ever highlighted (Requirement 5.5)
 *
 * Structural, not conventional:
 *
 * - {@link resolveActiveNavigationItemId} returns **one id or `null`** — a
 *   single string, so it cannot name two links. Ties (two items sharing a
 *   `sectionId`) are broken by a total order, so the winner is unique.
 * - {@link isActiveNavigationItem} is the *only* comparison in the codebase
 *   that decides "is this link the active one". `navLinkStateProps` and
 *   `ActiveSectionIndicator` both delegate to it; nothing else re-derives it.
 * - `data-active="true"` therefore appears on at most one anchor and one
 *   indicator per list, making the invariant countable:
 *   `container.querySelectorAll('[data-slot="active-section-indicator"][data-active="true"]')`
 *   has length 0 or 1, never 2.
 *
 * ## Zero highlighted links is a legitimate state
 *
 * `useActiveSection()` reports the active **section**, and `data/navigation.ts`
 * lists all nine homepage sections while shipping only five as `visible`
 * (Requirement 5.1: Home, Projects, Blog, Certifications, Hackathons). So
 * scrolling into `#contact`, `#education`, `#tech-stack`, or
 * `#competitive-programming` yields an active section with no link to highlight.
 * That resolves to `null` — **nothing highlighted** — never a fallback to a
 * neighbouring link, which would tell the visitor they are reading a section
 * they are not. The other `null` case is `activeSectionId === null`: a
 * dedicated page (`/projects`, `/blog`, …) has no homepage sections to observe,
 * as does the instant before the observer's first callback.
 *
 * ## Data access
 *
 * Nothing here imports `data/navigation.ts`. Items arrive as a prop/argument,
 * so this module cannot bypass the data-access layer (Requirement 4.2) — and
 * `lib/data-access.ts` has no navigation selector yet (see the note on
 * {@link useActiveNavigationItemId}), which is a gap for `Navbar` to close, not
 * something to work around here.
 */

/**
 * The `aria-current` value for the highlighted link.
 *
 * `"location"` is the ARIA-defined value for "the current location within a set
 * of links" — precisely a same-page anchor into the section being viewed —
 * whereas `"page"` would claim the link points at the current *route*, which is
 * wrong for a `#hash` anchor. This is what conveys the highlight non-visually,
 * so the colour and underline are never the only signal (audited in task 44.3).
 */
export const ACTIVE_NAV_LINK_ARIA_CURRENT = "location" as const;

/**
 * The `NavigationItem.id` of the single link to highlight, or `null` when no
 * link corresponds to the active section (Requirement 5.5).
 *
 * Pure and exported so the at-most-one guarantee is testable without a DOM or
 * an `IntersectionObserver`.
 *
 * Matching rules, in order:
 *
 * 1. No active section (`null`, `undefined`, or `""`) → `null`.
 * 2. Only `visible` items are eligible. A hidden item is not rendered, so
 *    naming it would highlight nothing while claiming success.
 * 3. `item.sectionId` must equal `activeSectionId` exactly. No prefix or
 *    "nearest section" matching: an unmatched section highlights nothing.
 * 4. Among matches, lowest `order` wins; ties broken by lexicographically
 *    smallest `id`. Distinct ids make that a total order, so a duplicated
 *    `sectionId` still yields exactly one winner rather than two.
 *
 * @param items The links as rendered, in any order.
 * @param activeSectionId From `useActiveSection()`.
 */
export function resolveActiveNavigationItemId(
  items: readonly NavigationItem[],
  activeSectionId: string | null | undefined,
): string | null {
  if (
    activeSectionId === null ||
    activeSectionId === undefined ||
    activeSectionId === ""
  ) {
    return null;
  }

  let best: NavigationItem | null = null;

  for (const item of items) {
    if (!item.visible || item.sectionId !== activeSectionId) {
      continue;
    }

    if (
      best === null ||
      item.order < best.order ||
      (item.order === best.order && item.id < best.id)
    ) {
      best = item;
    }
  }

  return best === null ? null : best.id;
}

/**
 * Whether this link is the highlighted one.
 *
 * The single comparison behind every highlight in the UI — the anchor's
 * attributes and the underline both route through it, so the two can never
 * disagree. Compares ids rather than section ids: `activeItemId` already went
 * through {@link resolveActiveNavigationItemId}'s tie-break, and ids are unique
 * (enforced by `lib/validate-data.ts`), so at most one item can match.
 */
export function isActiveNavigationItem(
  item: NavigationItem,
  activeItemId: string | null,
): boolean {
  return activeItemId !== null && item.id === activeItemId;
}

/**
 * The DOM attributes that mark a Navbar link as current.
 *
 * `aria-current` is the accessible signal; `data-active` is both the styling
 * hook (`data-[active=true]:text-foreground`) and the countable marker tests
 * use for the at-most-one invariant. Both are `undefined` for an inactive link,
 * so React omits them entirely rather than rendering `data-active="false"` —
 * `[data-active]` therefore selects only the active link.
 */
export interface NavLinkStateProps {
  "data-active"?: "true";
  "aria-current"?: typeof ACTIVE_NAV_LINK_ARIA_CURRENT;
}

/**
 * Attributes to spread onto a Navbar link's anchor.
 *
 * ```tsx
 * <a {...navLinkStateProps(item, activeItemId)} />
 * ```
 */
export function navLinkStateProps(
  item: NavigationItem,
  activeItemId: string | null,
): NavLinkStateProps {
  if (!isActiveNavigationItem(item, activeItemId)) {
    return {};
  }

  return {
    "data-active": "true",
    "aria-current": ACTIVE_NAV_LINK_ARIA_CURRENT,
  };
}

/**
 * The active link id for the current scroll position (Requirement 5.5).
 *
 * Call this **once** per Navbar and pass the result down to every link,
 * including the mobile drawer's copy of the list: `useActiveSection()` creates
 * an `IntersectionObserver` per call, so one call keeps a single observer
 * watching all sections — which is what makes "exactly one active section" a
 * single decision instead of one boolean per link.
 *
 * `items` is an argument rather than a `data/navigation.ts` import so this
 * module stays behind the data-access layer (Requirement 4.2). No navigation
 * selector exists in `lib/data-access.ts` yet; `Navbar` (task 17.5) should add
 * one (e.g. `getNavigationItems()`, sorted by `order`, filtered to `visible`)
 * and pass its result here.
 *
 * Returns `null` — highlight nothing — whenever the active section has no
 * visible link, and on any page without homepage sections. See the module doc
 * for why that is correct rather than a gap.
 */
export function useActiveNavigationItemId(
  items: readonly NavigationItem[],
): string | null {
  const activeSectionId = useActiveSection();

  return resolveActiveNavigationItemId(items, activeSectionId);
}

export interface ActiveSectionIndicatorProps {
  /** The link this indicator belongs to. */
  item: NavigationItem;
  /** The single highlighted link id, from {@link useActiveNavigationItemId}. */
  activeItemId: string | null;
  /**
   * Extra utilities merged onto the indicator; conflicting classes win (see
   * `cn`). Use this to reposition it — e.g.
   * `"absolute inset-x-1 -bottom-1"` inside a `relative` anchor — without
   * touching its motion or colour.
   */
  className?: string;
}

/**
 * The visible highlight: a 2px rule under a Navbar link, shown only while that
 * link's section is the one being viewed (Requirement 5.5).
 *
 * Renders one `<span>` per link. It is always in the layout and always the same
 * size — only `transform` and `opacity` change between states — so activating a
 * link cannot shift the Navbar's geometry (Requirement 24.4, no CLS). The
 * transition list is enumerated rather than `transition-all`, so a later edit
 * cannot quietly start animating a layout property. Duration and easing mirror
 * `DURATION.fast` (150ms) and `EASING.out` from `@/lib/motion`
 * (Requirement 24.2); those tokens are Framer Motion-shaped numbers while this
 * highlight is pure CSS, so the utilities are the mirror rather than the source
 * — the same arrangement `components/shared/Button.tsx` documents. No Framer
 * Motion, therefore no variants object and no entry in
 * `lib/motionVariantsRegistry.ts`.
 *
 * `motion-reduce:transition-none` removes the growth animation for visitors who
 * asked for reduced motion while keeping the highlight itself visible — the
 * state signal is essential, only its animation is decorative
 * (Requirement 24.5).
 *
 * `aria-hidden`, and deliberately so: the state is announced through
 * `aria-current` on the anchor (see {@link navLinkStateProps}), and the anchor's
 * accessible name stays exactly its label.
 *
 * Client Component because it ships in the same module as
 * {@link useActiveNavigationItemId}, which reads an observer-backed hook.
 */
export function ActiveSectionIndicator({
  item,
  activeItemId,
  className,
}: ActiveSectionIndicatorProps) {
  const isActive = isActiveNavigationItem(item, activeItemId);

  return (
    <span
      aria-hidden="true"
      data-slot="active-section-indicator"
      data-active={isActive ? "true" : undefined}
      data-section-id={item.sectionId}
      className={cn(
        "pointer-events-none block h-0.5 w-full origin-center rounded-sm bg-primary",
        "transition-[transform,translate,scale,opacity] duration-150 ease-out will-change-transform",
        "motion-reduce:transition-none",
        isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
        className,
      )}
    />
  );
}
