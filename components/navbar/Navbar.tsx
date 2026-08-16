"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import {
  ActiveSectionIndicator,
  navLinkStateProps,
  useActiveNavigationItemId,
} from "@/components/navbar/ActiveSectionIndicator";
import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { getNavigationItems } from "@/lib/data-access";
import type { NavigationItem } from "@/types";
import { cn } from "@/utils/cn";

/**
 * The sticky site Navbar (Requirement 5, design.md "Navbar", Component
 * Specification §4).
 *
 * Renders the link set from `data/navigation.ts` — via
 * `getNavigationItems()`, never a hardcoded anchor in JSX (Requirements 5.1,
 * 4.13) — plus the {@link ThemeToggle}. On the homepage a link smooth-scrolls to
 * its section and performs no route navigation (Requirements 5.2, 5.4); from a
 * dedicated page it falls back to `router.push("/#section-id")` and the
 * homepage's own mount effect finishes the job (Requirement 5.9).
 *
 * ## Division of labour
 *
 * - **This module** owns the link list (order, rendering, activation), the
 *   sticky surface, and the scroll-triggered blur/elevation change.
 * - **`ActiveSectionIndicator.tsx`** owns *which* link is highlighted and what
 *   the highlight looks like. {@link useActiveNavigationItemId} is called
 *   **exactly once here** and the result is threaded into every link, because
 *   each call creates an `IntersectionObserver`; one call means one observer and
 *   one decision, which is what makes "at most one highlighted link page-wide"
 *   structural rather than hopeful (Requirement 5.5).
 * - **`lib/data-access.ts`** owns the data. Nothing in this folder imports
 *   `data/navigation.ts` (Requirement 4.2).
 *
 * ## Two lists, one decision
 *
 * The desktop list is `hidden md:flex`, so below the tablet breakpoint (768px,
 * Requirement 5.6) the links live in {@link MobileNavDrawer} — a `md:hidden`
 * trigger plus a shadcn `Sheet`, rendered in the control cluster beside the
 * theme toggle. Both lists render the same {@link NavbarLink} and both receive
 * the `activeItemId` computed *here*, so the drawer never calls
 * `useActiveNavigationItemId` itself: a second call would mean a second
 * observer and two independent highlight decisions. `NavbarLink` reads
 * `usePathname`/`useRouter`/`usePrefersReducedMotion` itself — context/store
 * reads, not observers — so a per-link call costs nothing and the
 * homepage-vs-dedicated-page behaviour needs no extra props.
 *
 * The one behaviour the drawer cannot share is *when* the scroll happens: see
 * {@link MobileNavDrawer} for why Requirement 5.7's "close, then scroll" needs
 * `scrollOwner="caller"` and a deferred scroll rather than the click handler's.
 *
 * ## Height — for task 18
 *
 * The bar is `h-16` (64px) below `md` and `h-20` (80px) from `md` up
 * ({@link NAVBAR_HEIGHT_CLASS}). `components/shared/Section.tsx` offsets anchor
 * targets with `scroll-mt-[var(--section-scroll-margin,5rem)]`, so task 18
 * should define `--section-scroll-margin: 4rem` and raise it to `5rem` at the
 * `md` breakpoint; the existing `5rem` fallback already matches `md` and up.
 *
 * Client Component (task 46.4's approved boundary list): it reads scroll
 * position, an `IntersectionObserver`-backed hook, and the router.
 */

/**
 * Accessible name for the `<nav>` landmark.
 *
 * A `<nav>` is only useful as a landmark once it is named, and the name has to
 * distinguish it from the Footer's navigation when a screen reader lists
 * landmarks (audited in task 44.1/44.3). Set with `aria-label` rather than a
 * visually hidden heading because the bar has no visible title to point at.
 */
export const PRIMARY_NAVIGATION_LABEL = "Primary";

/** The one pathname whose sections a Navbar link can scroll to directly. */
export const HOMEPAGE_PATHNAME = "/";

/**
 * Whether the visitor is on the homepage, and therefore whether a link scrolls
 * (Requirement 5.2) or navigates (Requirement 5.9).
 *
 * Trailing slashes are normalised, so `"/"` and `""` both count as the homepage
 * and `"/projects/"` does not. `null`/`undefined` — which `usePathname` can
 * hand back before a route is known — resolves to `false`, i.e. *navigate*: a
 * `router.push("/#hero")` is correct from anywhere, whereas scrolling on a page
 * that has no homepage sections would silently do nothing.
 *
 * Pure and exported so both branches are testable without a router.
 */
