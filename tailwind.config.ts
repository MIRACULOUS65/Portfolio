import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 is CSS-first, but it still honours a legacy JS/TS config
 * loaded explicitly through the `@config` directive in `styles/globals.css`.
 * That is the approach used here so design tokens live in one typed file:
 *
 * - `theme.extend.fontFamily` maps the `--font-sans` / `--font-mono` CSS
 *   variables exposed by `lib/fonts.ts` onto the `font-sans` / `font-mono`
 *   utilities, and `theme.extend.fontSize` declares the H1–H4/body/small/
 *   caption/code type scale (Requirements 2.5, 2.7).
 * - `theme.extend.colors` maps the theme-aware CSS variables declared in
 *   `styles/globals.css` onto semantic Tailwind colour names, so components
 *   use `bg-background` / `text-muted-foreground` and never a raw hex value
 *   (Requirement 3.6). Alpha modifiers work on these mappings: Tailwind v4
 *   composites them with `color-mix()` inside an `@supports` block and keeps the
 *   bare `var()` as the pre-`color-mix()` fallback, so `hover:bg-primary/90` is
 *   the intended way to tint a token (regression-tested in
 *   `styles/globals.test.ts`).
 * - `theme.extend.boxShadow` and `theme.extend.borderRadius` declare the
 *   elevation and radius scales from Design_System §8–§9.
 *
 * Content/source detection is left to Tailwind v4's automatic scanning, so no
 * `content` array is declared here.
 */
const config: Config = {
  // next-themes toggles a class on <html>, so the dark variant must be
  // class-based rather than `prefers-color-scheme`.
  darkMode: "class",
  theme: {
    extend: {
      // Families resolve through the CSS variables declared by `lib/fonts.ts`;
      // no component ever names a font family directly (Requirement 2.5). The
      // literal fallbacks repeat the loader's `fallback` stack so text stays
      // legible even if the variable itself is missing (Requirement 2.2).
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      // Type scale from Design_System §5 (H1 48–64, H2 36–48, H3 28–32, H4 24,
      // body 16–18, small 14, caption 12, code 14–15px), kept intact across the
      // Geist → Instagram Sans family swap (Requirement 2.7). Headings use
      // `clamp()` so a single token spans the documented range responsively;
      // body line-height stays in the 1.5–1.7 band the doc mandates.
      fontSize: {
        h1: [
          "clamp(3rem, 2.25rem + 2.5vw, 4rem)",
          { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        h2: [
          "clamp(2.25rem, 1.8rem + 1.5vw, 3rem)",
          { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        h3: [
          "clamp(1.75rem, 1.6rem + 0.5vw, 2rem)",
          { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        h4: [
          "1.5rem",
          { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        body: [
          "clamp(1rem, 0.95rem + 0.15vw, 1.125rem)",
          { lineHeight: "1.6", letterSpacing: "0em", fontWeight: "400" },
        ],
        small: ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: [
          "0.75rem",
          { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "400" },
        ],
        code: ["0.9375rem", { lineHeight: "1.55", fontWeight: "400" }],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        info: {
          DEFAULT: "var(--info)",
          foreground: "var(--info-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      // Elevation level 1 from Design_System §8, exposed as a single
      // `shadow-elevation` utility. The geometry lives here and the tint comes
      // from the theme-aware `--elevation` variable, so no component hardcodes
      // either (Requirement 3.6).
      //
      // Declared as a box-shadow token rather than a `colors.shadow` entry on
      // purpose. A colour named `shadow` maps onto Tailwind's `--shadow`
      // namespace slot, which already holds the built-in *default box-shadow*
      // value; `shadow-shadow` then compiles to a `--tw-shadow-color` whose
      // pre-`color-mix()` fallback is a shadow list instead of a colour, which
      // invalidates the declaration. Keeping the token out of the colour
      // namespace — and off the name `--shadow` — removes the collision
      // entirely. Regression-tested in `styles/globals.test.ts`.
      boxShadow: {
        elevation: "0 4px 10px -2px var(--elevation)",
      },
      // Radius scale from Design_System §9, derived from the single `--radius`
      // token so elevation/rounding stays consistent across components.
      borderRadius: {
        sm: "calc(var(--radius) - 4px)", // 6px
        md: "var(--radius)", // 10px
        lg: "calc(var(--radius) + 6px)", // 16px
        xl: "calc(var(--radius) + 14px)", // 24px
      },
    },
  },
  plugins: [],
};

export default config;
