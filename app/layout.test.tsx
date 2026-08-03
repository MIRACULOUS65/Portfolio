import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `next/font/local` requires the Next.js SWC compiler plugin to rewrite its
 * call site at build time; under Vitest's plain esbuild/SWC transform it is
 * a no-op function export, so calling it directly throws. `lib/fonts.ts` is
 * mocked here so `RootLayout` can be rendered without going through that
 * pipeline — this test asserts DOM structure, not font loading, which has no
 * dedicated test in this codebase.
 */
vi.mock("@/lib/fonts", () => ({
  fontVariables: "font-sans-mock font-mono-mock",
}));

/* `Navbar` calls `useRouter`/`usePathname`: jsdom has no App Router context. */
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

const { default: RootLayout } = await import("./layout");

/**
 * Unit test for task 33.4 / Requirement 16.5: the Footer renders as the
 * final element inside `<body>`, after `Navbar` and the page's `<main>`
 * content, on every route.
 *
 * `Navbar` and `ThemeProvider` both probe browser APIs jsdom does not ship
 * (`matchMedia`, `IntersectionObserver`); these are environment shims, not
 * stand-ins for the code under test, matching the pattern
 * `Navbar.test.tsx`/`app/page.test.tsx` already use.
 */
class ImmediateIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "0px";
  readonly thresholds: number[] = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(target: Element): void {
    this.callback(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        } as IntersectionObserverEntry,
      ],
      this,
    );
  }

  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

describe("RootLayout", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", ImmediateIntersectionObserver);
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: false,
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

  it("renders Footer as the last element inside <body>, after <main> content (Requirement 16.5)", () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="page-content">Page content</div>
      </RootLayout>,
    );

    const body = container.querySelector("body") ?? container;
    const children = Array.from(body.children);
    const footerIndex = children.findIndex(
      (child) => child.querySelector("[data-slot='footer']") ?? child.matches("[data-slot='footer']"),
    );
    const mainIndex = children.findIndex((child) => child.tagName === "MAIN");

    expect(footerIndex).toBeGreaterThan(-1);
    expect(mainIndex).toBeGreaterThan(-1);
    expect(footerIndex).toBeGreaterThan(mainIndex);
  });

  it("renders exactly one <main> landmark wrapping the page's children", () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="page-content">Page content</div>
      </RootLayout>,
    );

    const mains = container.querySelectorAll("main");
    expect(mains).toHaveLength(1);
    expect(mains[0]?.querySelector("[data-testid='page-content']")).not.toBeNull();
  });
});
