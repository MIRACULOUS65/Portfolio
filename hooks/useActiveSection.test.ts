import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACTIVE_SECTION_ROOT_MARGIN,
  ACTIVE_SECTION_THRESHOLDS,
  resolveActiveSection,
  resolveActiveSectionFromEntries,
  useActiveSection,
  type ActiveSectionCandidate,
} from "./useActiveSection";

/** Builds a candidate; every field has a "not visible" default. */
function candidate(
  overrides: Partial<ActiveSectionCandidate> & { sectionId: string },
): ActiveSectionCandidate {
  return {
    intersectionRatio: 0,
    isIntersecting: false,
    documentOrder: 0,
    ...overrides,
  };
}

describe("resolveActiveSection", () => {
  it("returns the most visible section", () => {
    const active = resolveActiveSection([
      candidate({
        sectionId: "hero",
        documentOrder: 0,
        isIntersecting: true,
        intersectionRatio: 0.2,
      }),
      candidate({
        sectionId: "projects",
        documentOrder: 1,
        isIntersecting: true,
        intersectionRatio: 0.9,
      }),
      candidate({
        sectionId: "blog",
        documentOrder: 2,
        isIntersecting: true,
        intersectionRatio: 0.4,
      }),
    ]);

    expect(active).toBe("projects");
  });

  it("prefers a qualifying section over a higher ratio that is not intersecting", () => {
    const active = resolveActiveSection([
      candidate({
        sectionId: "hero",
        documentOrder: 0,
        intersectionRatio: 0.9,
      }),
      candidate({
        sectionId: "projects",
        documentOrder: 1,
        isIntersecting: true,
        intersectionRatio: 0.1,
      }),
    ]);

    expect(active).toBe("projects");
  });

  it("treats an intersecting section with a zero ratio as not visible", () => {
    const active = resolveActiveSection([
      candidate({
        sectionId: "hero",
        documentOrder: 0,
        isIntersecting: true,
        intersectionRatio: 0,
      }),
      candidate({
        sectionId: "projects",
        documentOrder: 1,
        isIntersecting: true,
        intersectionRatio: 0.05,
      }),
    ]);

    expect(active).toBe("projects");
  });

  it("keeps the previously active section when two are equally visible", () => {
    const candidates = [
      candidate({
        sectionId: "hero",
        documentOrder: 0,
        isIntersecting: true,
        intersectionRatio: 0.5,
      }),
      candidate({
        sectionId: "projects",
        documentOrder: 1,
        isIntersecting: true,
        intersectionRatio: 0.5,
      }),
    ];

    expect(resolveActiveSection(candidates, "projects")).toBe("projects");
    expect(resolveActiveSection(candidates, "hero")).toBe("hero");
  });

  it("falls back to the topmost section for a tie with no previous highlight", () => {
    const active = resolveActiveSection([
      candidate({
        sectionId: "projects",
        documentOrder: 1,
        isIntersecting: true,
        intersectionRatio: 0.5,
      }),
      candidate({
        sectionId: "hero",
        documentOrder: 0,
        isIntersecting: true,
        intersectionRatio: 0.5,
      }),
    ]);

    expect(active).toBe("hero");
  });

  it("holds the previous highlight while no section intersects", () => {
    const active = resolveActiveSection(
      [
        candidate({ sectionId: "hero", documentOrder: 0 }),
        candidate({ sectionId: "projects", documentOrder: 1 }),
      ],
      "projects",
    );

    expect(active).toBe("projects");
  });

  it("ignores a non-finite ratio instead of letting it win", () => {
    const active = resolveActiveSection([
      candidate({
        sectionId: "hero",
        documentOrder: 0,
        isIntersecting: true,
        intersectionRatio: Number.NaN,
      }),
      candidate({
        sectionId: "projects",
        documentOrder: 1,
        isIntersecting: true,
        intersectionRatio: 0.1,
      }),
    ]);

    expect(active).toBe("projects");
  });

  it("returns null only when nothing is observed and nothing was active", () => {
    expect(resolveActiveSection([])).toBeNull();
    expect(resolveActiveSection([], "blog")).toBe("blog");
  });

  it("can report a section that has no visible Navbar link", () => {
    const active = resolveActiveSection([
      candidate({
        sectionId: "hackathons",
        documentOrder: 6,
        isIntersecting: true,
        intersectionRatio: 0.2,
      }),
      candidate({
        sectionId: "contact",
        documentOrder: 8,
        isIntersecting: true,
        intersectionRatio: 0.8,
      }),
    ]);

    expect(active).toBe("contact");
  });
});

