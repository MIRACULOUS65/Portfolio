/**
 * Theme constants and the pure resolution rule shared by the whole theme
 * system (Requirements 3.1, 3.2, 3.3).
 *
 * This module deliberately contains no React and no browser access, so the
 * `ThemeProvider`, `hooks/useTheme.ts`, `ThemeToggle`, and tests can all agree
 * on the same storage key, the same theme names, and the same default without
 * duplicating literals. `next-themes` performs the actual persistence and
 * pre-paint class application; `resolveTheme` below states, in one place, the
 * rule that persistence is expected to follow.
 */

/** The two themes the portfolio supports (Requirement 3.1). */
export const THEMES = ["dark", "light"] as const;

/** `"dark" | "light"` — the only valid theme names. */
export type Theme = (typeof THEMES)[number];

/**
 * Theme applied on a first visit, before any explicit selection exists
 * (Requirement 3.2). Also the value `styles/globals.css` renders with no class
 * at all, so the default paint and the default theme cannot disagree.
 */
export const DEFAULT_THEME: Theme = "dark";

/**
 * `localStorage` key `next-themes` reads in its pre-hydration inline script and
 * writes on every explicit selection (Requirement 3.3).
 */
export const THEME_STORAGE_KEY = "portfolio-theme";

/** Narrows an arbitrary value to a supported theme name. */
export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/**
 * Resolves the effective theme from whatever is currently persisted.
 *
 * - A stored `"dark"`/`"light"` value resolves to itself, so an explicit
 *   selection survives reloads and future visits (Requirement 3.3).
 * - Anything else — no stored value yet, a cleared key, or a corrupted/foreign
 *   value — resolves to `DEFAULT_THEME` (Requirement 3.2).
 *
 * Pure and total: every input has exactly one supported output, which is the
 * same rule `next-themes` applies internally with
 * `defaultTheme="dark"` + `enableSystem={false}`.
 */
export function resolveTheme(storedTheme: string | null | undefined): Theme {
  return isTheme(storedTheme) ? storedTheme : DEFAULT_THEME;
}
