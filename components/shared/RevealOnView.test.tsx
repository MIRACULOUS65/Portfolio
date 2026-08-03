import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_REVEAL_MOTION,
  INITIAL_REVEAL_STATE,
  REDUCED_REVEAL_MOTION,
  REVEAL_VARIANTS,
  REVEAL_VIEWPORT,
  RevealOnView,
  nextRevealState,
  resolveRevealMotion,
} from "./RevealOnView";

/**
 * jsdom implements neither `IntersectionObserver` nor `matchMedia`, and Framer
 * Motion's `useInView` constructs an observer inside an effect. These two shims
 * are the minimum needed to render an animated component under `jsdom`; later
 * animation tests can copy them (or lift them into `vitest.setup.ts` once more
 * than one file needs them).
 *
 * `observe()` immediately reports an intersection so the reveal path runs;
 * `matchMedia` reports whatever `reduceMotion` is set to for the current test.
 */
let reduceMotion = false;
const observerInstances: Array<{ disconnected: boolean }> = [];

class ImmediateIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];

  private readonly record = { disconnected: false };

  constructor(private readonly callback: IntersectionObserverCallback) {
    observerInstances.push(this.record);
  }

  observe(target: Element): void {
    this.callback(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
          time: 0,
        } as IntersectionObserverEntry,
      ],
      this,
    );
  }

  unobserve(): void {}

  disconnect(): void {
    this.record.disconnected = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeEach(() => {
  reduceMotion = false;
  observerInstances.length = 0;

  vi.stubGlobal("IntersectionObserver", ImmediateIntersectionObserver);
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
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("nextRevealState", () => {
  it("starts hidden and stays hidden until the element intersects", () => {
    expect(INITIAL_REVEAL_STATE).toBe("hidden");
    expect(nextRevealState("hidden", false)).toBe("hidden");
  });

  it("reveals on the first intersection", () => {
    expect(nextRevealState("hidden", true)).toBe("visible");
  });

  it("never returns to hidden once revealed", () => {
    expect(nextRevealState("visible", false)).toBe("visible");
    expect(nextRevealState("visible", true)).toBe("visible");
  });
});

describe("reveal motion configuration", () => {
  it("observes the viewport only once", () => {
    expect(REVEAL_VIEWPORT.once).toBe(true);
  });

  it("uses the fade-and-rise variants for default motion", () => {
    expect(REVEAL_VARIANTS).toEqual({
      hidden: { opacity: 0, y: 16 },
      visible: { opacity: 1, y: 0 },
    });
    expect(resolveRevealMotion(false)).toBe(DEFAULT_REVEAL_MOTION);
  });

  it("degrades to an instant opacity change under reduced motion", () => {
    expect(resolveRevealMotion(true)).toBe(REDUCED_REVEAL_MOTION);
    expect(REDUCED_REVEAL_MOTION.variants).toEqual({
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    });
    expect(REDUCED_REVEAL_MOTION.transition).toEqual({ duration: 0 });
  });
});

describe("<RevealOnView />", () => {
  it("renders its children and reveals them when they enter the viewport", async () => {
    render(
      <RevealOnView id="about" className="mt-8">
        <p>Revealed content</p>
      </RevealOnView>,
    );

    const child = await screen.findByText("Revealed content");
    const wrapper = child.parentElement;

    expect(wrapper).toHaveAttribute("id", "about");
    expect(wrapper).toHaveClass("mt-8");
    expect(wrapper).toHaveAttribute("data-reveal-state", "visible");
  });

  it("still reveals under reduced motion", async () => {
    reduceMotion = true;

    render(
      <RevealOnView>
        <p>Reduced motion content</p>
      </RevealOnView>,
    );

    const child = await screen.findByText("Reduced motion content");
    expect(child.parentElement).toHaveAttribute("data-reveal-state", "visible");
  });
});