describe("resolveActiveSectionFromEntries", () => {
  it("resolves from observer-shaped entries, using array index as document order", () => {
    const active = resolveActiveSectionFromEntries([
      { target: { id: "hero" }, isIntersecting: true, intersectionRatio: 0.3 },
      {
        target: { id: "projects" },
        isIntersecting: true,
        intersectionRatio: 0.3,
      },
    ]);

    expect(active).toBe("hero");
  });

  it("drops entries whose target has no id", () => {
    const active = resolveActiveSectionFromEntries([
      { target: { id: "" }, isIntersecting: true, intersectionRatio: 1 },
      { target: { id: "blog" }, isIntersecting: true, intersectionRatio: 0.2 },
    ]);

    expect(active).toBe("blog");
  });

  it("collapses repeated ids to the latest visibility", () => {
    const active = resolveActiveSectionFromEntries([
      { target: { id: "hero" }, isIntersecting: true, intersectionRatio: 0.9 },
      {
        target: { id: "projects" },
        isIntersecting: true,
        intersectionRatio: 0.5,
      },
      { target: { id: "hero" }, isIntersecting: false, intersectionRatio: 0 },
    ]);

    expect(active).toBe("projects");
  });
});

/**
 * jsdom implements no `IntersectionObserver`. This shim records the config and
 * observed targets and lets a test drive the callback by hand — the controllable
 * counterpart of the auto-firing shim at the top of
 * `components/shared/RevealOnView.test.tsx`.
 */
class ControllableIntersectionObserver implements IntersectionObserver {
  static instances: ControllableIntersectionObserver[] = [];

  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  readonly observed: Element[] = [];
  disconnected = false;

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

  disconnect(): void {
    this.disconnected = true;
  }

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

function renderSections(ids: string[]): void {
  document.body.innerHTML = ids
    .map((id) => `<section id="${id}" data-slot="section"></section>`)
    .join("");
}

describe("useActiveSection", () => {
  beforeEach(() => {
    ControllableIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", ControllableIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("starts with no active section and reports the one the observer favours", () => {
    renderSections(["hero", "projects", "blog"]);

    const { result } = renderHook(() => useActiveSection());
    expect(result.current).toBeNull();

    const [observer] = ControllableIntersectionObserver.instances;
    act(() => {
      observer.emit([
        { id: "hero", ratio: 0.1 },
        { id: "projects", ratio: 0.8 },
      ]);
    });

    expect(result.current).toBe("projects");
  });

  it("uses one observer for every section, with the specified band config", () => {
    renderSections(["hero", "projects", "blog"]);

    renderHook(() => useActiveSection());

    expect(ControllableIntersectionObserver.instances).toHaveLength(1);
    const [observer] = ControllableIntersectionObserver.instances;
    expect(observer.observed).toHaveLength(3);
    expect(observer.rootMargin).toBe(ACTIVE_SECTION_ROOT_MARGIN);
    expect(observer.thresholds).toEqual([...ACTIVE_SECTION_THRESHOLDS]);
  });

  it("ranks against sections the callback did not mention", () => {
    renderSections(["hero", "projects"]);

    const { result } = renderHook(() => useActiveSection());
    const [observer] = ControllableIntersectionObserver.instances;

    act(() => {
      observer.emit([{ id: "hero", ratio: 0.9 }]);
    });
    expect(result.current).toBe("hero");

    // Only `projects` changed; `hero` must still be known to have left the band.
    act(() => {
      observer.emit([
        { id: "hero", ratio: 0 },
        { id: "projects", ratio: 0.6 },
      ]);
    });
    expect(result.current).toBe("projects");
  });

  it("does not observe or crash when the page has no sections", () => {
    document.body.innerHTML = "<main></main>";

    const { result } = renderHook(() => useActiveSection());

    expect(result.current).toBeNull();
    expect(ControllableIntersectionObserver.instances).toHaveLength(0);
  });

  it("disconnects the observer on unmount", () => {
    renderSections(["hero"]);

    const { unmount } = renderHook(() => useActiveSection());
    const [observer] = ControllableIntersectionObserver.instances;

    unmount();

    expect(observer.disconnected).toBe(true);
  });

  it("returns null without IntersectionObserver support", () => {
    renderSections(["hero"]);
    vi.stubGlobal("IntersectionObserver", undefined);

    const { result } = renderHook(() => useActiveSection());

    expect(result.current).toBeNull();
  });
});
