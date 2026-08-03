import { render } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  ERROR_FALLBACK_COPY,
  HOME_HREF,
  isHomeHref,
  resolveErrorCopy,
  resolveStateLinks,
  type StateAction,
} from "@/components/shared/stateFallback";

const NUM_RUNS = 100;

/**
 * Per-test timeout for the runs that `render` a component, applied as `it`'s
 * third argument so the 5s default still guards every other test in the repo
 * (see the timeout note in `vitest.config.ts`).
 *
 * Mounting a React tree 100 times inside one `it` is ~0.5s of honest work on an
 * idle machine; the margin under the default is thin enough to lose when
 * `npm test`'s parallel workers compete for CPU. Same treatment as the
 * provider-mounting property in `components/theme/themeResolution.test.tsx`. The
 * pure properties in this file keep the tight default.
 */
const PROPERTY_TEST_TIMEOUT_MS = 30_000;

/**
 * Hrefs that have historically been the risky ones: aliases of the Homepage,
 * blank-ish values, and ordinary in-app routes. Mixed with unconstrained
 * strings so the generator covers both the interesting boundary shapes and
 * arbitrary junk.
 */
const arbitraryHref = fc.oneof(
  fc.constantFrom(
    HOME_HREF,
    "",
    "   ",
    "/",
    "//",
    "///",
    "/?ref=empty",
    "/#top",
    "#top",
    "?q=",
    "/projects",
    "/blog/some-post",
    "/projects?category=web",
  ),
  fc.string(),
  fc.webPath(),
);

const arbitraryLabel = fc.oneof(
  fc.constantFrom("", "   ", "Browse all projects", "Read the blog"),
  fc.string(),
);

/** Well-typed actions, including blank and Homepage-pointing ones. */
const arbitraryAction: fc.Arbitrary<StateAction> = fc.record({
  href: arbitraryHref,
  label: arbitraryLabel,
});

/**
 * Actions that violate the declared types at runtime (JS callers, JSON, or a
 * future refactor). `resolveStateLinks` guards against these, so the property
 * must cover them.
 */
const arbitraryMalformedAction = fc
  .record({
    href: fc.oneof(fc.constant(undefined), fc.constant(null), fc.integer()),
    label: fc.oneof(fc.constant(undefined), fc.constant(null), fc.integer()),
  })
  .map((value) => value as unknown as StateAction);

/** Any action shape a caller could pass, plus "no action at all". */
const arbitraryMaybeAction = fc.oneof(
  fc.constant(undefined),
  arbitraryAction,
  arbitraryMalformedAction,
);

/**
 * A token that cannot occur inside `ERROR_FALLBACK_COPY`, so finding it in the
 * rendered output is unambiguous proof of leakage rather than a coincidental
 * substring match.
 */
const arbitrarySecret = fc
  .string({
    unit: fc.constantFrom(..."0123456789ABCDEF"),
    minLength: 8,
    maxLength: 24,
  })
  .map((hex) => `LEAK_${hex}_9F`);

/** Thrown values a Next.js `error.tsx` boundary can realistically receive. */
const arbitraryThrown = (secret: string) =>
  fc.oneof(
    fc.constant(secret).map((message) => {
      const error = new Error(message);
      error.stack = `Error: ${message}\n    at renderRoute (/app/${secret}/page.tsx:12:9)`;
      return error as unknown;
    }),
    fc.constant(secret).map((message) => {
      const error = new Error(message) as Error & { digest?: string };
      error.digest = secret;
      return error as unknown;
    }),
    fc.constant(secret as unknown),
    fc.constant({ message: secret } as unknown),
    fc.constant(undefined as unknown),
    fc.constant(null as unknown),
  );

const arbitraryTitleAs = fc.constantFrom<"h1" | "h2" | "h3">("h1", "h2", "h3");

function homeAnchors(container: HTMLElement): HTMLAnchorElement[] {
  return Array.from(container.querySelectorAll("a")).filter((anchor) =>
    isHomeHref(anchor.getAttribute("href") ?? ""),
  );
}

