import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { navigation } from "@/data/navigation";
import type { NavigationItem } from "@/types";

import {
  ACTIVE_NAV_LINK_ARIA_CURRENT,
  ActiveSectionIndicator,
  isActiveNavigationItem,
  navLinkStateProps,
  resolveActiveNavigationItemId,
  useActiveNavigationItemId,
} from "./ActiveSectionIndicator";

/** The links the Navbar actually renders: visible only, ordered (Requirement 5.1). */
const visibleItems: readonly NavigationItem[] = navigation
  .filter((item) => item.visible)
  .sort((a, b) => a.order - b.order);

/** Every homepage group section id — the five full-viewport groups. */
const allSectionIds: readonly string[] = navigation.map(
  (item) => item.sectionId,
);

/**
 * Nested content ids that exist in the DOM but carry no Navbar entry of their
 * own (they live inside a group's outer `<section>`, e.g. `#contact` inside
 * `#connect`). All five *groups* now ship `visible: true`, so this list is
 * used to test the "section without a link" behaviour instead of a hidden
 * top-level item.
 */
const nestedContentSectionIds: readonly string[] = [
  "competitive-programming",
  "certifications",
  "hackathons",
  "education",
  "contact",
];

/**
 * Stand-in for `Navbar` (task 17.5): renders the visible link list exactly the
 * way the module doc prescribes, so the DOM-level "at most one highlighted link"
 * invariant is exercised against the real composition rather than a single
 * indicator in isolation.
 */
function NavLinkList({ activeItemId }: { activeItemId: string | null }) {
  return (
    <nav aria-label="Main">
      {visibleItems.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className="inline-flex flex-col items-center"
          {...navLinkStateProps(item, activeItemId)}
        >
          {item.label}
          <ActiveSectionIndicator item={item} activeItemId={activeItemId} />
        </a>
      ))}
    </nav>
  );
}

function countHighlighted(container: HTMLElement): {
  indicators: number;
  anchors: number;
} {
  return {
    indicators: container.querySelectorAll(
      '[data-slot="active-section-indicator"][data-active="true"]',
    ).length,
    anchors: container.querySelectorAll('a[data-active="true"]').length,
  };
}

describe("resolveActiveNavigationItemId", () => {
  it("names the matching visible link for every section that has one", () => {
    for (const item of visibleItems) {
      expect(resolveActiveNavigationItemId(visibleItems, item.sectionId)).toBe(
        item.id,
      );
    }
  });

  it("names no link for a nested content section with no Navbar entry of its own", () => {
    // Requirement 5.5: `#contact`, `#education`, `#competitive-programming`,
    // and `#certifications` are real nested sections with no Navbar link —
    // only their outer group (`#connect`, `#tech-stack`, `#blog`) does.
    expect(nestedContentSectionIds.length).toBeGreaterThan(0);

    for (const sectionId of nestedContentSectionIds) {
      expect(resolveActiveNavigationItemId(visibleItems, sectionId)).toBeNull();
    }
  });

  it("names no link when there is no active section", () => {
    // `null` on a dedicated page and before the observer's first callback.
    expect(resolveActiveNavigationItemId(visibleItems, null)).toBeNull();
    expect(resolveActiveNavigationItemId(visibleItems, undefined)).toBeNull();
    expect(resolveActiveNavigationItemId(visibleItems, "")).toBeNull();
    expect(
      resolveActiveNavigationItemId(visibleItems, "not-a-section"),
    ).toBeNull();
    expect(resolveActiveNavigationItemId([], "projects")).toBeNull();
  });

  it("never names a hidden item even when it is the only match", () => {
    const hidden: NavigationItem = {
      id: "nav-contact",
      label: "Contact",
      href: "#contact",
      sectionId: "contact",
      order: 9,
      visible: false,
    };

    expect(resolveActiveNavigationItemId([hidden], "contact")).toBeNull();
  });

  it("picks one deterministic winner when two links share a section", () => {
    const first: NavigationItem = {
      id: "nav-projects-b",
      label: "Work",
      href: "#projects",
      sectionId: "projects",
      order: 5,
      visible: true,
    };
    const second: NavigationItem = {
      id: "nav-projects-a",
      label: "Projects",
      href: "#projects",
      sectionId: "projects",
      order: 2,
      visible: true,
    };

    // Lowest `order` wins, regardless of array order.
    expect(resolveActiveNavigationItemId([first, second], "projects")).toBe(
      "nav-projects-a",
    );
    expect(resolveActiveNavigationItemId([second, first], "projects")).toBe(
      "nav-projects-a",
    );

    // Equal `order` still yields exactly one winner: smallest id.
    const tied = [
      { ...first, order: 2 },
      { ...second, order: 2 },
    ];
    expect(resolveActiveNavigationItemId(tied, "projects")).toBe(
      "nav-projects-a",
    );
  });
});