export function isHomepagePathname(
  pathname: string | null | undefined,
): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  return pathname.replace(/\/+$/, "") === "";
}

/**
 * Whether a nav item's `href` names a real route (e.g. `"/recommendation"`)
 * rather than a homepage hash anchor (`"#projects"`, `"/#projects"`).
 *
 * `data/navigation.ts` documents this as the one distinguishing check: an
 * item whose `href` does not start with `"#"` and does not start with `"/#"`
 * is a plain page link with no section to scroll to, and both
 * {@link navLinkHref} and {@link NavbarLink}'s click handler special-case it
 * the same way.
 */
export function isRouteLink(item: NavigationItem): boolean {
  return !item.href.startsWith("#") && !item.href.startsWith("/#");
}

/**
 * The link's `href`: a bare hash on the homepage, an absolute
 * homepage-plus-hash elsewhere (design.md "Scroll-to-Section from Dedicated
 * Pages") — or, for a route-style item (e.g. Recommendation's
 * `"/recommendation"`), the item's own `href` unchanged, since there is no
 * homepage section for it to target either way.
 *
 * For homepage-section items, this is derived from `sectionId` rather than
 * read from `item.href` so the anchor can never point at a hash the scroll
 * handler does not target. It is a real, correct URL in every case, which is
 * what makes the links work with JavaScript disabled, keeps "open in new tab"
 * meaningful, and lets the click handler stay an enhancement rather than the
 * only path.
 */
export function navLinkHref(item: NavigationItem, isHomepage: boolean): string {
  if (isRouteLink(item)) {
    return item.href;
  }

  return isHomepage
    ? `#${item.sectionId}`
    : `${HOMEPAGE_PATHNAME}#${item.sectionId}`;
}

/**
 * The `router.push` target for a link activated from a dedicated page
 * (Requirement 5.9).
 *
 * Always absolute, so the push is a navigation to the homepage rather than a
 * hash change on the current route. Task 20.1's homepage reads
 * `window.location.hash` after paint and scrolls, so pushing the hash is the
 * whole of this component's responsibility.
 */
export function homepageSectionHref(item: NavigationItem): string {
  return `${HOMEPAGE_PATHNAME}#${item.sectionId}`;
}

/** `block` alignment for the scroll, so a section lands at the viewport top. */
export const SCROLL_INTO_VIEW_BLOCK = "start" as const;

/**
 * Smooth scrolling normally, an instant jump under
 * `prefers-reduced-motion: reduce` (Requirement 24.5, design.md "Navbar
 * Scroll-Only Pattern").
 *
 * The scroll itself still happens — arriving at the section is the point, only
 * the animated travel is decorative.
 */
export function resolveScrollBehavior(
  prefersReducedMotion: boolean,
): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}

/**
 * The scrollable section for this id, or `null` when there is nothing to scroll
 * to.
 *
 * `scrollIntoView` is feature-detected because jsdom does not implement it, so a
 * component test renders and clicks without a shim instead of throwing.
 *
 * Split out from {@link scrollToSection} so a caller that *defers* the scroll —
 * the mobile drawer, which must wait for the Sheet to release the body scroll
 * lock ({@link MobileNavDrawer}) — can still make the same "is there anything to
 * scroll to?" decision at click time, and therefore the same `preventDefault`
 * decision, without scrolling twice.
 */
export function findScrollableSection(sectionId: string): HTMLElement | null {
  if (typeof document === "undefined" || sectionId === "") {
    return null;
  }

  const section = document.getElementById(sectionId);

  if (section === null || typeof section.scrollIntoView !== "function") {
    return null;
  }

  return section;
}

/**
 * Whether a scroll to this section id would do something — i.e. whether
 * suppressing the anchor's default hash jump is safe.
 */
export function canScrollToSection(sectionId: string): boolean {
  return findScrollableSection(sectionId) !== null;
}

/**
 * Scrolls the homepage section with this id into view (Requirement 5.2).
 *
 * Returns `true` when a section was found and asked to scroll, `false`
 * otherwise — which is what lets the caller decide whether to suppress the
 * anchor's default hash jump: if there is nothing to scroll to, the browser's
 * own (same-page, non-navigating) behaviour is a better fallback than nothing.
 *
 * The vertical offset that keeps the section clear of this sticky bar is *not*
 * applied here: it lives in each section's `scroll-mt-*`
 * (`components/shared/Section.tsx`), so it applies to hash navigation and
 * browser-restored scroll positions too, not only to clicks.
 */
