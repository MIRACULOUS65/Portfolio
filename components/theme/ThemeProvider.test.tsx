import { render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isTheme,
  resolveTheme,
} from "@/components/theme/theme";

/**
 * jsdom ships no `matchMedia`, and `next-themes` probes it on mount even with
 * `enableSystem={false}`. This is an environment shim (a browser API jsdom
 * omits), not a stand-in for the code under test: it reports "no preference",
 * which is exactly what a system-preference-agnostic provider should ignore.
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

describe("resolveTheme", () => {
  it("defaults to dark when nothing is stored (Requirement 3.2)", () => {
    expect(resolveTheme(null)).toBe("dark");
    expect(resolveTheme(undefined)).toBe("dark");
    expect(DEFAULT_THEME).toBe("dark");
  });

  it("returns a stored theme unchanged (Requirement 3.3)", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });

  it("falls back to dark for unsupported stored values", () => {
    expect(resolveTheme("")).toBe("dark");
    expect(resolveTheme("Light")).toBe("dark");
    expect(resolveTheme("system")).toBe("dark");
    expect(isTheme("system")).toBe(false);
  });
});

describe("ThemeProvider", () => {
  it("applies the dark class on a first visit with no stored theme", () => {
    render(
      <ThemeProvider>
        <span>themed content</span>
      </ThemeProvider>,
    );

    expect(screen.getByText("themed content")).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applies the persisted theme from the portfolio-theme key", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    render(
      <ThemeProvider>
        <span>themed content</span>
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
