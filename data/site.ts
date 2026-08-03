import type { SiteConfig } from "@/types";

/**
 * Global site configuration (Requirements 4.1, 4.15).
 *
 * The single source of truth for site identity, default page metadata, theme
 * defaults, analytics, and the social preview image. `lib/seo.ts#buildMetadata`
 * builds canonical URLs from `domain` and falls back to `defaultSeo` whenever an
 * entity supplies no `SEOFields` override; `app/sitemap.ts` and `app/robots.ts`
 * use `domain` as their base URL.
 *
 * Two constraints the rest of the app depends on:
 *
 * - `domain` MUST be an absolute origin with **no trailing slash**, since URLs
 *   are built as `` `${site.domain}${path}` ``.
 * - `themeDefaults.defaultTheme` MUST stay in sync with
 *   `components/theme/theme.ts#DEFAULT_THEME` and the `ThemeProvider`
 *   (`defaultTheme="dark"`, `enableSystem={false}`), so the first paint and the
 *   configured default cannot disagree (Requirement 3.2).
 *
 * Placeholder content for the template: swap in your own domain, copy, and
 * `public/` image path (`/images/` is committed empty, so add `og-image.png`
 * there or repoint these fields).
 */
export const site: SiteConfig = {
  siteName: "Sushovan Ghosh",
  tagline: "Aspiring Full-Stack Developer / Web3 & AI Enthusiast",
  description:
    "Portfolio of Sushovan Ghosh — an aspiring full-stack developer " +
    "building across Web3, decentralized systems, and AI/ML.",
  domain: "https://example.dev",
  defaultSeo: {
    title: "Sushovan Ghosh — Full-Stack Developer",
    description:
      "Projects, hackathons, and competitive programming from an aspiring " +
      "full-stack developer working across Web3, AI/ML, and decentralized systems.",
    keywords: [
      "full-stack developer",
      "web3 developer",
      "blockchain developer",
      "typescript",
      "react",
      "next.js",
      "node.js",
      "portfolio",
    ],
    ogImage: "/images/og-image.png",
  },
  themeDefaults: {
    defaultTheme: "dark",
  },
  analytics: {
    provider: "none",
  },
  socialPreviewImage: "/images/og-image.png",
};
