import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/components/theme/theme";

import {
  PENDING_THEME_TOGGLE_LABEL,
  REDUCED_THEME_ICON_TRANSITION,
  THEME_ICON_TRANSITION,
  THEME_ICON_VARIANTS,
  ThemeToggle,
  nextTheme,
  resolveThemeIconTransition,
  themeIconState,
  themeToggleLabel,
} from "./ThemeToggle";

/**
 * jsdom ships no `matchMedia`, and both `next-themes` and
 * `usePrefersReducedMotion` probe it on mount. This is an environment shim for a
 * browser API jsdom omits, not a stand-in for the code under test: it reports
 * whatever `reduceMotion` the current test asked for.
 */
let reduceMotion = false;

beforeEach(() => {
  reduceMotion = false;

  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: reduceMotion,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  document.documentElement.className = "";
});

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

function iconState(theme: Theme): string | null {
  return screen
    .getByRole("button")
    .querySelector(`[data-icon-theme="${theme}"]`)
    ?.getAttribute("data-icon-state") as string | null;
}

describe("theme toggle logic", () => {
  it("flips between the two themes", () => {
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
  });

  it("shows exactly one icon for any applied theme", () => {
    for (const activeTheme of THEMES) {
      const visible = THEMES.filter(
        (iconTheme) => themeIconState(iconTheme, activeTheme) === "visible",
      );

      expect(visible).toEqual([activeTheme]);
    }
  });

  it("names the action the button performs", () => {
    expect(themeToggleLabel("dark")).toBe("Switch to light theme");
    expect(themeToggleLabel("light")).toBe("Switch to dark theme");
  });

  it("animates only transform-safe keys (Requirement 24.4)", () => {
    expect(THEME_ICON_VARIANTS).toEqual({
      visible: { opacity: 1, rotate: 0, scale: 1 },
      hidden: { opacity: 0, rotate: -90, scale: 0.6 },
    });
  });

  it("degrades to an instant swap under reduced motion (Requirement 24.5)", () => {
    expect(resolveThemeIconTransition(false)).toBe(THEME_ICON_TRANSITION);
    expect(resolveThemeIconTransition(true)).toBe(
      REDUCED_THEME_ICON_TRANSITION,
    );
    expect(REDUCED_THEME_ICON_TRANSITION).toEqual({ duration: 0 });
  });
});

describe("<ThemeToggle />", () => {
  it("shows the default theme's icon and an action-naming label", () => {
    renderToggle();

    const button = screen.getByRole("button", {
      name: themeToggleLabel(DEFAULT_THEME),
    });

    expect(button).toHaveAttribute("data-theme", DEFAULT_THEME);
    expect(button).toHaveAttribute("data-size", "icon");
    expect(iconState("dark")).toBe("visible");
    expect(iconState("light")).toBe("hidden");
    expect(button.textContent).toBe("");
  });

  it("switches the theme when clicked (Requirement 3.5)", async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("button"));

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    const button = screen.getByRole("button", {
      name: themeToggleLabel("light"),
    });
    expect(button).toHaveAttribute("data-theme", "light");
    expect(iconState("light")).toBe("visible");
    expect(iconState("dark")).toBe("hidden");
  });

  it("reflects the persisted theme (Requirement 3.3)", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    renderToggle();

    expect(
      screen.getByRole("button", { name: themeToggleLabel("light") }),
    ).toHaveAttribute("data-theme", "light");
    expect(iconState("light")).toBe("visible");
  });

  it("still swaps the icon under reduced motion (Requirement 24.5)", async () => {
    reduceMotion = true;
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("button"));

    expect(iconState("light")).toBe("visible");
    expect(iconState("dark")).toBe("hidden");
  });

  it("has an accessible name before the theme is known", () => {
    expect(PENDING_THEME_TOGGLE_LABEL).toBe("Toggle theme");
  });
});
