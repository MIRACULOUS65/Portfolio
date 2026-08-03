import type { Metadata } from "next";

import { Footer } from "@/components/footer/Footer";
import { Navbar } from "@/components/navbar/Navbar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { DotPattern } from "@/components/ui/dot-pattern";
import { getSiteConfig } from "@/lib/data-access";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/utils/cn";
import "@/styles/globals.css";
import "@/components/ui/specular-button.css";

const site = getSiteConfig();

/**
 * Default document metadata, sourced from `data/site.ts` through the data-access
 * layer (Requirements 4.2, 4.15) — no title or description string is written
 * here.
 *
 * Deliberately minimal: task 42.3 replaces this with `generateMetadata` built on
 * `lib/seo.ts#buildMetadata`, which adds canonical URLs, Open Graph, and Twitter
 * cards from the same config. `title.template` is included because it is what
 * makes a per-page `title` compose with the site name once pages start setting
 * one.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: {
    default: site.defaultSeo.title,
    template: `%s | ${site.siteName}`,
  },
  description: site.defaultSeo.description,
};

/**
 * The root layout: the document shell every route renders inside (design.md
 * "Component Hierarchy").
 *
 * Server Component, and the Client boundary stays exactly two components wide —
 * `ThemeProvider` and `Navbar` (task 46.4's approved list, Requirement 1.9).
 *
 * ## `suppressHydrationWarning`
 *
 * Required, not defensive. `next-themes` (and `ThemeProvider`'s own storage
 * sanitiser) set the `class` on `<html>` from parse-blocking inline scripts,
 * before hydration, so the server-rendered markup and the DOM React hydrates
 * against differ by design. Without this, React would warn and — worse — could
 * reconcile the class away, which is the theme flash Requirement 3.4 forbids.
 *
 * ## Structure
 *
 * - **`<html>`** carries the font variable classes via `fontVariables`, which is
 *   `` `${instagramSans.variable} ${monoFont.variable}` `` pre-composed in
 *   `lib/fonts.ts` — the same thing as design.md's
 *   `cn(instagramSans.variable, monoFont.variable)`, kept in one place so the
 *   layout cannot list one font and forget the other. Only the CSS custom
 *   properties `--font-sans` / `--font-mono` are declared; `font-sans` on
 *   `<body>` is what actually applies the family, and no component ever names
 *   the font (Requirement 2.5). Passed through `cn` so it merges with the
 *   layout utilities beside it.
 * - **`ThemeProvider` wraps everything inside `<body>`**, as high as it can go.
 *   Its first two children are parse-blocking inline scripts, and those only
 *   guarantee "before first paint" if the parser reaches them ahead of the
 *   page's visible content — so the provider must sit above `Navbar`,
 *   `{children}`, and `Footer` rather than inside any of them.
 * - **No `<header>` here.** `Navbar` renders its own `<header>` containing
 *   `<nav aria-label="Primary">`; a second one would create a duplicate banner
 *   landmark (task 44.1).
 * - **`{children}` in a `<main>`**, the page-content landmark, `flex-1` so short
 *   pages still push the `Footer` to the bottom of the viewport. No heading is
 *   rendered here — each page owns its single `<h1>` (task 44.2).
 * - **`Footer` last**, on every route (Requirement 16.5). Currently the static
 *   shell in `components/footer/Footer.tsx`; task 33.2 fills it in and task 33.3
 *   verifies its position, with no change needed here.
 *
 * The section anchor offset that keeps a scrolled-to section clear of the sticky
 * Navbar is `--section-scroll-margin`, defined in `styles/globals.css`
 * (4rem, 5rem from `md` up — the Navbar's `h-16 md:h-20`) and consumed by
 * `components/shared/Section.tsx`. It lives in the stylesheet rather than here
 * so it applies to hash navigation and restored scroll positions too, not only
 * to Navbar clicks (Requirements 1.9, 5.3).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(fontVariables, "h-full antialiased")}
    >
      <body className="flex min-h-full flex-col font-sans">
        <DotPattern className="fixed inset-0 -z-10 h-screen w-screen opacity-30" />
        <ThemeProvider>
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
