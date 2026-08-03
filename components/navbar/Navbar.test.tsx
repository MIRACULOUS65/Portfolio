import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACTIVE_NAV_LINK_ARIA_CURRENT } from "@/components/navbar/ActiveSectionIndicator";
import { navigation } from "@/data/navigation";
import { getNavigationItems } from "@/lib/data-access";

import {
  MOBILE_DRAWER_CONTENT_CLASS,
  MOBILE_DRAWER_ID,
  MOBILE_DRAWER_INDICATOR_CLASS,
  MOBILE_DRAWER_LINK_CLASS,
  MOBILE_DRAWER_TITLE,
  MOBILE_DRAWER_TRIGGER_CLASS,
  MOBILE_DRAWER_TRIGGER_LABEL,
  MOBILE_NAVIGATION_LABEL,
  NAVBAR_AT_TOP_CLASS,
  NAVBAR_LINK_CLASS,
  NAVBAR_SCROLLED_CLASS,
  Navbar,
  PRIMARY_NAVIGATION_LABEL,
  canScrollToSection,
  isHomepagePathname,
  isPlainActivation,
  isRouteLink,
  isScrolledPastTop,
  navLinkHref,
  navbarSurfaceClasses,
  resolveScrollBehavior,
} from "./Navbar";

/**
 * The homepage-section items — every nav item except Recommendation, which is
 * now a real dedicated route (`/recommendation`) rather than a homepage hash
 * anchor. Tests that exercise "scroll on the homepage" / "push from a
 * dedicated page" behaviour iterate this list rather than the full item set,
 * since a route link is exempt from both by design (see `isRouteLink`).
 */
function scrollableNavigationItems() {
  return getNavigationItems().filter((item) => !isRouteLink(item));
}

/**
 * The Navbar suite.
 *
 * Tasks 17.5/17.6 opened it with smoke coverage of the behaviour they
 * introduced; task 17.7 completed it, adding the data-derived link set
 * (Requirement 5.1), the exhaustive "scrolls, never routes" and
 * dedicated-page-push checks over *every* link (Requirements 5.2, 5.4, 5.9),
 * reduced-motion degradation on both scroll paths (Requirement 24.5), the
 * breakpoint split and shared drawer list (Requirements 5.6, 26.1), the drawer's
 * close-then-scroll-exactly-once contract (Requirement 5.7), keyboard
 * operability including focus containment (Requirements 5.8, 26.1, 26.2), and
 * the at-most-one-highlight invariant counted across both lists at once
 * (Requirement 5.5). The local Requirement 24.4 invariant lives at the bottom,
 * next to the class strings it guards.
 */

/* `next/navigation` needs a router: jsdom has no Next.js app router context. */
const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  pathname: { current: "/" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerMocks.push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => routerMocks.pathname.current,
}));

/**
 * jsdom ships no `matchMedia` (`usePrefersReducedMotion` and `next-themes` both
 * probe it) and no `scrollIntoView`. Environment shims for browser APIs jsdom
 * omits, not stand-ins for the code under test.
 */
let reduceMotion = false;
let scrollIntoView: Element["scrollIntoView"] & ReturnType<typeof vi.fn>;

beforeEach(() => {
  reduceMotion = false;
  routerMocks.push.mockClear();
  routerMocks.pathname.current = "/";

  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: reduceMotion,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );

  scrollIntoView = vi.fn<Element["scrollIntoView"]>() as typeof scrollIntoView;

  for (const item of getNavigationItems()) {
    const section = document.createElement("section");
    section.id = item.sectionId;
    section.scrollIntoView = scrollIntoView;
    document.body.append(section);
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.querySelectorAll("section").forEach((section) => {
    section.remove();
  });
});

function links(): HTMLAnchorElement[] {
  return screen.getAllByRole("link");
}

/**
 * 30s for the few tests that drive five full drawer open/close cycles. The
 * suite's 5s `testTimeout` is the right budget for an ordinary example test; a
 * test that mounts, opens a Radix dialog, and waits for an animation frame five
 * times over legitimately does five times the work (see `vitest.config.ts`).
 */
const SLOW_TEST_TIMEOUT_MS = 30_000;

/**
 * Replaces the harness's one shared `scrollIntoView` mock with one spy **per
 * section**, so a test can say *which* section was scrolled rather than only
 * that something was.
 *
 * Call before `render`; the sections themselves are appended by the `beforeEach`
 * above and removed by the `afterEach`.
 */
