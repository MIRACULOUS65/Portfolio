"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useCallback } from "react";

import { isTheme, resolveTheme, type Theme } from "@/components/theme/theme";

/** What `useTheme` hands back to a consumer. */
export interface UseThemeResult {
  /**
   * The effective theme, always one of `"dark"` / `"light"`.
   *
   * Never `undefined`: before `next-themes` has read the persisted value (server
   * render and the first client render) this is `DEFAULT_THEME`, per
   * `resolveTheme` (Requirement 3.2).
   */
  theme: Theme;
  /**
   * Selects a theme. `next-themes` writes it to `localStorage` under
   * `portfolio-theme` and swaps the class on `<html>` immediately
   * (Requirements 3.3, 3.5). Identity is stable across renders.
   */
  setTheme: (theme: Theme) => void;
  /**
   * `false` until `next-themes` has resolved the real theme, i.e. while `theme`
   * above is still the optimistic default. Consumers that would otherwise paint
   * the wrong icon for one frame (see `ThemeToggle`) can wait on this; consumers
   * that only need a valid theme name can ignore it.
   */
  isResolved: boolean;
}

/**
 * Typed access to the current theme (Requirement 3.5).
 *
 * A deliberately thin wrapper over `next-themes`' `useTheme`. It adds exactly
 * two things and owns no state of its own:
 *
 * 1. **Types.** `next-themes` types `theme` as `string | undefined` and
 *    `setTheme` as accepting any `string`, because it supports arbitrary theme
 *    lists and a `"system"` value. This portfolio has a closed set of two themes
 *    (`components/theme/theme.ts#THEMES`) and `enableSystem={false}`, so the
 *    surface is narrowed to the `Theme` union — a typo like `setTheme("ligth")`
 *    is a compile error rather than a silently ignored no-op.
 * 2. **Totality.** The raw value is passed through
 *    `components/theme/theme.ts#resolveTheme`, so the pre-hydration window (and
 *    any corrupted stored value) yields `"dark"` instead of `undefined`. That is
 *    the single rule stated in one place; this hook does not restate it.
 *
 * Persistence and the pre-paint class application stay entirely with
 * `next-themes` (Requirements 3.3, 3.4) — nothing here touches `localStorage`.
 *
 * Must be called inside `components/theme/ThemeProvider.tsx`. Outside a
 * provider `next-themes` returns an empty context, which resolves to
 * `{ theme: "dark", isResolved: false }` and a `setTheme` that does nothing.
 */
export function useTheme(): UseThemeResult {
  const { theme, resolvedTheme, setTheme: setNextTheme } = useNextTheme();

  // `resolvedTheme` is the value actually applied to `<html>`; `theme` is the
  // stored selection. With `enableSystem={false}` they agree, so `theme` is only
  // a fallback for the render before `resolvedTheme` is populated.
  const rawTheme = resolvedTheme ?? theme;

  const setTheme = useCallback(
    (next: Theme) => {
      setNextTheme(next);
    },
    [setNextTheme],
  );

  return {
    theme: resolveTheme(rawTheme),
    setTheme,
    isResolved: isTheme(rawTheme),
  };
}
