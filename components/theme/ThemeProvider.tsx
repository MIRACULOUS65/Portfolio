"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES, type Theme } from "./theme";
import {
  THEME_SANITIZER_SCRIPT,
  installStoredThemeGuard,
  sanitizeStoredTheme,
} from "./themeStorage";

export interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Maps each theme to the class `next-themes` puts on `<html>` — an identity map,
 * derived from `THEMES` so it cannot drift.
 *
 * Passing this as `value` is not cosmetic: `next-themes` looks the active theme
 * up in this map and skips `classList.add` entirely when the lookup misses.
 * Without it, `classList.add` receives the raw theme string, which throws on a
 * value containing whitespace. With it, a value that somehow escapes
 * sanitisation applies no class at all — and no class already paints dark
 * (`:root` in `styles/globals.css`), which is exactly what `useTheme` reports
 * for an unusable value. A degraded-but-correct paint instead of a crash.
 */
const THEME_CLASSES: Record<Theme, string> = Object.fromEntries(
  THEMES.map((theme) => [theme, theme]),
) as Record<Theme, string>;

/**
 * Application-wide theme provider (Requirements 3.1–3.4).
 *
 * Wraps `next-themes` with a fixed configuration rather than forwarding its
 * props, so the guarantees below hold everywhere the app renders:
 *
 * - `attribute="class"` — the active theme is expressed as a class on `<html>`,
 *   matching `darkMode: "class"` in `tailwind.config.ts` and the `.dark` /
 *   `.light` token blocks in `styles/globals.css` (Requirements 3.1, 3.6).
 * - `defaultTheme="dark"` — dark on a first visit. Kept as a literal (via
 *   `DEFAULT_THEME`) rather than read from `data/site.ts#themeDefaults` so the
 *   default cannot drift from the no-class dark values `globals.css` paints
 *   before any script runs (Requirement 3.2).
 * - `enableSystem={false}` — deliberate: OS preference must not override the
 *   mandated dark default. Visitors still switch explicitly via `ThemeToggle`
 *   (Requirements 3.2, 3.5).
 * - `storageKey="portfolio-theme"` — the selection is persisted immediately on
 *   change, well before unload or navigation (Requirement 3.3).
 *
 * `next-themes` injects a small blocking inline script that reads the stored
 * value and sets the class synchronously before first paint, so no incorrect
 * theme flashes (Requirement 3.4). That script mutates `<html>` ahead of
 * hydration, which is why the root layout renders `<html suppressHydrationWarning>`
 * (wired in Task 18).
 *
 * ## Hardening against a corrupted stored value
 *
 * `next-themes` applies whatever the storage slot holds without validating it
 * against `themes`, so an unusable value either throws inside `classList.add`
 * or lands on `<html>` as a bogus class. `./themeStorage.ts` explains the
 * failure modes in full; this component installs the three layers that close
 * them, in the order they take effect:
 *
 * 1. `THEME_SANITIZER_SCRIPT` renders **before** the `next-themes` script in
 *    document order, so it also executes first — the slot is already valid by
 *    the time the pre-paint class is applied (Requirement 3.4 preserved, no
 *    extra blocking work beyond one `localStorage` read).
 * 2. `sanitizeStoredTheme()` runs in this render body, which completes before
 *    React renders `NextThemesProvider` and reads the slot for its initial
 *    state. Deliberately not an effect: an effect runs far too late, after the
 *    class has already been applied.
 * 3. `value={THEME_CLASSES}` and `installStoredThemeGuard()` are backstops for
 *    anything that bypasses storage sanitisation — a rogue in-memory theme, or
 *    a corrupted value arriving from another tab through a `storage` event.
 *
 * All three live here, so Task 18 needs nothing extra beyond what `next-themes`
 * already requires of the root layout: `<html suppressHydrationWarning>`, and
 * this provider wrapping the tree high enough that both inline scripts land near
 * the top of `<body>` (they only guarantee "before first paint" if the parser
 * reaches them before the page's visible content).
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  if (typeof window !== "undefined") {
    // Render-phase on purpose, and safe to replay: both calls are idempotent,
    // and both must land before `NextThemesProvider` renders or registers its
    // own listeners. See the numbered layers above.
    sanitizeStoredTheme();
    installStoredThemeGuard();
  }

  return (
    <>
      {/*
        Must stay ahead of the `next-themes` script, which is the first child
        `NextThemesProvider` renders. `suppressHydrationWarning` matches what
        `next-themes` does with its own inline script: the browser executed it
        during parse, so React must not try to reconcile its contents.
      */}
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: THEME_SANITIZER_SCRIPT }}
      />
      <NextThemesProvider
        attribute="class"
        defaultTheme={DEFAULT_THEME}
        enableSystem={false}
        storageKey={THEME_STORAGE_KEY}
        themes={[...THEMES]}
        value={THEME_CLASSES}
        // Colour tokens carry transitions in a few components; suppressing them
        // for the swap itself avoids a visible half-themed frame.
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </>
  );
}