function sectionScrollSpies(): Map<string, ReturnType<typeof vi.fn>> {
  const spies = new Map<string, ReturnType<typeof vi.fn>>();

  for (const section of document.body.querySelectorAll("section")) {
    const spy = vi.fn<Element["scrollIntoView"]>();
    section.scrollIntoView = spy as unknown as Element["scrollIntoView"];
    spies.set(section.id, spy);
  }

  return spies;
}

/** The section ids whose spy was called, so a test can assert on the whole set. */
function scrolledSectionIds(
  spies: Map<string, ReturnType<typeof vi.fn>>,
): string[] {
  return [...spies.entries()]
    .filter(([, spy]) => spy.mock.calls.length > 0)
    .map(([sectionId]) => sectionId);
}

/** The `hidden md:flex` desktop list — the one the drawer duplicates below `md`. */
function desktopLinkList(): HTMLElement {
  const list = document.querySelector<HTMLElement>(
    '[data-slot="navbar-links"]',
  );

  expect(list).not.toBeNull();

  return list!;
}

/** The rendered link identities of a list, in render order. */
function renderedItemIds(scope: HTMLElement): string[] {
  return [
    ...scope.querySelectorAll<HTMLAnchorElement>('a[data-slot="navbar-link"]'),
  ].map((link) => link.dataset.itemId ?? "");
}

/**
 * Every highlighted link in the whole document — both lists at once, which is
 * the scope Requirement 5.5 is about.
 */
function highlightedLinks(): HTMLAnchorElement[] {
  return [
    ...document.querySelectorAll<HTMLAnchorElement>(
      'a[data-slot="navbar-link"][data-active="true"]',
    ),
  ];
}

/**
 * jsdom implements no `IntersectionObserver`. Same controllable shim as
 * `hooks/useActiveSection.test.ts` (copied rather than exported from a test
 * file): it records observed targets and lets a test drive the callback by hand,
 * which is how the active-section highlight can be exercised at all here.
 */
class ControllableIntersectionObserver implements IntersectionObserver {
  static instances: ControllableIntersectionObserver[] = [];

  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  readonly observed: Element[] = [];

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.rootMargin = options?.rootMargin ?? "0px";
    this.thresholds = (options?.threshold as number[] | undefined) ?? [0];
    ControllableIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.observed.push(target);
  }

  unobserve(): void {}

  disconnect(): void {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Feeds `{ id, ratio }` pairs through the observer callback. */
  emit(visibilities: Array<{ id: string; ratio: number }>): void {
    const entries = visibilities.map((visibility) => {
      const target = this.observed.find(
        (element) => element.id === visibility.id,
      );

      return {
        target,
        isIntersecting: visibility.ratio > 0,
        intersectionRatio: visibility.ratio,
      } as unknown as IntersectionObserverEntry;
    });

    this.callback(entries, this);
  }
}

describe("navigation helpers", () => {
  it("treats only the homepage as scrollable", () => {
    expect(isHomepagePathname("/")).toBe(true);
    expect(isHomepagePathname("//")).toBe(true);
    expect(isHomepagePathname("/projects")).toBe(false);
    expect(isHomepagePathname("/projects/")).toBe(false);
    // Unknown route: push, because scrolling somewhere without sections is a
    // silent no-op.
    expect(isHomepagePathname(null)).toBe(false);
  });

  it("uses a bare hash on the homepage and an absolute target elsewhere", () => {
    const [home] = getNavigationItems();

    expect(navLinkHref(home, true)).toBe("#hero");
    expect(navLinkHref(home, false)).toBe("/#hero");
  });

  it("treats Recommendation's href as a real route, unaffected by homepage/dedicated-page context", () => {
    const recommendation = getNavigationItems().find(
      (item) => item.id === "nav-recommendation",
    )!;

    expect(isRouteLink(recommendation)).toBe(true);
    expect(navLinkHref(recommendation, true)).toBe("/recommendation");
    expect(navLinkHref(recommendation, false)).toBe("/recommendation");
  });

  it("treats every homepage-section item as a hash anchor, never a route link", () => {
    for (const item of scrollableNavigationItems()) {
      expect(isRouteLink(item)).toBe(false);
    }
  });

  it("degrades smooth scrolling to an instant jump under reduced motion", () => {
    expect(resolveScrollBehavior(false)).toBe("smooth");
    expect(resolveScrollBehavior(true)).toBe("auto");
  });

  it("flips the scrolled state past a small threshold only", () => {
    expect(isScrolledPastTop(0)).toBe(false);
    expect(isScrolledPastTop(8)).toBe(false);
    expect(isScrolledPastTop(9)).toBe(true);
    expect(isScrolledPastTop(Number.NaN)).toBe(false);
  });

  it("leaves modified clicks to the browser's open-in-new-tab gesture", () => {
    expect(isPlainActivation({})).toBe(true);
    expect(isPlainActivation({ button: 1 })).toBe(false);
    expect(isPlainActivation({ metaKey: true })).toBe(false);
    expect(isPlainActivation({ ctrlKey: true })).toBe(false);
    expect(isPlainActivation({ defaultPrevented: true })).toBe(false);
  });

  it("reports whether a deferred scroll would land anywhere", () => {
    // The sections the harness appended exist; an unknown id does not, which is
    // what keeps the drawer's `preventDefault` decision honest.
    expect(canScrollToSection(getNavigationItems()[0].sectionId)).toBe(true);
    expect(canScrollToSection("not-a-section")).toBe(false);
    expect(canScrollToSection("")).toBe(false);
  });
});

