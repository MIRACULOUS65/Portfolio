import { act, cleanup, renderHook } from "@testing-library/react";
import fc from "fast-check";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  isTheme,
  resolveTheme,
  type Theme,
} from "@/components/theme/theme";
import { useTheme } from "@/hooks/useTheme";

const NUM_RUNS = 100;

/**
 * Per-test timeout for the runs that mount the real `ThemeProvider`, applied as
 * `it`'s third argument so the 5s default still guards every other test in the
 * repo (see the timeout note in `vitest.config.ts`).
 *
 * Those tests drive `next-themes` through real mount effects 100 times — the
 * remount case does it twice per run, because a second mount is what proves the
 * selection survives a reload rather than merely living in memory. That is
 * ~1-4s of honest work on an idle machine, so under `npm test`'s parallel
 * workers it can cross 5s and fail as a timeout while asserting nothing wrong.
 * The headroom here is for CPU contention, not for a slow property: shrinking
 * `NUM_RUNS` or dropping the remount would trade a real guarantee for speed.
 */
const PROPERTY_TEST_TIMEOUT_MS = 30_000;

/**
 * jsdom ships no `matchMedia`, and `next-themes` probes it on mount even with
 * `enableSystem={false}`. Environment shim only — a browser API jsdom omits,
 * not a stand-in for the code under test. It reports "no preference", which is
 * exactly what a system-preference-agnostic provider must ignore.
 */
const originalMatchMedia = window.matchMedia;

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
});

afterAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
});

afterEach(() => {
  resetThemeEnvironment();
});

/**
 * Both halves of the persisted state `next-themes` touches: the storage key and
 * the class on `<html>`.
 *
 * Called at the start of *every* generated run, not just once per `it`. Without
 * this, run _n_'s stored selection is still present when run _n+1_ mounts, so a
 * "resolves to the persisted value" assertion could pass on leftover state
 * rather than on what the run actually selected — the property would look green
 * while testing nothing.
 */
function resetThemeEnvironment(): void {
  window.localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.style.colorScheme = "";
}

function withProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

/** Mounts `useTheme` inside the real `ThemeProvider` (no mocks, no fakes). */
function mountThemeProbe() {
  return renderHook(() => useTheme(), { wrapper: withProvider });
}

/**
 * Everything a `localStorage` slot can plausibly hold when `resolveTheme` reads
 * it: the two valid themes, absence (`null`/`undefined`), an empty string,
 * near-misses (`"DARK"`, `" light "`, `"system"`), arbitrary text, and non-string
 * junk from a foreign writer, cast through `unknown` because the signature says
 * `string | null | undefined` while `localStorage` in the wild does not.
 */
const arbitraryStoredValue: fc.Arbitrary<string | null | undefined> = fc.oneof(
  fc.constantFrom<Theme>(...THEMES),
  fc.constantFrom(null, undefined),
  fc.constant(""),
  fc.constantFrom("DARK", "Dark", "LIGHT", "Light", "system", "auto", "0"),
  fc
    .tuple(
      fc.constantFrom("", " ", "\t", "\n", "  "),
      fc.constantFrom<Theme>(...THEMES),
      fc.constantFrom("", " ", "\t", "\n", "  "),
    )
    .map(([before, theme, after]) => `${before}${theme}${after}`),
  fc.string(),
  fc.constantFrom(0, 1, true, false, Number.NaN, {}, [], ["dark"], {
    theme: "dark",
  }) as fc.Arbitrary<string>,
);

/**
 * Every state the `portfolio-theme` slot can actually be in when the provider
 * mounts: absent (`null` — the key was never written), holding an explicit
 * `"dark"`/`"light"`, or holding something unusable. `string | null` is the
 * complete domain, because `localStorage` stringifies whatever it is given, so
 * `arbitraryStoredValue`'s non-string cases cannot reach the provider as
 * non-strings.
 *
 * This generator used to be `fc.constantFrom(null, ...THEMES)`. Property 1 found
 * two counterexamples with the wider domain — `"dark "` and `"dark\n"` — and the
 * narrowing recorded a real defect in `next-themes`: it reads the slot raw
 * (`localStorage.getItem(key) || defaultTheme`) and applies the string as a class
 * without checking it against `themes`, so `"system"` landed on `<html>` as a
 * bogus class while `useTheme()` reported `"dark"`, and a whitespace-bearing
 * value made `classList.add` throw `InvalidCharacterError` during provider
 * mount.
 *
 * Fixed, so the domain is widened back to the truth. `components/theme/themeStorage.ts`
 * sanitises the slot ahead of every read `next-themes` performs — a blocking
 * inline script rendered before the `next-themes` script for the pre-paint stage,
 * and `sanitizeStoredTheme()` in `ThemeProvider`'s render body (before
 * `NextThemesProvider` renders) for the React stage — with `value={THEME_CLASSES}`
 * as the backstop that makes an unmapped theme apply no class instead of throwing.
 * `components/theme/themeStorage.test.tsx` holds the example-based regression
 * coverage for the original counterexamples.
 */
const arbitraryPersistedValue: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  fc.constantFrom<Theme>(...THEMES),
  fc.constant(""),
  fc.constantFrom("DARK", "Dark", "LIGHT", "Light", "system", "auto", "0"),
  fc
    .tuple(
      fc.constantFrom("", " ", "\t", "\n", "  "),
      fc.constantFrom<Theme>(...THEMES),
      fc.constantFrom("", " ", "\t", "\n", "  "),
    )
    .map(([before, theme, after]) => `${before}${theme}${after}`),
  fc.string(),
);

