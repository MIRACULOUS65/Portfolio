import localFont from "next/font/local";

/**
 * Font loading (Requirement 2 / design.md § Font Loading Strategy).
 *
 * Instagram Sans is not published as a `next/font/google` family, so it is
 * self-hosted and loaded with `next/font/local` (Requirement 2.3). Both
 * families are exposed **only** as CSS custom properties — `--font-sans` and
 * `--font-mono` — which `tailwind.config.ts` maps onto the `font-sans` /
 * `font-mono` utilities. No component may reference the font-family string
 * directly (Requirement 2.5).
 *
 * The `.woff2` files under `public/fonts/instagram-sans/` are placeholders: the
 * licensed Instagram Sans files cannot be committed here, so real Geist bytes
 * stand in at the exact same file names. Dropping the licensed files over them
 * is the only step needed to complete the swap — see `public/fonts/README.md`.
 *
 * Note: every option below must be an inline literal — the `next/font` loader
 * is evaluated at build time and rejects values referenced through constants.
 */

/**
 * Primary typeface (Requirement 2.1). `display: "swap"` keeps text visible
 * during the font load (Requirement 2.4), and `fallback` is the system
 * sans-serif stack used while loading or if the webfont never arrives
 * (Requirement 2.2).
 */
export const instagramSans = localFont({
  src: [
    {
      path: "../public/fonts/instagram-sans/InstagramSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/instagram-sans/InstagramSans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/instagram-sans/InstagramSans-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/instagram-sans/InstagramSans-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  preload: true,
});

/**
 * Monospace token, deliberately a separate family from the primary typeface
 * (Requirement 2.6). Not preloaded: code and technical content sit below the
 * fold on every route, so the bytes are fetched only when actually needed.
 */
export const monoFont = localFont({
  src: [
    {
      path: "../public/fonts/geist-mono/GeistMono-Regular.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "Liberation Mono",
    "monospace",
  ],
  preload: false,
});

/**
 * Convenience export for `app/layout.tsx`: the class names that declare both
 * CSS variables on `<html>`.
 */
export const fontVariables = `${instagramSans.variable} ${monoFont.variable}`;
