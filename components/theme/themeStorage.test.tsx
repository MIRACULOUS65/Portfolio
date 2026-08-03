import { act, cleanup, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  isTheme,
  resolveTheme,
  type Theme,
} from "@/components/theme/theme";
import {
  THEME_SANITIZER_SCRIPT,
  readStoredTheme,
  sanitizeStoredTheme,
} from "@/components/theme/themeStorage";
import { useTheme } from "@/hooks/useTheme";

/**
 * Regression coverage for the defect found by Property 1 (Task 13.4):
 * `next-themes` reads the `portfolio-theme` slot raw and applies it as a class
 * without checking it against `themes`, so `"dark "` threw
 * `InvalidCharacterError` during provider mount and `"system"` landed on
 * `<html>` as a bogus class while `useTheme()` reported `"dark"`.
 *
 * Every test here pre-seeds a value no sane writer would produce, because that
 * is the whole point: the slot is shared-origin, mutable state that a devtools
 * edit, an extension, or an older build can corrupt. Requirement 3.2 says such a
 * value must land on dark, and it must do so without throwing.
 */

/**
 * jsdom ships no `matchMedia`, and `next-themes` probes it on mount even with
 * `enableSystem={false}`. Environment shim only — a browser API jsdom omits,
 * not a stand-in for the code under test. It reports "no preference", which a
 * system-preference-agnostic provider ignores anyway.
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
  document.documentElement.style.colorScheme = "";
});

/**
 * The values that broke the provider, plus the near-misses around them:
 * whitespace-padded (class-illegal, used to throw), wrong case, non-theme names
 * `next-themes` would have accepted as a class, empty, and free-form junk.
 */
const CORRUPTED_VALUES = [
  "dark ",
  "dark\n",
  " light ",
  "\tlight",
  "DARK",
  "Light",
  "system",
  "auto",
  "",
  "dark light",
  "🌚",
  '{"theme":"dark"}',
] as const;

function withProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

function mountThemeProbe() {
  return renderHook(() => useTheme(), { wrapper: withProvider });
}

/** The theme classes currently on `<html>`, in DOM order. */
function themeClassesOnRoot(): string[] {
  return Array.from(document.documentElement.classList);
}

describe("sanitizeStoredTheme", () => {
  it("leaves an absent key absent so a first visit still resolves to dark (Requirement 3.2)", () => {
    expect(sanitizeStoredTheme()).toBe(DEFAULT_THEME);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it.each(THEMES)(
    "leaves an explicit %s selection untouched (Requirement 3.3)",
    (theme) => {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);

      expect(sanitizeStoredTheme()).toBe(theme);
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(theme);
    },
  );

  it.each(CORRUPTED_VALUES)("rewrites %j to the default theme", (stored) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, stored);

    expect(sanitizeStoredTheme()).toBe(DEFAULT_THEME);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(DEFAULT_THEME);
    expect(isTheme(window.localStorage.getItem(THEME_STORAGE_KEY))).toBe(true);
  });

  it("degrades to the default theme when localStorage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(readStoredTheme()).toBeNull();
    expect(sanitizeStoredTheme()).toBe(DEFAULT_THEME);
  });

  it("does not throw when localStorage cannot be written", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "system");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(sanitizeStoredTheme()).toBe(DEFAULT_THEME);
  });
});