export function scrollToSection(
  sectionId: string,
  behavior: ScrollBehavior,
): boolean {
  const section = findScrollableSection(sectionId);

  if (section === null) {
    return false;
  }

  section.scrollIntoView({ behavior, block: SCROLL_INTO_VIEW_BLOCK });

  return true;
}

/**
 * The parts of a click this component inspects, as a structural type so the
 * decision can be tested without synthesising a React event.
 */
export interface NavLinkActivationLike {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
}

/**
 * Whether this activation is the plain one the scroll/push behaviour applies to.
 *
 * A modified or non-primary click (⌘/Ctrl/Shift/Alt, middle button) is the
 * browser's "open in a new tab/window" gesture, and both `href` forms
 * ({@link navLinkHref}) are real URLs, so the right response is to leave it
 * alone. Keyboard activation of an anchor (Enter) arrives as an unmodified
 * primary click, so Requirement 5.8 is satisfied by the same path as a mouse
 * click — no `keydown` handler, no synthetic button.
 */
export function isPlainActivation(event: NavLinkActivationLike): boolean {
  return (
    event.defaultPrevented !== true &&
    (event.button ?? 0) === 0 &&
    event.metaKey !== true &&
    event.ctrlKey !== true &&
    event.shiftKey !== true &&
    event.altKey !== true
  );
}

/**
 * Scroll offset past which the bar is treated as "scrolled" (Requirement 5.4).
 *
 * A few pixels rather than `0` so a rubber-band overscroll or a one-pixel
 * restore does not flip the surface on and off.
 */
export const NAVBAR_SCROLLED_THRESHOLD_PX = 8;

/**
 * Whether a given vertical scroll offset counts as "past the top of the page".
 *
 * Total: a non-finite offset (which no real browser reports, but a shimmed
 * `window` might) reads as "at the top" rather than poisoning the comparison.
 */
export function isScrolledPastTop(
  scrollY: number,
  threshold: number = NAVBAR_SCROLLED_THRESHOLD_PX,
): boolean {
  return Number.isFinite(scrollY) && scrollY > threshold;
}

/**
 * Tracks {@link isScrolledPastTop} for the window.
 *
 * Starts `false` so the server render and the first client render agree, then
 * syncs immediately inside the effect — which also covers a page restored
 * mid-scroll. The listener is `passive`, so it can never delay the scroll it is
 * observing, and it only ever calls `setState` with a boolean, so React bails
 * out of re-rendering while the value is unchanged: one state flip per crossing
 * of the threshold, not one per scroll event.
 */
function useIsScrolledPastTop(
  threshold: number = NAVBAR_SCROLLED_THRESHOLD_PX,
): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sync = () => {
      setIsScrolled(isScrolledPastTop(window.scrollY, threshold));
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });

    return () => {
      window.removeEventListener("scroll", sync);
    };
  }, [threshold]);

  return isScrolled;
}

/**
 * The bar's own height, and the reference task 18 sizes
 * `--section-scroll-margin` against: 64px below `md`, 80px from `md` up.
 *
 * Fixed per breakpoint on purpose — the scrolled state changes colour and blur
 * but never geometry, so the offset a section scrolls to stays valid and no
 * layout shift is possible (Requirement 24.4).
 */
export const NAVBAR_HEIGHT_CLASS = "h-16 md:h-20";

/**
 * The sticky surface, in both of its two states (Requirements 5.3, 5.4).
 *
 * ## Transform-safe by construction (Requirement 24.4, Property 21)
 *
 * - The **only animated properties** are `background-color` and `border-color`,
 *   both paint-only, and the transition list is *enumerated* — never
 *   `transition-all` — so no later edit can quietly start animating `width`,
 *   `height`, `top`, padding, or `box-shadow`. Same discipline as
 *   `components/shared/Button.tsx` and `Card.tsx`, and the local invariant suite
 *   in `Navbar.test.tsx` mirrors theirs.
 * - **The blur is switched, not animated.** `backdrop-filter` is absent from the
 *   transition list, so `backdrop-blur-md` turns on at the threshold in a single
 *   frame while the tint and border cross-fade around it. Animating a
 *   `backdrop-filter` would put a per-pixel filter on the compositor for the
 *   whole duration for no legibility gain.
 * - **The elevation is switched too, for the same reason.** Requirement 24.4
 *   forbids animating `box-shadow` "for any purpose", so `shadow-elevation`
 *   (the static token `Card.tsx` documents) appears with the scrolled state
 *   rather than growing into it.
 * - The border is `border-b` in **both** states — only its colour changes — so
 *   the bar's height is identical either way and nothing below it can be pushed
 *   around (no CLS).
 *
 * Duration and easing mirror `DURATION.fast` (150ms) and `EASING.out` from
 * `@/lib/motion`; this is pure CSS, so the utilities are the mirror rather than
 * the source (Requirement 24.2). `motion-reduce:transition-none` makes the
 * change instant for visitors who asked for reduced motion — the surface still
 * changes, because that is the signal (Requirement 24.5).
 *
 * Colours are semantic tokens with an alpha modifier (`bg-background/80`), never
 * a hex value (Requirement 3.6).
 */