/**
 * A visitor's click history: one or more explicit selections, with short runs of
 * the same theme so that "select light, select light again" is covered as well
 * as strict alternation.
 */
const arbitrarySelectionSequence: fc.Arbitrary<Theme[]> = fc
  .array(
    fc.tuple(fc.constantFrom<Theme>(...THEMES), fc.integer({ min: 1, max: 3 })),
    { minLength: 1, maxLength: 6 },
  )
  .map((runs) =>
    runs.flatMap(([theme, repeats]) =>
      Array.from({ length: repeats }, () => theme),
    ),
  );

// Feature: developer-portfolio, Property 1: Theme resolution and persistence
//
// For any sequence of (no stored theme | stored "dark" | stored "light")
// followed by an explicit theme selection, resolving the active theme with no
// stored value returns `"dark"`, resolving with a stored value returns that
// stored value, and after an explicit selection of either theme the persisted
// value equals the selected theme.
//
// **Validates: Requirements 3.2, 3.3**
describe("Property 1: theme resolution and persistence", () => {
  it("resolves any stored value to a supported theme: valid values to themselves, everything else to dark", () => {
    fc.assert(
      fc.property(arbitraryStoredValue, (stored) => {
        const resolved = resolveTheme(stored);

        // Total: never undefined, never null, always a member of THEMES.
        expect(resolved).not.toBeUndefined();
        expect(resolved).not.toBeNull();
        expect(THEMES).toContain(resolved);
        expect(isTheme(resolved)).toBe(true);

        if (isTheme(stored)) {
          // Requirement 3.3: a stored selection resolves to itself.
          expect(resolved).toBe(stored);
        } else {
          // Requirement 3.2: absent, empty, mixed-case, padded, foreign, or
          // corrupted values all fall back to the mandated default.
          expect(resolved).toBe(DEFAULT_THEME);
          expect(resolved).toBe("dark");
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is idempotent: re-resolving an already resolved theme changes nothing", () => {
    fc.assert(
      fc.property(arbitraryStoredValue, (stored) => {
        const once = resolveTheme(stored);

        expect(resolveTheme(once)).toBe(once);
        expect(resolveTheme(resolveTheme(once))).toBe(once);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it(
    "resolves to dark with no stored value and to the stored value otherwise, through the real provider",
    () => {
      fc.assert(
        fc.property(arbitraryPersistedValue, (stored) => {
          resetThemeEnvironment();

          if (stored !== null) {
            window.localStorage.setItem(THEME_STORAGE_KEY, stored);
          }

          const { result, unmount } = mountThemeProbe();

          try {
            const expected = resolveTheme(stored);

            expect(result.current.theme).toBe(expected);
            expect(result.current.isResolved).toBe(true);
            // Requirement 3.1/3.6: the theme is applied as a class on <html>
            // (attribute="class" + darkMode: "class"), so Tailwind's variants and
            // the token blocks in globals.css switch together.
            expect(document.documentElement.classList.contains(expected)).toBe(
              true,
            );

            // Exactly the resolved theme's class: no leftover, and nothing
            // invented from an unusable stored value.
            expect(Array.from(document.documentElement.classList)).toEqual([
              expected,
            ]);

            for (const other of THEMES.filter((theme) => theme !== expected)) {
              expect(document.documentElement.classList.contains(other)).toBe(
                false,
              );
            }

            if (stored !== null) {
              // An unusable value does not merely resolve to dark in memory, it is
              // replaced in storage, so the next read — including the pre-paint
              // script on the next load — sees a real theme (Requirement 3.4).
              expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(
                expected,
              );
              expect(
                isTheme(window.localStorage.getItem(THEME_STORAGE_KEY)),
              ).toBe(true);
            }
          } finally {
            unmount();
            cleanup();
            resetThemeEnvironment();
          }
        }),
        { numRuns: NUM_RUNS },
      );
    },
    PROPERTY_TEST_TIMEOUT_MS,
  );

  it(
    "persists the last selection of any sequence, and a remount resolves to it rather than the default",
    () => {
      fc.assert(
        fc.property(
          arbitraryPersistedValue,
          arbitrarySelectionSequence,
          (stored, selections) => {
            resetThemeEnvironment();

            if (stored !== null) {
              window.localStorage.setItem(THEME_STORAGE_KEY, stored);
            }

            const lastSelection = selections[selections.length - 1];
            const first = mountThemeProbe();

            try {
              for (const selection of selections) {
                act(() => {
                  first.result.current.setTheme(selection);
                });

                // Every selection is persisted as it happens, not batched until
                // unload (Requirement 3.3).
                expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(
                  selection,
                );
                expect(first.result.current.theme).toBe(selection);
                expect(
                  document.documentElement.classList.contains(selection),
                ).toBe(true);
              }

              expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(
                lastSelection,
              );
            } finally {
              first.unmount();
              cleanup();
            }

            // A fresh mount stands in for a reload / future visit: it must pick
            // up the persisted selection, never fall back to DEFAULT_THEME.
            const second = mountThemeProbe();

            try {
              expect(second.result.current.theme).toBe(lastSelection);
              expect(second.result.current.theme).toBe(
                resolveTheme(window.localStorage.getItem(THEME_STORAGE_KEY)),
              );
              expect(
                document.documentElement.classList.contains(lastSelection),
              ).toBe(true);
            } finally {
              second.unmount();
              cleanup();
              resetThemeEnvironment();
            }
          },
        ),
        { numRuns: NUM_RUNS },
      );
    },
    PROPERTY_TEST_TIMEOUT_MS,
  );
});
