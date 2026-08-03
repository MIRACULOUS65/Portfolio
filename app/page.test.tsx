import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Homepage from "./page";

/**
 * `GitHubContributionCard`, `CompetitiveProgrammingSection`, and
 * `BlogPreviewSection` are `async` Server Components that await real network
 * fetches (GitHub contributions; live LeetCode/Codeforces/CodeChef profiles;
 * live Hashnode posts, respectively). React Testing Library's client-side
 * `render` cannot mount an async component directly, so all three are
 * stubbed here with synchronous placeholders — this suite exercises the
 * Homepage's overall section structure, not any of their own fetch/render
 * behaviour, which each has its own dedicated test coverage. `vi.mock` calls
 * are hoisted above imports by Vitest's transform, so this still takes
 * effect before `Homepage` (and the real components it imports) is
 * evaluated.
 */
vi.mock("@/components/hero/GitHubContributionCard", () => ({
  GitHubContributionCard: () => (
    <div data-slot="github-contribution-card" />
  ),
}));

vi.mock(
  "@/components/competitive-programming/CompetitiveProgrammingSection",
  () => ({
    CompetitiveProgrammingSection: () => (
      <section id="competitive-programming" data-slot="section">
        <h2>Competitive Programming</h2>
      </section>
    ),
  }),
);

vi.mock("@/components/blog-preview/BlogPreviewSection", async () => {
  const { Section } = await import("@/components/shared/Section");
  return {
    BlogPreviewSection: () => (
      <Section
        id="blog-content"
        title="Latest Blogs"
        exploreMoreHref="/blog"
        exploreMoreLabel="Explore all blog posts"
      >
        <div />
      </Section>
    ),
  };
});

const EXPLORE_MORE = "[data-slot='explore-more-button']";

/**
 * Requirements 6.1, 6.2, 6.5: the Homepage shell renders all nine `<section>`
 * ids in the mandated fixed order, each wrapped by the shared `Section`
 * (spacing/heading structure), with Explore More wired per Requirement 6.3.
 * Footer itself is asserted in `app/layout.tsx`'s own tests, not here — it is
 * rendered by `RootLayout`, not by this page.
 */
/**
 * jsdom implements no `IntersectionObserver`, and `RevealOnView` (wrapping
 * every section, including HeroSection) constructs one via Framer Motion's
 * `useInView`. This immediate-firing shim is the same minimal pattern
 * `RevealOnView.test.tsx` uses: fire once on `observe`, so mount effects
 * settle synchronously with no dangling async work between tests.
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

describe("<Homepage />", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", ImmediateIntersectionObserver);

    // `HashScrollRestoration` renders inside the page and calls
    // `usePrefersReducedMotion`, which probes `matchMedia` — jsdom ships none.
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

  it("renders the six group section ids in fixed order, each with its nested content ids inside (Requirement 6.1, 6.2)", () => {
    const { container } = render(<Homepage />);

    const sectionIds = Array.from(
      container.querySelectorAll<HTMLElement>("section[id]"),
    ).map((section) => section.id);

    // Six outer groups plus the nested content ids each group wraps, all in
    // document order. Recommendations is now a dedicated route
    // (`app/recommendation/page.tsx`), not a homepage section, so `#recommendation`
    // no longer appears here.
    expect(sectionIds).toEqual([
      "hero",
      "projects",
      "tech-stack",
      "tech-stack-content",
      "competitive-programming",
      "blog",
      "blog-content",
      "certifications",
      "hackathon",
      "hackathons",
      "connect",
      "education",
      "contact",
    ]);
  });

  it("does not render its own <main> landmark (RootLayout owns the page's one main)", () => {
    const { container } = render(<Homepage />);

    expect(container.querySelector("main")).toBeNull();
  });

  it("renders exactly one Explore More button on every preview section other than Hero, Tech Stack, Competitive Programming, Education, and Contact (Requirement 6.3)", () => {
    const { container } = render(<Homepage />);

    const withExploreMore: Record<string, string> = {
      // Featured Projects renders its own Explore More button inside
      // ProjectDetails (task 23.4) rather than via `Section`'s
      // `exploreMoreHref` prop — see `app/page.tsx`'s module doc — so it
      // still has exactly one, just not sourced from `Section`.
      projects: "/projects",
      "blog-content": "/blog",
      certifications: "/certifications",
      hackathons: "/hackathons",
    };
    const withoutExploreMore = [
      "hero",
      "tech-stack-content",
      "competitive-programming",
      "education",
      "contact",
    ];

    for (const [sectionId, href] of Object.entries(withExploreMore)) {
      const section = container.querySelector<HTMLElement>(`#${sectionId}`);
      const links = section?.querySelectorAll(EXPLORE_MORE) ?? [];
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", href);
    }

    for (const sectionId of withoutExploreMore) {
      const section = container.querySelector<HTMLElement>(`#${sectionId}`);
      expect(section?.querySelectorAll(EXPLORE_MORE)).toHaveLength(0);
    }
  });

  it("gives every section its own accessible heading region", () => {
    render(<Homepage />);

    expect(
      screen.getByRole("region", { name: "Featured Projects" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Latest Blogs" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Tech Stack" }),
    ).toBeInTheDocument();
  });
});