export const NAVBAR_BASE_CLASS =
  "sticky top-0 z-50 w-full border-b transition-[background-color,border-color] duration-150 ease-out motion-reduce:transition-none";

/** At the top of the page: no tint, no blur, no elevation, invisible border. */
export const NAVBAR_AT_TOP_CLASS = "border-transparent bg-transparent";

/** Scrolled past the top: tinted, blurred, elevated (Requirement 5.4). */
export const NAVBAR_SCROLLED_CLASS =
  "border-border bg-background/80 shadow-elevation backdrop-blur-md";

/** The surface classes for one of the two states. */
export function navbarSurfaceClasses(isScrolled: boolean, pathname: string | null): string {
  // Check if we're on a page that should always show navbar background
  const isAlwaysScrolled = 
    pathname === '/projects' || 
    pathname === '/blog' ||
    pathname === '/hackathons' ||
    pathname === '/recommendation';
  
  const forceScrolled = isScrolled || isAlwaysScrolled;
  
  return cn(
    NAVBAR_BASE_CLASS,
    forceScrolled ? NAVBAR_SCROLLED_CLASS : NAVBAR_AT_TOP_CLASS,
  );
}

/**
 * A single Navbar link.
 *
 * `min-h-11` is the 44px touch target from Design_System §21, so the same
 * component is finger-friendly in the mobile drawer (task 17.6) without an
 * override. `transition-[color]` is enumerated for the reason given on
 * {@link NAVBAR_BASE_CLASS}; the focus ring is the site-wide
 * `focus-visible:outline-*` treatment (Design_System §19), never removed
 * (Requirement 5.8). `flex-col items-center` is the layout
 * `ActiveSectionIndicator` expects, since the indicator is a full-width block.
 */
export const NAVBAR_LINK_CLASS =
  "inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm px-3 text-small whitespace-nowrap text-muted-foreground transition-[color] duration-150 ease-out outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none data-[active=true]:text-foreground";

/**
 * Who performs the homepage scroll after a link is activated.
 *
 * - `"link"` (default) — the click handler scrolls immediately. Right for the
 *   desktop list, where nothing is in the way.
 * - `"caller"` — the link suppresses the anchor's default hash jump, calls
 *   `onActivate`, and then does **nothing else**: the caller owns the scroll and
 *   performs it later. The mobile drawer needs this because Radix holds the body
 *   scroll lock until the Sheet has finished unmounting, so a scroll issued from
 *   the click handler is clamped away (see {@link MobileNavDrawer}).
 *
 * Modelled as ownership rather than a `deferScroll` boolean because the two
 * values name *who* scrolls, which is the thing a reader needs to know; there is
 * no state in which nobody scrolls.
 */
export type NavLinkScrollOwner = "link" | "caller";

export interface NavbarLinkProps {
  /** The link to render, from `getNavigationItems()`. */
  item: NavigationItem;
  /**
   * The single highlighted link id, from one call to
   * `useActiveNavigationItemId` (see this module's doc). Passed in rather than
   * derived so the desktop list and the drawer's list can never disagree.
   */
  activeItemId: string | null;
  /**
   * Called with the item when the link is activated, **before** the scroll —
   * the drawer's "close, then scroll" hook (Requirement 5.7, task 17.6).
   */
  onActivate?: (item: NavigationItem) => void;
  /**
   * Who scrolls on the homepage. Defaults to `"link"`; the drawer passes
   * `"caller"`. See {@link NavLinkScrollOwner}.
   */
  scrollOwner?: NavLinkScrollOwner;
  /** Extra utilities merged onto the anchor; conflicting classes win (see `cn`). */
  className?: string;
  /** Extra utilities merged onto the active-section indicator. */
  indicatorClassName?: string;
}

