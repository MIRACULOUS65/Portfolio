import { render } from "@testing-library/react";
import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Social, SocialPlatform } from "@/types";

const NUM_RUNS = 100;

/**
 * Property 5 for `components/hero/SocialLinks.tsx`.
 *
 * ## What is generated, and why the module graph is substituted
 *
 * `SocialLinks` reads its dataset via `getSocials()`
 * (`lib/data-access.ts`), which itself reads the static `@/data/socials`
 * module — there is no prop or other seam to inject a dataset through at the
 * call site. Following the pattern established in
 * `lib/certificationPreviewFallback.test.ts` and
 * `lib/previewExploreMoreInvariant.test.tsx`, the generated `Social[]` dataset
 * is substituted into the module graph (`vi.doMock("@/data/socials", ...)` +
 * `vi.resetModules()` + a fresh dynamic `import("@/components/hero/SocialLinks")`),
 * so the component under test is the shipped one rendering over generated
 * data, not a reimplementation of its rule.
 *
 * ## The two clauses asserted, matching the property statement exactly
 *
 * 1. **Always six items, regardless of dataset content**: whether a platform
 *    is missing entirely, duplicated, or every platform is present, exactly
 *    one `[data-slot="social-link"]` renders per entry of the known
 *    `SocialPlatform` union (GitHub, LinkedIn, X, Email, Discord, Portfolio).
 * 2. **Disabled state is the negation of `visible`**: for each known
 *    platform, `data-disabled="false"` if and only if a matching `Social`
 *    entry exists with `visible: true`; a missing entry or a `visible: false`
 *    entry both map to `data-disabled="true"`.
 *
 * Random datasets cover: a random subset of platforms present (including
 * none and all six), random `visible` flags, and platforms with no matching
 * entry at all — the "missing entry" case `SocialLinks.tsx`'s own
 * documentation calls out as equivalent to `visible: false`.
 *
 * **Validates: Requirements 7.5**
 */

/** Every generated-dataset property re-imports the module graph on each run. */
const INJECTION_TEST_TIMEOUT_MS = 30_000;

const SOCIAL_LINK_SELECTOR = "[data-slot='social-link']";

/** The full `SocialPlatform` union, in the fixed order `SocialLinks` walks. */
const KNOWN_PLATFORMS: readonly SocialPlatform[] = [
  "GitHub",
  "LinkedIn",
  "X",
  "Email",
  "Discord",
  "Portfolio",
];

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/**
 * A single generated `Social` entry for a given platform: random `visible`
 * flag, and a `url` shaped appropriately for `Email` (mailto:) vs. every
 * other platform (https:).
 */
function arbitrarySocialFor(platform: SocialPlatform): fc.Arbitrary<Social> {
  return fc.record({
    visible: fc.boolean(),
  }).map(({ visible }) => ({
    id: `social-${platform.toLowerCase()}`,
    platform,
    username: `handle-${platform.toLowerCase()}`,
    url:
      platform === "Email"
        ? "mailto:someone@example.com"
        : `https://example.com/${platform.toLowerCase()}`,
    icon: "Globe",
    visible,
  }));
}

/**
 * A generated `Social[]` dataset: each known platform is independently
 * included (with a random `visible` flag) or omitted entirely, so every run
 * exercises a different mix of present/missing/visible/hidden platforms.
 * Order is shuffled (via `fc.shuffledSubarray`-style construction) so the
 * component's platform-driven render order — not the dataset's order — is
 * what gets exercised.
 */
const arbitrarySocialDataset: fc.Arbitrary<readonly Social[]> = fc
  .tuple(...KNOWN_PLATFORMS.map((platform) =>
    fc.option(arbitrarySocialFor(platform), { nil: undefined }),
  ))
  .chain((entries) => {
    const present = entries.filter(
      (entry): entry is Social => entry !== undefined,
    );
    return fc.shuffledSubarray(present, {
      minLength: present.length,
      maxLength: present.length,
    });
  });

/* -------------------------------------------------------------------------- */
/*                            Module-injection helper                         */
/* -------------------------------------------------------------------------- */

/**
 * Renders the real `SocialLinks` component over a substituted `@/data/socials`
 * dataset: reset the registry, point the module at the generated entries,
 * re-import `SocialLinks` fresh so it (and the `getSocials()` it calls
 * through to) reads the injected data.
 */
async function renderOverDataset(
  dataset: readonly Social[],
): Promise<HTMLElement> {
  vi.resetModules();
  vi.doMock("@/data/socials", () => ({ socials: [...dataset] }));

  const { SocialLinks } = await import("@/components/hero/SocialLinks");

  const { container } = render(<SocialLinks />);
  return container;
}

/* -------------------------------------------------------------------------- */
/*                                 Property 5                                 */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 5: Social buttons always render per
// platform; visibility maps to disabled state
//
// For any generated array of `Social` entries with random `visible` booleans
// (covering all known platforms), the number of rendered social buttons
// equals the number of known platforms regardless of `visible` values, and
// each rendered button's disabled state equals the negation of its entry's
// `visible` flag.
//
// **Validates: Requirements 7.5**
describe("Property 5: social buttons always render per platform; visibility maps to disabled state", () => {
  afterEach(() => {
    vi.doUnmock("@/data/socials");
    vi.resetModules();
  });

  it(
    "renders exactly one item per known platform, with data-disabled the negation of visible (or of a missing entry)",
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitrarySocialDataset, async (dataset) => {
          const container = await renderOverDataset(dataset);

          const items = container.querySelectorAll(SOCIAL_LINK_SELECTOR);

          // Clause 1: exactly one item per known platform, always — regardless
          // of how many (or which) platforms the generated dataset covers.
          expect(items).toHaveLength(KNOWN_PLATFORMS.length);

          const renderedPlatforms = [...items].map(
            (item) => (item as HTMLElement).dataset.platform,
          );
          expect(renderedPlatforms).toEqual(KNOWN_PLATFORMS);

          const byPlatform = new Map(
            dataset.map((entry) => [entry.platform, entry] as const),
          );

          for (const item of items) {
            const element = item as HTMLElement;
            const platform = element.dataset.platform as SocialPlatform;
            const entry = byPlatform.get(platform);
            const expectedActive = entry?.visible === true;

            // Clause 2: disabled state is the negation of visible; a missing
            // entry is treated identically to visible: false.
            expect(element.dataset.disabled).toBe(
              expectedActive ? "false" : "true",
            );

            if (expectedActive) {
              expect(element.tagName).toBe("A");
            } else {
              expect(element.tagName).toBe("BUTTON");
              expect(element).toBeDisabled();
            }
          }
        }),
        { numRuns: NUM_RUNS },
      );
    },
    INJECTION_TEST_TIMEOUT_MS,
  );

  it("holds for the shipped dataset too: six items, each data-disabled matching its entry's visible flag", async () => {
    const { getSocials } = await import("@/lib/data-access");
    const { SocialLinks } = await import("@/components/hero/SocialLinks");

    const socials = getSocials();
    const { container } = render(<SocialLinks />);

    const items = container.querySelectorAll(SOCIAL_LINK_SELECTOR);
    expect(items).toHaveLength(KNOWN_PLATFORMS.length);

    const byPlatform = new Map(
      socials.map((entry) => [entry.platform, entry] as const),
    );

    for (const item of items) {
      const element = item as HTMLElement;
      const platform = element.dataset.platform as SocialPlatform;
      const entry = byPlatform.get(platform);
      const expectedActive = entry?.visible === true;

      expect(element.dataset.disabled).toBe(expectedActive ? "false" : "true");
    }
  });
});