describe("navLinkStateProps", () => {
  it("marks the active link and nothing else", () => {
    const [home, projects] = visibleItems;

    expect(navLinkStateProps(projects, projects.id)).toEqual({
      "data-active": "true",
      "aria-current": ACTIVE_NAV_LINK_ARIA_CURRENT,
    });
    // Omitted rather than `false`, so `[data-active]` selects only the active link.
    expect(navLinkStateProps(home, projects.id)).toEqual({});
    expect(navLinkStateProps(home, null)).toEqual({});
  });

  it("agrees with isActiveNavigationItem", () => {
    for (const item of visibleItems) {
      const active = isActiveNavigationItem(item, "nav-blog");
      expect(navLinkStateProps(item, "nav-blog")["data-active"]).toBe(
        active ? "true" : undefined,
      );
    }
  });
});

describe("ActiveSectionIndicator", () => {
  it("highlights at most one link for every possible active section", () => {
    // Requirement 5.5 — exhaustive over the finite input space: all nine
    // homepage sections, an unknown id, and "no active section".
    for (const sectionId of [...allSectionIds, "not-a-section", null]) {
      const activeItemId = resolveActiveNavigationItemId(
        visibleItems,
        sectionId,
      );
      const { container, unmount } = render(
        <NavLinkList activeItemId={activeItemId} />,
      );

      const { indicators, anchors } = countHighlighted(container);
      const expected = activeItemId === null ? 0 : 1;

      expect(indicators).toBe(expected);
      expect(anchors).toBe(expected);
      expect(
        container.querySelectorAll(
          `[aria-current="${ACTIVE_NAV_LINK_ARIA_CURRENT}"]`,
        ),
      ).toHaveLength(expected);
      // One indicator per link, always — only its state changes.
      expect(
        container.querySelectorAll('[data-slot="active-section-indicator"]'),
      ).toHaveLength(visibleItems.length);

      unmount();
    }
  });

  it("highlights nothing while a nested section without its own link is in view", () => {
    const activeItemId = resolveActiveNavigationItemId(visibleItems, "contact");
    const { container } = render(<NavLinkList activeItemId={activeItemId} />);

    expect(countHighlighted(container)).toEqual({ indicators: 0, anchors: 0 });
    // No fallback to a neighbouring link: Connect is the group `#contact`
    // lives inside, but it must stay unhighlighted since `#contact` itself
    // does not match any nav item's `sectionId`.
    expect(screen.getByRole("link", { name: "Connect" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("conveys the current section non-visually on the active link", () => {
    const { container } = render(<NavLinkList activeItemId="nav-blog" />);

    const active = screen.getByRole("link", { name: "Blog" });
    expect(active).toHaveAttribute(
      "aria-current",
      ACTIVE_NAV_LINK_ARIA_CURRENT,
    );
    // The underline is decorative; the label remains the accessible name.
    const indicator = active.querySelector(
      '[data-slot="active-section-indicator"]',
    );
    expect(indicator?.getAttribute("aria-hidden")).toBe("true");
    expect(active.textContent).toBe("Blog");
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("animates transform and opacity only, and not under reduced motion", () => {
    const [item] = visibleItems;
    const { container } = render(
      <ActiveSectionIndicator item={item} activeItemId={item.id} />,
    );

    const className =
      container.querySelector<HTMLSpanElement>("span")?.className ?? "";

    // Requirement 24.4: enumerated transition list, never `transition-all`.
    expect(className).toContain(
      "transition-[transform,translate,scale,opacity]",
    );
    expect(className).not.toContain("transition-all");
    expect(className).toContain("scale-x-100");
    expect(className).toContain("opacity-100");
    // Requirement 24.5: the highlight stays, its animation goes.
    expect(className).toContain("motion-reduce:transition-none");
    // Fixed box in both states, so activation cannot shift Navbar geometry.
    expect(className).toContain("h-0.5");
  });

  it("hides the indicator for an inactive link without removing its box", () => {
    const [item] = visibleItems;
    const { container } = render(
      <ActiveSectionIndicator item={item} activeItemId={null} />,
    );

    const indicator = container.querySelector<HTMLSpanElement>("span");
    expect(indicator?.getAttribute("data-active")).toBeNull();
    expect(indicator?.className).toContain("scale-x-0");
    expect(indicator?.className).toContain("opacity-0");
    expect(indicator?.className).toContain("h-0.5");
  });

  it("lets caller utilities override placement", () => {
    const [item] = visibleItems;
    const { container } = render(
      <ActiveSectionIndicator
        item={item}
        activeItemId={null}
        className="absolute inset-x-1 -bottom-1"
      />,
    );

    expect(container.querySelector("span")?.className).toContain("inset-x-1");
  });
});

/* -------------------------------------------------------------------------- */
/* useActiveNavigationItemId                                                  */
/* -------------------------------------------------------------------------- */

interface EmittedEntry {
  id: string;
  ratio: number;
}

/**
 * jsdom ships no `IntersectionObserver`, so the hook path needs a shim whose
 * callback can be fired on demand. Local rather than imported from
 * `hooks/useActiveSection.test.ts` to keep the two files independent.
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

  emit(entries: readonly EmittedEntry[]): void {
    this.callback(
      entries.map(
        ({ id, ratio }) =>
          ({
            target: document.getElementById(id) as Element,
            isIntersecting: ratio > 0,
            intersectionRatio: ratio,
          }) as IntersectionObserverEntry,
      ),
      this,
    );
  }
}

function renderHomepageSections(): void {
  document.body.innerHTML = [...allSectionIds, ...nestedContentSectionIds]
    .map((sectionId) => `<section id="${sectionId}"></section>`)
    .join("");
}

describe("useActiveNavigationItemId", () => {
  beforeEach(() => {
    ControllableIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", ControllableIntersectionObserver);
    renderHomepageSections();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("creates a single observer and starts with no highlight", () => {
    const { result } = renderHook(() =>
      useActiveNavigationItemId(visibleItems),
    );

    expect(ControllableIntersectionObserver.instances).toHaveLength(1);
    expect(result.current).toBeNull();
  });

  it("names the link of the section in view", () => {
    const { result } = renderHook(() =>
      useActiveNavigationItemId(visibleItems),
    );
    const [observer] = ControllableIntersectionObserver.instances;

    act(() => {
      observer.emit([{ id: "projects", ratio: 0.9 }]);
    });

    expect(result.current).toBe("nav-projects");
  });

  it("names no link once a nested section without its own link is in view", () => {
    const { result } = renderHook(() =>
      useActiveNavigationItemId(visibleItems),
    );
    const [observer] = ControllableIntersectionObserver.instances;

    act(() => {
      observer.emit([{ id: "connect", ratio: 0.8 }]);
    });
    expect(result.current).toBe("nav-connect");

    act(() => {
      observer.emit([
        { id: "connect", ratio: 0 },
        { id: "contact", ratio: 1 },
      ]);
    });

    // Requirement 5.5: highlight nothing rather than keep Connect lit —
    // `#contact` is nested inside `#connect` but has no Navbar entry of its
    // own.
    expect(result.current).toBeNull();
  });
});