/**
 * One link, with its activation behaviour: smooth-scroll on the homepage
 * (Requirements 5.2, 5.4), `router.push("/#section-id")` from a dedicated page
 * (Requirement 5.9).
 *
 * Exported because task 17.6's drawer renders a *second* list of the same links
 * and must behave identically; the alternative — a copy of this handler in the
 * drawer — is how the two lists would eventually diverge.
 *
 * A real `<a>` with a real `href`, so it is reachable and operable by keyboard
 * with no extra wiring (Requirement 5.8), and the click handler is a genuine
 * enhancement: suppress the default only once the scroll has actually been
 * performed.
 */
export function NavbarLink({
  item,
  activeItemId,
  onActivate,
  scrollOwner = "link",
  className,
  indicatorClassName,
}: NavbarLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();

  const isHomepage = isHomepagePathname(pathname);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isPlainActivation(event)) {
      return;
    }

    onActivate?.(item);

    // A real route link (e.g. Recommendation's `/recommendation`): no
    // homepage section to scroll to, ever — let it behave as an ordinary
    // Next.js navigation with no `preventDefault`, no scroll, no router
    // override.
    if (isRouteLink(item)) {
      return;
    }

    // Requirement 5.9: no homepage sections here to scroll to, so hand the hash
    // to the router and let the homepage's mount effect finish the scroll.
    if (!isHomepage) {
      event.preventDefault();
      router.push(homepageSectionHref(item));

      return;
    }

    // Requirement 5.2: scroll, never navigate. `preventDefault` is conditional
    // in both branches so a missing section degrades to the browser's own
    // same-page hash jump instead of to a dead link.
    if (scrollOwner === "caller") {
      // The caller scrolls once it is ready (Requirement 5.7's "then scroll").
      if (canScrollToSection(item.sectionId)) {
        event.preventDefault();
      }

      return;
    }

    if (
      scrollToSection(
        item.sectionId,
        resolveScrollBehavior(prefersReducedMotion),
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <a
      href={navLinkHref(item, isHomepage)}
      data-slot="navbar-link"
      data-item-id={item.id}
      data-section-id={item.sectionId}
      onClick={handleClick}
      className={cn(NAVBAR_LINK_CLASS, className)}
      {...navLinkStateProps(item, activeItemId)}
    >
      {item.label}
      <ActiveSectionIndicator
        item={item}
        activeItemId={activeItemId}
        className={indicatorClassName}
      />
    </a>
  );
}

/**
 * Layout for the right-hand control cluster: the theme toggle and the
 * `md:hidden` drawer trigger beside it.
 */
export const NAVBAR_CONTROLS = "flex items-center gap-1 sm:gap-2";

/**
 * Accessible name for the drawer trigger (Requirement 26.5: an icon-only
 * control must name itself).
 *
 * Names the action rather than the object — the same convention
 * `ThemeToggle`'s label follows — and stays "Open" in both states because
 * `aria-expanded` already carries the state; a label that flipped to "Close"
 * would say the same thing a second time and in the opposite direction from
 * `aria-expanded` for the frame between them.
 */
export const MOBILE_DRAWER_TRIGGER_LABEL = "Open navigation menu";

/**
 * The drawer surface's `id`, so the trigger's `aria-controls` points at a
 * *known* element rather than a Radix-generated one.
 *
 * Radix's `Dialog.Trigger` already emits `aria-expanded`, `aria-controls`, and
 * `aria-haspopup="dialog"`. Both attributes are nonetheless set explicitly here
 * (with this id on the content) so the relationship is stated in this file,
 * asserted by this folder's tests, and unaffected by a regeneration of
 * `components/ui/sheet.tsx`.
 */
export const MOBILE_DRAWER_ID = "navbar-mobile-drawer";

/** Visible drawer heading, and the dialog's accessible name. */
export const MOBILE_DRAWER_TITLE = "Navigation";

/**
 * The dialog's description, visually hidden.
 *
 * Radix wires `aria-describedby` to it, so a screen-reader user hears what the
 * overlay is for on open. Hidden rather than rendered because sighted visitors
 * already have five labelled links telling them the same thing.
 */
export const MOBILE_DRAWER_DESCRIPTION =
  "Jump to a section of the homepage. Press Escape to close.";