describe("THEME_SANITIZER_SCRIPT (pre-paint stage)", () => {
  /** Runs the inline script the way the browser would, before any React code. */
  function runSanitizerScript(): void {
    new Function(THEME_SANITIZER_SCRIPT)();
  }

  it.each(CORRUPTED_VALUES)(
    "converges %j before next-themes' own script reads the key",
    (stored) => {
      window.localStorage.setItem(THEME_STORAGE_KEY, stored);

      runSanitizerScript();

      // This is exactly what `next-themes`' pre-paint script then reads with
      // `localStorage.getItem(key) || defaultTheme`, so the class it applies
      // before first paint is now a real theme (Requirement 3.4).
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(
        DEFAULT_THEME,
      );
    },
  );

  it("leaves a valid selection and an absent key alone", () => {
    runSanitizerScript();
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();

    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    runSanitizerScript();
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("swallows a blocked storage API instead of breaking the parse-blocking phase", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(() => runSanitizerScript()).not.toThrow();
  });

  it("renders ahead of the next-themes script, which is what makes it run first", () => {
    const { container } = render(
      <ThemeProvider>
        <span>themed content</span>
      </ThemeProvider>,
    );

    const scripts = Array.from(container.querySelectorAll("script"));

    // Both are blocking inline scripts, so document order is execution order.
    expect(scripts.length).toBeGreaterThanOrEqual(2);
    expect(scripts[0].innerHTML).toBe(THEME_SANITIZER_SCRIPT);
    expect(scripts[1].innerHTML).toContain("localStorage.getItem");
  });
});

describe("ThemeProvider with a corrupted stored theme (React stage)", () => {
  it.each(CORRUPTED_VALUES)(
    "mounts without throwing and applies dark for %j",
    (stored) => {
      window.localStorage.setItem(THEME_STORAGE_KEY, stored);

      const { result, unmount } = mountThemeProbe();

      try {
        expect(result.current.theme).toBe(resolveTheme(stored));
        expect(result.current.theme).toBe(DEFAULT_THEME);
        expect(isTheme(result.current.theme)).toBe(true);
        expect(result.current.isResolved).toBe(true);

        // Exactly the resolved theme's class, and nothing invented from the
        // corrupted value (Requirements 3.1, 3.6).
        expect(themeClassesOnRoot()).toEqual([DEFAULT_THEME]);

        // The slot itself converged, so the next reader — including the
        // pre-paint script on the next load — sees a real theme.
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(
          DEFAULT_THEME,
        );
      } finally {
        unmount();
        cleanup();
      }
    },
  );

  it("still honours an explicit selection made after a corrupted value (Requirement 3.3)", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark ");

    const { result } = mountThemeProbe();

    act(() => {
      result.current.setTheme("light");
    });

    expect(result.current.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(themeClassesOnRoot()).toEqual(["light"]);
  });

  it("survives a rogue in-memory theme and converges on the next mount", () => {
    const first = mountThemeProbe();

    // A caller bypassing the typed surface — the one path sanitised storage
    // cannot cover. The `value` map on ThemeProvider means next-themes applies
    // no class rather than adding an illegal one, so nothing throws.
    expect(() => {
      act(() => {
        first.result.current.setTheme("dark " as Theme);
      });
    }).not.toThrow();

    expect(first.result.current.theme).toBe(DEFAULT_THEME);
    expect(themeClassesOnRoot()).toEqual([]);

    first.unmount();
    cleanup();

    const second = mountThemeProbe();

    expect(second.result.current.theme).toBe(DEFAULT_THEME);
    expect(themeClassesOnRoot()).toEqual([DEFAULT_THEME]);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(DEFAULT_THEME);

    second.unmount();
  });
});

describe("cross-tab storage guard", () => {
  function dispatchForeignWrite(
    newValue: string | null,
    oldValue: string | null = null,
  ): void {
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          oldValue,
          newValue,
          storageArea: window.localStorage,
        }),
      );
    });
  }

  it.each(CORRUPTED_VALUES)(
    "resolves a foreign write of %j to dark without throwing",
    (foreignValue) => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "light");

      const { result, unmount } = mountThemeProbe();

      try {
        expect(result.current.theme).toBe("light");
        expect(() => dispatchForeignWrite(foreignValue, "light")).not.toThrow();

        expect(result.current.theme).toBe(DEFAULT_THEME);
        expect(themeClassesOnRoot()).toEqual([DEFAULT_THEME]);
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(
          DEFAULT_THEME,
        );
      } finally {
        unmount();
        cleanup();
      }
    },
  );

  it("passes a valid foreign selection straight through", () => {
    const { result, unmount } = mountThemeProbe();

    try {
      dispatchForeignWrite("light", null);

      expect(result.current.theme).toBe("light");
      expect(themeClassesOnRoot()).toEqual(["light"]);
    } finally {
      unmount();
      cleanup();
    }
  });

  it("ignores events for other storage keys", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    const { result, unmount } = mountThemeProbe();

    try {
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "some-other-app-key",
            newValue: "dark ",
            storageArea: window.localStorage,
          }),
        );
      });

      expect(result.current.theme).toBe("light");
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    } finally {
      unmount();
      cleanup();
    }
  });
});
