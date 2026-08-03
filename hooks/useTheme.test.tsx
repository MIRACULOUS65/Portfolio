import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/components/theme/theme";
import { useTheme } from "@/hooks/useTheme";

/**
 * jsdom ships no `matchMedia`, and `next-themes` probes it on mount even with
 * `enableSystem={false}`. Environment shim only — it reports "no preference",
 * which a system-preference-agnostic provider ignores anyway.
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
  window.localStorage.clear();
  document.documentElement.className = "";
});

function withProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe("useTheme", () => {
  it("reports dark with no stored selection (Requirement 3.2)", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: withProvider });

    expect(result.current.theme).toBe("dark");
    expect(result.current.isResolved).toBe(true);
  });

  it("reports the persisted selection (Requirement 3.3)", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    const { result } = renderHook(() => useTheme(), { wrapper: withProvider });

    expect(result.current.theme).toBe("light");
  });

  it("switches themes and persists the choice (Requirement 3.5)", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: withProvider });

    act(() => {
      result.current.setTheme("light");
    });

    expect(result.current.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("falls back to dark and flags unresolved outside a provider", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
    expect(result.current.isResolved).toBe(false);
  });

  it("keeps setTheme identity stable across renders", () => {
    const { result, rerender } = renderHook(() => useTheme(), {
      wrapper: withProvider,
    });
    const first = result.current.setTheme;

    rerender();

    expect(result.current.setTheme).toBe(first);
  });
});