/**
 * Accessible name for the drawer's `<nav>` landmark.
 *
 * Deliberately *not* {@link PRIMARY_NAVIGATION_LABEL}: the drawer is portalled
 * to `<body>`, so it is a sibling landmark of the bar's own `<nav>`, and two
 * landmarks sharing a name would be indistinguishable in a screen reader's
 * landmark list. Only one is ever exposed at a time — the desktop list is
 * `display: none` below `md` and the trigger is `display: none` from `md` up —
 * but the names are distinct so that fact is not what keeps the list readable.
 */
export const MOBILE_NAVIGATION_LABEL = "Primary (mobile)";

/**
 * The trigger: `md:hidden`, so it exists exactly where the desktop list does not
 * (Requirements 5.6, 26.1 — the tablet breakpoint is `md`, 768px).
 *
 * Geometry, focus ring, and the 44px touch target come from `Button`'s `icon`
 * size, so nothing about the control's size is restated here.
 */
export const MOBILE_DRAWER_TRIGGER_CLASS = "text-foreground md:hidden";

/**
 * Overrides applied to `SheetContent` (Requirement 24.4, Property 21).
 *
 * `components/ui/sheet.tsx` is shadcn-generated and out of scope to edit, so
 * what can be corrected from the outside is corrected here through `cn`, where
 * `tailwind-merge` resolves each conflict in favour of the class passed in:
 *
 * - **`transition-[transform,translate,opacity]` replaces the primitive's bare
 *   `transition`.** In Tailwind v4 `transition` expands to a property list that
 *   includes `box-shadow`, `filter`, and `backdrop-filter`, and Requirement 24.4
 *   forbids animating `box-shadow` "for any purpose". Nothing in the primitive
 *   actually *changes* those properties today (`shadow-lg` is static), so the
 *   bare utility was a latent hazard rather than a live violation; enumerating
 *   the list closes it. The open/close animation itself is `tw-animate-css`'s
 *   `slide-in-from-*`/`slide-out-to-*` (translate keyframes) plus the overlay's
 *   `fade-in-0`/`fade-out-0` (opacity) — transform and opacity only, which is
 *   what Requirement 24.4 permits.
 * - **`border-border`** because Tailwind v4's default border colour is
 *   `currentColor`, and the primitive's `border-l` sets only a width.
 *
 * Two things are knowingly left as the primitive has them, because "fixing"
 * either from here would be a guess dressed up as a fix:
 *
 * - **`shadow-lg`**, a raw Tailwind shadow rather than the `shadow-elevation`
 *   token from Design_System §8. It cannot be overridden through `cn`:
 *   `tailwind-merge` reads `shadow-elevation` as a shadow *colour* (the segment
 *   after `shadow-` is not a t-shirt size), so it is not in the same conflict
 *   group as `shadow-lg` and neither class removes the other — which would leave
 *   both in the class list and the winner decided by compiled-stylesheet order.
 *   The shadow is static in both states, so Requirement 24.4 is unaffected; the
 *   token swap belongs in `components/ui/sheet.tsx` itself.
 * - **The overlay's `bg-black/50` scrim**, which is not a semantic token but is
 *   also unreachable from here — `SheetContent` renders its own overlay — and a
 *   fixed-black scrim behind a dialog is correct in both themes.
 */
export const MOBILE_DRAWER_CONTENT_CLASS =
  "border-border bg-background transition-[transform,translate,opacity]";

/**
 * Drawer link geometry: full-width and left-aligned, instead of the centred
 * desktop pill.
 *
 * Only alignment and type scale change — `min-h-11` (the 44px touch target),
 * the focus ring, and the enumerated `transition-[color]` all come from
 * {@link NAVBAR_LINK_CLASS}, so the drawer cannot drift from the bar.
 * `flex-col` is kept because `ActiveSectionIndicator` is a block-level rule that
 * sits *under* the label.
 */
export const MOBILE_DRAWER_LINK_CLASS =
  "w-full items-start justify-center rounded-md px-3 text-body";

/**
 * The active-section rule inside the drawer: a short accent under the label
 * rather than a full-width underline, which at drawer width would read as a
 * divider.
 */
export const MOBILE_DRAWER_INDICATOR_CLASS = "w-8";