// Feature: developer-portfolio, Property 26: Error and empty states never leak
// raw errors and always link home
//
// For any thrown error with randomly generated message/stack content, the
// rendered `ErrorState` output never contains the raw error's message or stack
// text, only the fixed friendly copy, and contains exactly one link to `/`. The
// same "exactly one link to `/`" guarantee holds for `EmptyState` renders.
//
// **Validates: Requirements 28.2, 28.3**
describe("Property 26: error and empty states never leak raw errors and always link home", () => {
  it("resolveStateLinks always returns exactly one Homepage link", () => {
    fc.assert(
      fc.property(arbitraryMaybeAction, (action) => {
        const links = resolveStateLinks(action);

        const homeLinks = links.filter((link) => link.isHome);
        expect(homeLinks).toHaveLength(1);
        expect(isHomeHref(homeLinks[0].href)).toBe(true);
        expect(homeLinks[0].href).toBe(HOME_HREF);
        expect(homeLinks[0].label.trim()).not.toBe("");

        // No non-home link may sneak in as a second route to the Homepage,
        // and every rendered href/label must be non-blank.
        for (const link of links.filter((link) => !link.isHome)) {
          expect(isHomeHref(link.href)).toBe(false);
          expect(link.href.trim()).not.toBe("");
          expect(link.label.trim()).not.toBe("");
        }

        // Hrefs are unique, so components can key on them safely.
        expect(new Set(links.map((link) => link.href)).size).toBe(links.length);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("resolveErrorCopy returns the fixed copy and never any part of the thrown value", () => {
    fc.assert(
      fc.property(
        arbitrarySecret.chain((secret) =>
          fc.tuple(fc.constant(secret), arbitraryThrown(secret)),
        ),
        ([secret, thrown]) => {
          const copy = resolveErrorCopy(thrown);

          expect(copy).toEqual({
            title: ERROR_FALLBACK_COPY.title,
            message: ERROR_FALLBACK_COPY.message,
          });

          const text = `${copy.title} ${copy.message}`;
          expect(text).not.toContain(secret);
          if (thrown instanceof Error) {
            expect(text).not.toContain(thrown.message);
            expect(text).not.toContain(thrown.stack ?? secret);
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it(
    "EmptyState renders exactly one anchor pointing at the Homepage",
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          arbitraryMaybeAction,
          arbitraryTitleAs,
          (title, message, action, titleAs) => {
            const { container, unmount } = render(
              <EmptyState
                title={title}
                message={message}
                action={action}
                titleAs={titleAs}
              />,
            );

            try {
              const anchors = homeAnchors(container);
              expect(anchors).toHaveLength(1);
              expect(anchors[0].getAttribute("href")).toBe(HOME_HREF);
            } finally {
              unmount();
            }
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    PROPERTY_TEST_TIMEOUT_MS,
  );

  it(
    "ErrorState renders exactly one Homepage anchor and no raw error text",
    () => {
      fc.assert(
        fc.property(
          arbitrarySecret.chain((secret) =>
            fc.tuple(fc.constant(secret), arbitraryThrown(secret)),
          ),
          arbitraryMaybeAction,
          arbitraryTitleAs,
          fc.boolean(),
          ([secret, thrown], action, titleAs, useExplicitCopy) => {
            // Both realistic call sites: a boundary that forwards the resolved
            // copy, and a caller that renders the defaults.
            const copy = useExplicitCopy ? resolveErrorCopy(thrown) : undefined;

            const { container, unmount } = render(
              <ErrorState
                title={copy?.title}
                message={copy?.message}
                action={action}
                titleAs={titleAs}
              />,
            );

            try {
              const anchors = homeAnchors(container);
              expect(anchors).toHaveLength(1);
              expect(anchors[0].getAttribute("href")).toBe(HOME_HREF);

              const rendered = `${container.textContent ?? ""} ${container.innerHTML}`;
              expect(rendered).not.toContain(secret);
              if (thrown instanceof Error) {
                expect(rendered).not.toContain(thrown.message);
                expect(rendered).not.toContain(thrown.stack ?? secret);
              }
              expect(container.textContent).toContain(
                ERROR_FALLBACK_COPY.title,
              );
              expect(container.textContent).toContain(
                ERROR_FALLBACK_COPY.message,
              );
            } finally {
              unmount();
            }
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    PROPERTY_TEST_TIMEOUT_MS,
  );
});
