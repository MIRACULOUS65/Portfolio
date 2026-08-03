import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GitHubContributionCard } from "@/components/hero/GitHubContributionCard";
import { getSocialByPlatform } from "@/lib/data-access";

/**
 * `GitHubContributionCard` is now an `async` Server Component (item D of the
 * hero/homepage redesign): it awaits a real network fetch rather than
 * embedding a third-party `<img>`. React Testing Library's `render` does not
 * itself await a Server Component, so every test here calls the component
 * function directly and awaits the returned element before rendering it —
 * the supported pattern for testing async Server Components without a full
 * Next.js request lifecycle.
 */

const SAMPLE_CONTRIBUTIONS_URL_PATTERN =
  /^https:\/\/github-contributions-api\.jogruber\.de\/v4\//;

function sampleResponse(overrides?: { count?: number }) {
  const count = overrides?.count ?? 3;
  return {
    total: { "2025": count * 2 },
    contributions: [
      { date: "2025-01-05", count, level: 2 as const },
      { date: "2025-01-06", count, level: 2 as const },
    ],
  };
}

function mockFetchOnce(
  response: unknown,
  init: { ok?: boolean } = { ok: true },
) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: init.ok ?? true,
      json: async () => response,
    }),
  );
}

describe("GitHubContributionCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches from the public jogruber contributions API for the GitHub social entry's username", async () => {
    const github = getSocialByPlatform("GitHub");
    expect(github).toBeDefined();

    mockFetchOnce(sampleResponse());

    const element = await GitHubContributionCard({});
    render(element);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(SAMPLE_CONTRIBUTIONS_URL_PATTERN),
      expect.objectContaining({ next: { revalidate: 3600 } }),
    );
    const [calledUrl] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(calledUrl).toContain(github!.username);
  });

  it("renders the grid with an accessible name summarizing the total contributions", async () => {
    mockFetchOnce(sampleResponse({ count: 5 }));

    const element = await GitHubContributionCard({});
    render(element);

    const github = getSocialByPlatform("GitHub");
    expect(
      screen.getByRole("img", {
        name: new RegExp(`${github!.username}'s GitHub contribution graph`),
      }),
    ).toBeInTheDocument();
    // total = 5 + 5 = 10 across the two sample days.
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders nothing when the fetch fails", async () => {
    mockFetchOnce({}, { ok: false });

    const element = await GitHubContributionCard({});
    const { container } = render(element);

    expect(element).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );

    const element = await GitHubContributionCard({});

    expect(element).toBeNull();
  });

  it("renders nothing when the response has no contributions", async () => {
    mockFetchOnce({ total: {}, contributions: [] });

    const element = await GitHubContributionCard({});

    expect(element).toBeNull();
  });
});