export interface MobileNavDrawerProps {
  /** The same links the desktop list renders, from `getNavigationItems()`. */
  items: readonly NavigationItem[];
  /**
   * The highlighted link id, computed **once** by the parent `Navbar` (see the
   * module doc). Threaded in as a prop precisely so this component cannot call
   * `useActiveNavigationItemId` and create a second `IntersectionObserver`,
   * which would give the drawer its own opinion about which link is current
   * (Requirement 5.5).
   */
  activeItemId: string | null;
  /** Extra utilities merged onto the trigger; conflicting classes win. */
  className?: string;
}

/**
 * The mobile navigation drawer (Requirements 5.6, 5.7, 5.8, 26.1, 26.2).
 *
 * Below `md` the bar's link list is `display: none`, so this `md:hidden` trigger
 * plus a shadcn `Sheet` is where the links live on a phone. The list is rendered
 * with {@link NavbarLink} — the same component the desktop list uses — so
 * "scroll on the homepage, `router.push` from a dedicated page", the href
 * shapes, the focus ring, and the active-link treatment are shared rather than
 * reimplemented.
 *
 * ## Close, *then* scroll (Requirement 5.7)
 *
 * The order matters, and getting it in the right order takes more than calling
 * the two in sequence. While the Sheet is open Radix holds a body scroll lock
 * (`overflow: hidden` on `<body>`), and it holds it until the content has
 * finished unmounting — `setIsOpen(false)` only *starts* that. A
 * `scrollIntoView` issued from the click handler would therefore run against a
 * viewport that cannot scroll and be clamped away: the drawer would close and
 * the visitor would stay exactly where they were.
 *
 * So the scroll is deferred rather than raced:
 *
 * 1. Each link is `scrollOwner="caller"`, so it prevents the anchor's default
 *    hash jump, calls `onActivate`, and scrolls **not at all**.
 * 2. `onActivate` records the item and closes the drawer.
 * 3. `onCloseAutoFocus` — which Radix fires once the content has unmounted and
 *    before it restores focus to the trigger — reads the recorded item and
 *    schedules the scroll on the next animation frame. The extra frame is not
 *    superstition: the lock's removal and this callback happen in the same React
 *    commit, in an order this component does not control, so the frame boundary
 *    is what guarantees the style has been flushed before the scroll starts.
 * 4. The event is *not* `preventDefault`ed, so Radix still returns focus to the
 *    trigger — the keyboard visitor lands back on the control they opened, not
 *    at the top of the document (Requirement 26.1).
 *
 * The recorded item is a ref, not state: it is a one-shot message between two
 * callbacks and nothing renders from it, so storing it in state would only buy
 * an extra render. It is cleared on read, which is what makes a close for any
 * other reason (Escape, the overlay, the X) scroll nowhere.
 *
 * From a dedicated page the recorded scroll finds no section and returns
 * `false`; `NavbarLink` has already pushed `/#section-id` and the homepage's own
 * mount effect finishes the job (Requirement 5.9).
 *
 * ## Keyboard operability (Requirements 5.8, 26.1, 26.2)
 *
 * - **Tab / Shift+Tab** — the trigger is in the normal tab order; while the
 *   drawer is open Radix's focus scope cycles Tab and Shift+Tab within it, so
 *   nothing behind the overlay can be reached and focus cannot escape.
 * - **Enter and Space** — the trigger is a real `<button>` (via
 *   `components/shared/Button.tsx` and `asChild`), which browsers activate on
 *   *both* keys natively. This is the reason the trigger is not an anchor or a
 *   `div`: Requirement 26.1 lists Space explicitly, and an anchor does not
 *   respond to Space (it scrolls the page instead). The links inside are real
 *   anchors, which respond to Enter and, per the HTML activation behaviour of
 *   links, not to Space — that is the platform's own convention for links
 *   versus buttons, which Requirement 26.1 is asking to be honoured rather than
 *   overridden. Adding a Space handler to the anchors would make them
 *   inconsistent with every other link on the site and with what a screen-reader
 *   user is told they are ("link"), so no `keydown` handler is added anywhere
 *   here. Requirement 26.1's key list is satisfied per element type: every key
 *   that the element's role defines an activation for works.
 * - **Escape** — Radix's `Dialog` dismisses on Escape, and because
 *   `onCloseAutoFocus` finds no recorded item, an Escape close scrolls nowhere.
 * - **Visible focus (Requirement 26.2)** — the trigger's ring is `Button`'s
 *   `focus-visible:outline-*` treatment and each link's is
 *   {@link NAVBAR_LINK_CLASS}'s; neither is removed here.
 *
 * Accepted edge case: a viewport resized past `md` *while* the drawer is open
 * leaves it open (the trigger disappears, the desktop list appears behind the
 * overlay). Hiding the open content with `md:hidden` would strand a focus trap
 * inside a `display: none` subtree, which is strictly worse, and adding a
 * `matchMedia` listener to force-close would put a second source of truth for
 * the breakpoint next to the CSS one. Escape, the overlay, and the close button
 * all still work.
 */
