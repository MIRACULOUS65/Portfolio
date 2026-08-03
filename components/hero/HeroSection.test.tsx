import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

import { HeroSection } from "@/components/hero/HeroSection";
import { getProfile } from "@/lib/data-access";

/**
 * `GitHubContributionCard` is now an `async` Server Component (item D of the
 * hero/homepage redesign) that awaits a real network fetch. React Testing
 * Library's client-side `render` cannot mount an async component directly —
 * only a Server Components renderer can — so it is stubbed here with a
 * synchronous placeholder that still carries the `data-slot` this suite (and
 * `HeroSection` itself) asserts against. `GitHubContributionCard.test.tsx`
 * covers the real component's async fetch/render behaviour directly.
 */
vi.mock("@/components/hero/GitHubContributionCard", () => ({
  GitHubContributionCard: () => (
    <div data-slot="github-contribution-card" />
  ),
}));

/**
 * Unit tests for HeroSection (task 20.12, Requirements 7.1, 7.6, 7.7, 7.8).
 *
 * jsdom ships no `IntersectionObserver`/`matchMedia`; `RevealOnView` and
 * `usePrefersReducedMotion` both probe them. These minimal stubs let the
 * section mount without exercising the animation itself (already covered by
 * `RevealOnView.test.tsx` and `RevealOnView.reveal-once.test.ts`).
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

describe("HeroSection", () => {
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

  it("renders the fixed Profile fields: name and bio, plus a rotating role pill", () => {
    render(<HeroSection />);

    const profile = getProfile();

    expect(
      screen.getByRole("heading", { level: 1, name: profile.name }),
    ).toBeInTheDocument();
    // The role pill no longer renders `profile.role` as a static string — it
    // now cycles through short phrases via `RotatingText`. Assert the
    // rotating-text slot renders the first phrase rather than the removed
    // static role text.
    expect(
      document.querySelector("[data-slot='rotating-text']"),
    ).not.toBeNull();
    // Bio is now rendered with emphasis spans around key tech terms
    // (HeroSection's `renderBioWithEmphasis`), so it is asserted by combined
    // text content rather than a single text node.
    const bioParagraph = screen.getByText((_, element) =>
      element?.tagName.toLowerCase() === "p" &&
      element.textContent === profile.bio,
    );
    expect(bioParagraph).toBeInTheDocument();
  });

  it("renders the resume download and contact CTA actions", () => {
    render(<HeroSection />);

    const profile = getProfile();

    const resumeLink = screen.getByRole("link", {
      name: /download resume/i,
    });
    expect(resumeLink).toHaveAttribute("href", profile.resume);
    expect(resumeLink).toHaveAttribute("download");

    const contactLink = screen.getByRole("link", { name: /get in touch/i });
    expect(contactLink).toHaveAttribute("href", `mailto:${profile.email}`);
  });

  it("renders exactly one <section id='hero'> landmark with no nested <main>", () => {
    const { container } = render(<HeroSection />);

    const sections = container.querySelectorAll("section#hero");
    expect(sections).toHaveLength(1);
    expect(container.querySelector("main")).toBeNull();
  });

  it("composes SocialLinks, GitHubContributionCard, and CurrentActivityCard", () => {
    const { container } = render(<HeroSection />);

    expect(
      container.querySelector("[data-slot='social-links']"),
    ).not.toBeNull();
    expect(
      container.querySelector("[data-slot='github-contribution-card']"),
    ).not.toBeNull();
    expect(
      container.querySelector("[data-slot='current-activity-card']"),
    ).not.toBeNull();
  });

  it("renders a single narrow column at every breakpoint, with no two-column grid split", () => {
    const { container } = render(<HeroSection />);

    const column = container.querySelector("[data-slot='hero-column']");
    expect(column).not.toBeNull();
    expect(column?.className).toContain("max-w-2xl");
    expect(column?.className).not.toContain("lg:grid-cols-2");
    // No two-column grid anywhere in the section — Hero is one flex column
    // at every breakpoint now (reference design has no desktop grid split).
    expect(container.querySelector(".grid")).toBeNull();
  });
});
