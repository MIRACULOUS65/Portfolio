import { icons as lucideIcons } from "lucide-react";

import { Container } from "@/components/shared/Container";
import {
  getNavigationItems,
  getSiteConfig,
  getSocials,
} from "@/lib/data-access";
import type { Social, SocialPlatform } from "@/types";

/**
 * The site Footer (Requirements 16.4, 16.5, design.md "CertificationsSection
 * / ... / Footer").
 *
 * Rendered once by `app/layout.tsx` as the final element inside `<body>`, so
 * every route gets navigation links, social links, and copyright text without
 * re-fetching per page (design.md: "reused as-is (not re-fetched) on every
 * dedicated page via `RootLayout`").
 *
 * ## Data sources
 *
 * Every value is read through `lib/data-access.ts` — the single sanctioned
 * entry point (Requirement 4.2) — never `data/*.ts` directly:
 *
 * - **Navigation links** come from `getNavigationItems()`, the same
 *   visible-and-ordered list the Navbar renders, so the Footer's links never
 *   drift from the Navbar's. Homepage-section links use their `href`
 *   (`"#hero"`, `"#projects"`, ...) as real anchors; a full route navigation is
 *   unnecessary here since the Footer only ever renders on the homepage today
 *   via `RootLayout`, and a hash anchor scrolls correctly on the page it is
 *   already on.
 * - **Social links** come from `getSocials()`, filtered here to entries with
 *   `visible: true` — unlike `SocialLinks` (which renders a disabled
 *   placeholder for every known platform so a visitor sees the full channel
 *   set), the Footer is a secondary, denser surface where an inactive channel
 *   adds nothing; only real, working links are shown.
 * - **Copyright text** combines `getSiteConfig().siteName` with the current
 *   year.
 *
 * ## Current year, without breaking determinism elsewhere
 *
 * `new Date().getFullYear()` reads the clock, which the rest of the data-access
 * layer deliberately avoids (Requirement 22.3, Property 19) — but that
 * constraint is about *selectors* returning the same value across calls within
 * a render, not about UI components. Copyright text is expected to change
 * with the calendar; nothing downstream re-derives from this value, so reading
 * the clock here introduces no non-determinism into the data layer itself.
 *
 * Server Component: static markup plus one clock read, no state, no effects.
 */

/** A neutral fallback icon per platform, mirroring `SocialLinks`' own choices. */
const FOOTER_FALLBACK_ICON_NAME: Record<SocialPlatform, keyof typeof lucideIcons> =
  {
    GitHub: "GitBranch",
    LinkedIn: "Link",
    X: "X",
    Email: "Mail",
    Discord: "MessageCircle",
    Portfolio: "Globe",
  };

function resolveFooterIcon(social: Social) {
  const named = lucideIcons[social.icon as keyof typeof lucideIcons];
  return named ?? lucideIcons[FOOTER_FALLBACK_ICON_NAME[social.platform]];
}

export function Footer() {
  const navigationItems = getNavigationItems();
  const socials = getSocials().filter((social) => social.visible);
  const site = getSiteConfig();
  const year = new Date().getFullYear();

  return (
    <footer
      data-slot="footer"
      className="mt-auto w-full border-t border-border"
    >
      <Container>
        <div className="flex flex-col items-center gap-6 py-10 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <nav aria-label="Footer" data-slot="footer-nav">
            <ul className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="text-small text-muted-foreground hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            data-slot="footer-socials"
            className="flex items-center gap-3"
          >
            {socials.map((social) => {
              const Icon = resolveFooterIcon(social);
              const isMailto = social.url.startsWith("mailto:");

              return (
                <a
                  key={social.id}
                  href={social.url}
                  aria-label={social.platform}
                  target={isMailto ? undefined : "_blank"}
                  rel={isMailto ? undefined : "noopener noreferrer"}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Icon aria-hidden="true" className="size-5" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border py-6 text-center">
          <p className="text-caption text-muted-foreground">
            © {year} {site.siteName}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