export function MobileNavDrawer({
  items,
  activeItemId,
  className,
}: MobileNavDrawerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const pendingItemRef = useRef<NavigationItem | null>(null);

  /** Requirement 5.7, first half: record the target, then close. */
  function handleActivate(item: NavigationItem) {
    pendingItemRef.current = item;
    setIsOpen(false);
  }

  /** Requirement 5.7, second half: scroll once the drawer is really gone. */
  function handleCloseAutoFocus() {
    const pendingItem = pendingItemRef.current;
    pendingItemRef.current = null;

    if (pendingItem === null) {
      return;
    }

    const scroll = () => {
      scrollToSection(
        pendingItem.sectionId,
        resolveScrollBehavior(prefersReducedMotion),
      );
    };

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(scroll);

      return;
    }

    scroll();
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={MOBILE_DRAWER_TRIGGER_LABEL}
          aria-expanded={isOpen}
          aria-controls={MOBILE_DRAWER_ID}
          data-slot="navbar-drawer-trigger"
          className={cn(MOBILE_DRAWER_TRIGGER_CLASS, className)}
        >
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        id={MOBILE_DRAWER_ID}
        side="right"
        data-slot="navbar-drawer"
        className={MOBILE_DRAWER_CONTENT_CLASS}
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <SheetHeader>
          <SheetTitle className="text-h4">{MOBILE_DRAWER_TITLE}</SheetTitle>
          <SheetDescription className="sr-only">
            {MOBILE_DRAWER_DESCRIPTION}
          </SheetDescription>
        </SheetHeader>

        <nav aria-label={MOBILE_NAVIGATION_LABEL}>
          <ul
            data-slot="navbar-drawer-links"
            className="flex flex-col gap-1 px-2"
          >
            {items.map((item) => (
              <li key={item.id}>
                <NavbarLink
                  item={item}
                  activeItemId={activeItemId}
                  scrollOwner="caller"
                  onActivate={handleActivate}
                  className={MOBILE_DRAWER_LINK_CLASS}
                  indicatorClassName={MOBILE_DRAWER_INDICATOR_CLASS}
                />
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export interface NavbarProps {
  /** Extra utilities merged onto the `<header>`; conflicting classes win. */
  className?: string;
}

/**
 * The site Navbar. See this module's doc for the data flow, the single-observer
 * rule, and the transform-safety argument.
 */
export function Navbar({ className }: NavbarProps) {
  const items = getNavigationItems();
  // Exactly one call, page-wide (Requirement 5.5) — see the module doc.
  const activeItemId = useActiveNavigationItemId(items);
  const isScrolled = useIsScrolledPastTop();
  const pathname = usePathname();

  return (
    <header
      data-slot="navbar"
      data-scrolled={isScrolled ? "true" : undefined}
      className={cn(navbarSurfaceClasses(isScrolled, pathname), className)}
    >
      <Container className="max-w-4xl">
        <nav
          aria-label={PRIMARY_NAVIGATION_LABEL}
          className={cn(
            NAVBAR_HEIGHT_CLASS,
            "flex items-center justify-center gap-4",
          )}
        >
          {/* Hidden below the tablet breakpoint (Requirement 5.6); the drawer
              below renders the same links there. Grouped tightly with the
              controls cluster (no `justify-between`/`ml-auto` spread) so the
              bar hugs its own content instead of stretching edge to edge. */}
          <ul
            data-slot="navbar-links"
            className="hidden items-center gap-1 md:flex lg:gap-2"
          >
            {items.map((item) => (
              <li key={item.id}>
                <NavbarLink item={item} activeItemId={activeItemId} />
              </li>
            ))}
          </ul>

          <div data-slot="navbar-controls" className={cn(NAVBAR_CONTROLS)}>
            {/* Requirement 5.6: the links below `md`, where the list above is
                `display: none`. Same `items` and same `activeItemId` — one
                observer, one highlight decision. */}
            <MobileNavDrawer items={items} activeItemId={activeItemId} />
          </div>
        </nav>
      </Container>
    </header>
  );
}