describe("<Navbar />", () => {
  it("renders the visible link set from the data layer, in order", () => {
    render(<Navbar />);

    const items = getNavigationItems();

    expect(items.map((item) => item.label)).toEqual([
      "Home",
      "Projects",
      "Tech Stack",
      "Blog",
      "Hackathon",
      "Recommendation",
      "Connect",
    ]);
    expect(links().map((link) => link.textContent)).toEqual(
      items.map((item) => item.label),
    );
    expect(links().map((link) => link.getAttribute("href"))).toEqual(
      items.map((item) => (isRouteLink(item) ? item.href : `#${item.sectionId}`)),
    );
  });

  it("exposes a named navigation landmark and the theme toggle", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("navigation", { name: PRIMARY_NAVIGATION_LABEL }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument();
  });

  it("scrolls to the section and never routes while on the homepage", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("link", { name: "Projects" }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(routerMocks.push).not.toHaveBeenCalled();
  });

  it("jumps instantly under reduced motion", async () => {
    reduceMotion = true;
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("link", { name: "Blog" }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("pushes the homepage hash from a dedicated page (Requirement 5.9)", async () => {
    routerMocks.pathname.current = "/projects";
    const user = userEvent.setup();
    render(<Navbar />);

    const link = screen.getByRole("link", { name: "Connect" });
    expect(link).toHaveAttribute("href", "/#connect");

    await user.click(link);

    expect(routerMocks.push).toHaveBeenCalledWith("/#connect");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("marks the sticky surface and starts unscrolled", () => {
    render(<Navbar />);

    const header = screen.getByRole("banner");

    expect(header.className).toContain("sticky");
    expect(header.className).toContain("top-0");
    expect(header).not.toHaveAttribute("data-scrolled");
  });
});

/**
 * Task 17.6 smoke coverage: the drawer exists below the tablet breakpoint
 * (Requirement 5.6), closes *before* it scrolls (Requirement 5.7), and is
 * operable by keyboard (Requirements 5.8, 26.1, 26.2). Task 17.7 owns the
 * exhaustive version.
 *
 * Note on queries: while the drawer is open Radix marks every other child of
 * `<body>` `aria-hidden`, so the trigger is no longer reachable through a role
 * query. Tests therefore hold on to the element they queried before opening.
 */
describe("<Navbar /> mobile drawer", () => {
  function drawerTrigger(): HTMLElement {
    return screen.getByRole("button", { name: MOBILE_DRAWER_TRIGGER_LABEL });
  }

  it("collapses the links behind an icon trigger that is hidden from md up", () => {
    render(<Navbar />);

    const trigger = drawerTrigger();

    // Requirement 5.6/26.1: present exactly where the `hidden md:flex` list is
    // not.
    expect(trigger.className).toContain("md:hidden");
    expect(MOBILE_DRAWER_TRIGGER_CLASS).toContain("md:hidden");
    // Requirement 26.5: an icon-only control names itself, and its state is
    // exposed rather than implied.
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", MOBILE_DRAWER_ID);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a labelled drawer holding the same link set", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(drawerTrigger());

    const drawer = screen.getByRole("dialog", { name: MOBILE_DRAWER_TITLE });
    expect(drawer).toHaveAttribute("id", MOBILE_DRAWER_ID);

    const drawerNav = within(drawer).getByRole("navigation", {
      name: MOBILE_NAVIGATION_LABEL,
    });
    const items = getNavigationItems();

    expect(
      within(drawerNav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(items.map((item) => item.label));
    expect(
      within(drawerNav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(
      items.map((item) => (isRouteLink(item) ? item.href : `#${item.sectionId}`)),
    );
  });

  it("closes the drawer and only then scrolls (Requirement 5.7)", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(drawerTrigger());

    const drawer = screen.getByRole("dialog");
    await user.click(within(drawer).getByRole("link", { name: "Projects" }));

    // Closed first: the scroll is deferred to `onCloseAutoFocus`, so it cannot
    // have run while the drawer still held the body scroll lock.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });
    // Exactly once: the link defers rather than scrolling as well.
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    // Requirement 5.2: still a scroll, never a route change, on the homepage.
    expect(routerMocks.push).not.toHaveBeenCalled();
  });

  it("dismisses on Escape without scrolling anywhere (Requirement 26.1)", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const trigger = drawerTrigger();
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    // No pending item, so the deferred scroll is a no-op.
    expect(scrollIntoView).not.toHaveBeenCalled();
    // Focus returns to the control the visitor opened.
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens from the keyboard with both Enter and Space (Requirement 26.1)", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const trigger = drawerTrigger();

    // In the tab order rather than reachable only by pointer. Counting Tab
    // presses would be meaningless here: CSS is off in jsdom, so the desktop
    // list is focusable in the test even though it is `display: none` at the
    // viewport this drawer belongs to.
    expect(trigger).not.toHaveAttribute("tabindex", "-1");
    trigger.focus();
    expect(trigger).toHaveFocus();

    // A real <button>, so the browser activates it on Space as well as Enter —
    // the reason the trigger is not an anchor.
    await user.keyboard(" ");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

/**
 * Requirement 5.1: the link set is *derived*, never hardcoded in JSX
 * (Requirement 4.13). These assertions compare the render with what
 * `getNavigationItems()` returns rather than with literal strings, so flipping a
 * `visible` flag or changing an `order` in `data/navigation.ts` moves the render
 * and the test follows it instead of failing.
 */
describe("<Navbar /> link set (Requirement 5.1)", () => {
  it("renders one link per data-layer item, in the selector's order", () => {
    render(<Navbar />);

    const items = getNavigationItems();
    const list = desktopLinkList();
    const rendered = [
      ...list.querySelectorAll<HTMLAnchorElement>('a[data-slot="navbar-link"]'),
    ];

    expect(rendered).toHaveLength(items.length);
    // Identity, label, href, and scroll target all come from the same record.
    expect(rendered.map((link) => link.dataset.itemId)).toEqual(
      items.map((item) => item.id),
    );
    expect(rendered.map((link) => link.textContent)).toEqual(
      items.map((item) => item.label),
    );
    expect(rendered.map((link) => link.getAttribute("href"))).toEqual(
      items.map((item) => (isRouteLink(item) ? item.href : `#${item.sectionId}`)),
    );
    expect(rendered.map((link) => link.dataset.sectionId)).toEqual(
      items.map((item) => item.sectionId),
    );
    // The selector's contract, restated where the render depends on it: visible
    // only, ascending `order`.
    expect(items.every((item) => item.visible)).toBe(true);
    expect(items.map((item) => item.order)).toEqual(
      [...items].map((item) => item.order).sort((a, b) => a - b),
    );
  });

  it("renders exactly the seven group links and nothing more", () => {
    render(<Navbar />);

    // All seven homepage groups ship `visible: true` (Requirement 5.1's "one
    // entry per group" grouping) — `Navbar` still only ever renders
    // `getNavigationItems()` (Requirement 4.2), so this asserts the full,
    // hidden-free set rather than absence of any specific item.
    expect(navigation.every((item) => item.visible)).toBe(true);
    expect(links()).toHaveLength(getNavigationItems().length);
    expect(getNavigationItems()).toHaveLength(7);
  });
});

/**
 * Requirements 5.2 and 5.4: on the homepage a link scrolls and the router is
 * never touched — for **every** link, not a representative one, since the whole
 * point of the shared `NavbarLink` is that no single link can behave differently.
 */
describe("<Navbar /> activation on the homepage (Requirements 5.2, 5.4)", () => {
  it("smooth-scrolls each link's own section and never routes", async () => {
    const spies = sectionScrollSpies();
    const user = userEvent.setup();
    render(<Navbar />);

    // Recommendation is a real route link, exempt from this scroll contract
    // by design — see the dedicated `isRouteLink` test above.
    const items = scrollableNavigationItems();
    const hashBefore = window.location.hash;

    for (const item of items) {
      await user.click(screen.getByRole("link", { name: item.label }));

      // The right section, and only that one, for this click.
      expect(spies.get(item.sectionId)).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
      expect(spies.get(item.sectionId)).toHaveBeenCalledTimes(1);
    }

    expect(scrolledSectionIds(spies).sort()).toEqual(
      items.map((item) => item.sectionId).sort(),
    );
    // Requirement 5.2's "SHALL NOT navigate to a different route": no push, and
    // the anchor's own hash jump is suppressed too, so nothing about the
    // location changes.
    expect(routerMocks.push).not.toHaveBeenCalled();
    expect(window.location.hash).toBe(hashBefore);
  });
});

/**
 * Requirement 5.9: from a dedicated page there are no homepage sections to
 * scroll to, so each link pushes `/#section-id` and scrolls nothing — the
 * homepage's own mount effect finishes the job.
 */
describe("<Navbar /> activation from a dedicated page (Requirement 5.9)", () => {
  it("pushes the homepage hash for every homepage-section link and scrolls nowhere", async () => {
    routerMocks.pathname.current = "/projects";
    const spies = sectionScrollSpies();
    const user = userEvent.setup();
    render(<Navbar />);

    // Recommendation is exempt: its `href` is already the real destination
    // (`/recommendation`), so there is nothing for the router-push fallback to
    // do — see the dedicated route-link test below.
    const items = scrollableNavigationItems();

    for (const item of items) {
      const link = screen.getByRole("link", { name: item.label });
      // Absolute href, so the link is a real navigation with JS disabled too.
      expect(link).toHaveAttribute("href", `/#${item.sectionId}`);

      await user.click(link);
    }

    expect(routerMocks.push.mock.calls.map(([target]) => target)).toEqual(
      items.map((item) => `/#${item.sectionId}`),
    );
    expect(scrolledSectionIds(spies)).toEqual([]);
  });

  it("lets the Recommendation route link navigate normally, with no router.push override", async () => {
    routerMocks.pathname.current = "/projects";
    const user = userEvent.setup();
    render(<Navbar />);

    const link = screen.getByRole("link", { name: "Recommendation" });
    expect(link).toHaveAttribute("href", "/recommendation");

    await user.click(link);

    // No special-casing at all: no preventDefault, no router.push — this is
    // an ordinary anchor navigation the browser (or Next.js Link semantics)
    // handles on its own.
    expect(routerMocks.push).not.toHaveBeenCalled();
  });
});

/**
 * Requirement 24.5: arriving at the section is the point, the animated travel is
 * decorative — so reduced motion degrades `behavior` to `"auto"` on both scroll
 * paths, the immediate one and the drawer's deferred one.
 */
describe("<Navbar /> reduced motion (Requirement 24.5)", () => {
  it("jumps instantly for every homepage-section link rather than animating", async () => {
    reduceMotion = true;
    const spies = sectionScrollSpies();
    const user = userEvent.setup();
    render(<Navbar />);

    for (const item of scrollableNavigationItems()) {
      await user.click(screen.getByRole("link", { name: item.label }));

      expect(spies.get(item.sectionId)).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      });
    }
  });

  it("also degrades the drawer's deferred scroll", async () => {
    reduceMotion = true;
    const spies = sectionScrollSpies();
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(
      screen.getByRole("button", { name: MOBILE_DRAWER_TRIGGER_LABEL }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("link", { name: "Blog" }),
    );

    await waitFor(() => {
      expect(spies.get("blog")).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      });
    });
  });
});

/**
 * Requirements 5.6 and 26.1: the links exist exactly once per viewport. The
 * desktop list is `hidden md:flex` and the trigger is `md:hidden`, so the two are
 * complementary rather than overlapping, and the drawer renders the *same* set.
 */
describe("<Navbar /> breakpoint split (Requirements 5.6, 26.1)", () => {
  it("hides the desktop list below md and the trigger from md up", () => {
    render(<Navbar />);

    const list = desktopLinkList();

    expect(list.className).toContain("hidden");
    expect(list.className).toContain("md:flex");

    const trigger = screen.getByRole("button", {
      name: MOBILE_DRAWER_TRIGGER_LABEL,
    });
    expect(trigger.className).toContain("md:hidden");
    // Complementary: neither state leaves the visitor without links.
    expect(list.className).not.toContain("md:hidden");
    expect(trigger.className).not.toContain("md:flex");
  });

  it("renders the identical link identities inside the drawer", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const desktopIds = renderedItemIds(desktopLinkList());

    await user.click(
      screen.getByRole("button", { name: MOBILE_DRAWER_TRIGGER_LABEL }),
    );

    const drawer = screen.getByRole("dialog");

    expect(renderedItemIds(drawer)).toEqual(desktopIds);
    expect(desktopIds).toEqual(getNavigationItems().map((item) => item.id));
    expect(
      [
        ...drawer.querySelectorAll<HTMLAnchorElement>(
          'a[data-slot="navbar-link"]',
        ),
      ].map((link) => link.getAttribute("href")),
    ).toEqual(
      getNavigationItems().map((item) =>
        isRouteLink(item) ? item.href : `#${item.sectionId}`,
      ),
    );
  });
});

/**
 * Requirement 5.7: close the drawer, *then* scroll — and scroll **once**. The
 * implementation defers the scroll to `onCloseAutoFocus` and gives the link
 * `scrollOwner="caller"`; a regression that also scrolled from the click handler
 * would leave the drawer's behaviour looking correct while firing twice, so the
 * call count is the assertion that matters here.
 */
describe("<Navbar /> drawer close-then-scroll (Requirement 5.7)", () => {
  it(
    "closes first and scrolls exactly once, for every homepage-section drawer link",
    async () => {
      const spies = sectionScrollSpies();
      const user = userEvent.setup();
      render(<Navbar />);

      // Recommendation is a route link: activating it inside the drawer still
      // closes the drawer (`onActivate` always fires) but is exempt from the
      // close-then-scroll contract, since there is nothing to scroll to.
      const items = scrollableNavigationItems();

      for (const item of items) {
        await user.click(
          screen.getByRole("button", { name: MOBILE_DRAWER_TRIGGER_LABEL }),
        );

        const drawer = screen.getByRole("dialog");
        await user.click(
          within(drawer).getByRole("link", { name: item.label }),
        );

        // Closed before anything scrolled: the deferred scroll cannot have run
        // while Radix still held the body scroll lock.
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        await waitFor(() => {
          expect(spies.get(item.sectionId)).toHaveBeenCalledWith({
            behavior: "smooth",
            block: "start",
          });
        });
        expect(spies.get(item.sectionId)).toHaveBeenCalledTimes(1);
      }

      expect(scrolledSectionIds(spies).sort()).toEqual(
        items.map((item) => item.sectionId).sort(),
      );
      expect(routerMocks.push).not.toHaveBeenCalled();
    },
    SLOW_TEST_TIMEOUT_MS,
  );

  it(
    "scrolls nowhere when the drawer is dismissed rather than used",
    async () => {
      const spies = sectionScrollSpies();
      const user = userEvent.setup();
      render(<Navbar />);

      async function openDrawer(): Promise<HTMLElement> {
        await user.click(
          screen.getByRole("button", { name: MOBILE_DRAWER_TRIGGER_LABEL }),
        );

        return screen.getByRole("dialog");
      }

      // Escape.
      await openDrawer();
      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      // The close button inside the drawer.
      const drawer = await openDrawer();
      await user.click(within(drawer).getByRole("button", { name: "Close" }));
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      // The overlay behind it.
      await openDrawer();
      const overlay = document.querySelector<HTMLElement>(
        '[data-slot="sheet-overlay"]',
      );
      expect(overlay).not.toBeNull();
      await user.click(overlay!);
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      // No pending item was ever recorded, so every one of those closes is a
      // no-op for the scroll position.
      expect(scrolledSectionIds(spies)).toEqual([]);
      expect(routerMocks.push).not.toHaveBeenCalled();
    },
    SLOW_TEST_TIMEOUT_MS,
  );
});

/**
 * Requirements 5.8, 26.1, 26.2: reachable and operable by keyboard alone.
 *
 * Counting Tab presses would prove nothing in jsdom — CSS is off, so the
 * `hidden md:flex` desktop links are focusable in the test even at the viewport
 * the drawer belongs to. What is meaningful is *where focus can go*: into the
 * drawer on open, never out of it while open, and back to the trigger on close.
 */
describe("<Navbar /> keyboard operability (Requirements 5.8, 26.1)", () => {
  it(
    "moves focus into the drawer and keeps it there while open",
    async () => {
      const user = userEvent.setup();
      render(<Navbar />);

      const trigger = screen.getByRole("button", {
        name: MOBILE_DRAWER_TRIGGER_LABEL,
      });

      trigger.focus();
      await user.keyboard("{Enter}");

      const drawer = screen.getByRole("dialog");

      await waitFor(() => {
        expect(drawer.contains(document.activeElement)).toBe(true);
      });

      // Forwards past the end of the list and backwards past its start: Radix's
      // focus scope cycles within the drawer, so nothing behind the overlay — the
      // theme toggle, the desktop links, the trigger — can be reached.
      for (let press = 0; press < 8; press += 1) {
        await user.tab();
        expect(drawer.contains(document.activeElement)).toBe(true);
      }

      for (let press = 0; press < 3; press += 1) {
        await user.tab({ shift: true });
        expect(drawer.contains(document.activeElement)).toBe(true);
      }

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      // The element reference is held from before the open: while the drawer is up
      // Radix marks every other body child `aria-hidden`, so a role query cannot
      // find the trigger again.
      expect(trigger).toHaveFocus();
    },
    SLOW_TEST_TIMEOUT_MS,
  );

  it("activates a drawer link with Enter, and leaves Space to the platform", async () => {
    const spies = sectionScrollSpies();
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(
      screen.getByRole("button", { name: MOBILE_DRAWER_TRIGGER_LABEL }),
    );

    const link = within(screen.getByRole("dialog")).getByRole("link", {
      name: "Tech Stack",
    });
    link.focus();
    expect(link).toHaveFocus();

    // Deliberate, documented position (see `MobileNavDrawer`): the drawer's
    // links are real anchors, and an anchor's activation behaviour is Enter, not
    // Space. Space is the platform's page-scroll key here, which is why the
    // *trigger* is a real <button> and these are not.
    await user.keyboard(" ");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(scrolledSectionIds(spies)).toEqual([]);

    await user.keyboard("{Enter}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(spies.get("tech-stack")).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });
    expect(spies.get("tech-stack")).toHaveBeenCalledTimes(1);
  });
});

/**
 * Requirement 5.5: at most one link is highlighted, counted across the desktop
 * list **and** the open drawer together.
 *
 * Both lists render the same items from a single `useActiveNavigationItemId`
 * call, so the countable invariant is one highlighted *link identity*
 * page-wide — the active item's anchor appears once per list, and only one list
 * is ever visible (`hidden md:flex` versus `md:hidden`). Two *different* items
 * highlighted anywhere in the document, or two highlights inside one list, is
 * the defect this guards against.
 */
describe("<Navbar /> active link (Requirement 5.5)", () => {
  beforeEach(() => {
    ControllableIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", ControllableIntersectionObserver);
  });

  function observer(): ControllableIntersectionObserver {
    const [instance] = ControllableIntersectionObserver.instances;
    expect(instance).toBeDefined();

    return instance;
  }

  it("highlights one link identity page-wide with the drawer open", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    act(() => {
      observer().emit([
        { id: "hero", ratio: 0.1 },
        { id: "projects", ratio: 0.9 },
      ]);
    });

    await user.click(
      screen.getByRole("button", { name: MOBILE_DRAWER_TRIGGER_LABEL }),
    );

    const drawer = screen.getByRole("dialog");
    const highlighted = highlightedLinks();

    // One decision, so one identity — even though it is rendered in both lists.
    expect(new Set(highlighted.map((link) => link.dataset.itemId))).toEqual(
      new Set(["nav-projects"]),
    );
    // And one highlight per list, never two.
    expect(
      highlightedLinks().filter((link) => desktopLinkList().contains(link)),
    ).toHaveLength(1);
    expect(
      highlightedLinks().filter((link) => drawer.contains(link)),
    ).toHaveLength(1);
    expect(highlighted).toHaveLength(2);

    // The highlight is announced, not merely coloured.
    for (const link of highlighted) {
      expect(link).toHaveAttribute(
        "aria-current",
        ACTIVE_NAV_LINK_ARIA_CURRENT,
      );
    }
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(2);

    // Still one observer with both lists mounted: the drawer is handed the
    // parent's decision rather than making its own.
    expect(ControllableIntersectionObserver.instances).toHaveLength(1);
  });

  it("highlights nothing when the active section has no visible link", async () => {
    // `#contact` is a real homepage section with no `visible` navigation entry.
    const contact = document.createElement("section");
    contact.id = "contact";
    contact.scrollIntoView = vi.fn();
    document.body.append(contact);

    const user = userEvent.setup();
    render(<Navbar />);

    act(() => {
      observer().emit([{ id: "contact", ratio: 1 }]);
    });

    await user.click(
      screen.getByRole("button", { name: MOBILE_DRAWER_TRIGGER_LABEL }),
    );

    // Nothing highlighted anywhere, rather than a fallback to a neighbouring
    // link that would claim the visitor is reading a section they are not.
    expect(highlightedLinks()).toHaveLength(0);
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(0);
  });
});

// Local invariant guarding Requirement 24.4 at this component's boundary, in the
// shape `Button.test.tsx` and `Card.test.tsx` use. The spec-level check across
// all animated components is Property 21.
describe("navbar surface transform safety", () => {
  const ALLOWED_TRANSITION_PROPERTIES = [
    "transform",
    "translate",
    "scale",
    "opacity",
    "color",
    "background-color",
    "border-color",
  ];

  const LAYOUT_TRIGGERING_STATE = new RegExp(
    "(?:hover|active|focus|focus-visible|focus-within|disabled|data-\\[scrolled=true\\]):" +
      "(?:w|h|size|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|top|right|bottom|left|inset)-",
  );

  it("animates only paint-safe properties, and never box-shadow or backdrop-filter", () => {
    for (const classes of [
      navbarSurfaceClasses(false),
      navbarSurfaceClasses(true),
      NAVBAR_LINK_CLASS,
    ]) {
      expect(classes).not.toContain("transition-all");
      expect(classes).not.toMatch(LAYOUT_TRIGGERING_STATE);

      const transition = /transition-\[([^\]]+)\]/.exec(classes);
      expect(transition).not.toBeNull();
      for (const property of transition![1].split(",")) {
        expect(ALLOWED_TRANSITION_PROPERTIES).toContain(property.trim());
      }
    }
  });

  it("switches blur and elevation instead of animating them", () => {
    // Present only in the scrolled state, and absent from the transition list
    // above — so both change in a single frame rather than being animated.
    expect(NAVBAR_SCROLLED_CLASS).toContain("backdrop-blur-md");
    expect(NAVBAR_SCROLLED_CLASS).toContain("shadow-elevation");
    expect(NAVBAR_AT_TOP_CLASS).not.toContain("backdrop-blur");
    expect(NAVBAR_AT_TOP_CLASS).not.toContain("shadow-");
  });

  it("keeps the drawer's own utilities static and layout-stable", () => {
    for (const classes of [
      MOBILE_DRAWER_TRIGGER_CLASS,
      MOBILE_DRAWER_LINK_CLASS,
      MOBILE_DRAWER_INDICATOR_CLASS,
    ]) {
      expect(classes).not.toContain("transition");
      expect(classes).not.toMatch(LAYOUT_TRIGGERING_STATE);
    }

    // The one drawer class that does name a transition enumerates it.
    expect(MOBILE_DRAWER_CONTENT_CLASS).not.toContain("transition-all");
    const transition = /transition-\[([^\]]+)\]/.exec(
      MOBILE_DRAWER_CONTENT_CLASS,
    );
    expect(transition).not.toBeNull();
    for (const property of transition![1].split(",")) {
      expect(ALLOWED_TRANSITION_PROPERTIES).toContain(property.trim());
    }
  });

  it("replaces the Sheet primitive's bare `transition` on the rendered drawer", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(
      screen.getByRole("button", { name: MOBILE_DRAWER_TRIGGER_LABEL }),
    );

    const drawer = screen.getByRole("dialog");

    // `components/ui/sheet.tsx` ships `transition` (which in Tailwind v4
    // includes box-shadow and backdrop-filter) and `shadow-lg`; `cn` resolves
    // both in favour of the overrides, so the rendered surface is compliant
    // without editing the generated primitive.
    expect(drawer.className).not.toMatch(/(?:^|\s)transition(?:\s|$)/);
    expect(drawer.className).toContain(
      "transition-[transform,translate,opacity]",
    );
    // The open animation itself is translate + opacity keyframes only, so the
    // primitive's own motion is already compliant.
    expect(drawer.className).toContain("slide-in-from-right");
    expect(drawer.className).not.toContain("transition-all");
  });

  it("keeps the border width constant so the two states have identical geometry", () => {
    expect(navbarSurfaceClasses(false)).toContain("border-b");
    expect(navbarSurfaceClasses(true)).toContain("border-b");
    expect(NAVBAR_AT_TOP_CLASS).toContain("border-transparent");
    expect(NAVBAR_SCROLLED_CLASS).toContain("border-border");
  });
});
