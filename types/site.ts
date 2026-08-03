/**
 * Global site configuration: the single source of truth for site identity,
 * default SEO metadata, theme defaults, analytics, and the social preview
 * image.
 *
 * Consumed by `lib/seo.ts#buildMetadata` (canonical URLs, Open Graph, Twitter
 * Card), `app/sitemap.ts` / `app/robots.ts` (base URL), and the
 * `ThemeProvider`'s `defaultTheme`. Per-entity `SEOFields` overrides fall back
 * to `defaultSeo` here.
 *
 * Requirement 4.15
 */
export interface SiteConfig {
  siteName: string;
  tagline: string;
  description: string;
  /** Absolute origin without a trailing slash, e.g. `"https://example.dev"`. */
  domain: string;
  /** Page metadata defaults used whenever an entity supplies no override. */
  defaultSeo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string;
  };
  themeDefaults: {
    defaultTheme: "dark" | "light";
  };
  analytics?: {
    provider: "plausible" | "umami" | "none";
    id?: string;
  };
  /** Path or URL of the image used for Open Graph / Twitter Card previews. */
  socialPreviewImage: string;
}
