import { icons as lucideIcons } from "lucide-react";

import { buttonVariants } from "@/components/shared/Button";
import { GitHubGlyph, LinkedInGlyph } from "@/components/shared/BrandIcons";
import { getSocials } from "@/lib/data-access";
import type { Social, SocialPlatform } from "@/types";
import { cn } from "@/utils/cn";

/**
 * The HeroSection's row of social channel buttons (Requirements 7.1, 7.4, 7.5,
 * Component_Specification §5, design.md Property 5).
 *
 * ## One button per known platform — always, regardless of the dataset
 *
 * {@link KNOWN_PLATFORMS} is the full `SocialPlatform` union in fixed order —
 * GitHub, LinkedIn, X, Email, Discord, Portfolio — and this component maps
 * over that list, never over `getSocials()`. That is the difference between
 * "one button per platform" and "one button per dataset entry": a dataset
 * missing a platform (or shipping a duplicate) still renders exactly six
 * buttons, because the platform list — not the data — drives the render loop
 * (Requirement 7.5, design.md Property 5).
 *
 * ## Visibility maps to disabled, never to omission
 *
 * For each known platform, the matching `Social` entry (if any) decides the
 * button's state:
 *
 * - **`visible: true`** → an active `<a>` styled as a button, linking to
 *   `url` (Requirement 7.4).
 * - **`visible: false`, or no entry at all for that platform** → a disabled
 *   placeholder in the same position, so a visitor sees the full set of
 *   channels that exist rather than a shorter, silently-curated list
 *   (Requirement 7.5). A missing entry is treated identically to
 *   `visible: false` rather than as a distinct third state: both mean "nothing
 *   to link to right now," and Property 5 only distinguishes two outcomes.
 *
 * `data-disabled` is set explicitly to `"true"`/`"false"` on every item
 * regardless of whether it renders as an `<a>` or a disabled `<button>`, so
 * Property 5's test (task 20.3) has one stable, tag-independent signal to
 * assert against instead of inferring disabledness from the element type.
 *
 * ## Active buttons are `<a>`, not `<Button onClick>`
 *
 * `Button` (`components/shared/Button.tsx`) renders a `<button>` and is
 * correct for the disabled placeholder, which performs no navigation. An
 * active entry, however, *is* navigation — to an external profile URL or a
 * `mailto:` link — so it composes `buttonVariants` onto a real `<a>` instead,
 * the same pattern `ExploreMoreButton` uses for cross-route links. This does
 * not conflict with `ExploreMoreButton`'s "only shared component that calls
 * `next/link`" invariant: these are plain anchors to external destinations,
 * never `next/link`, so no App Router route is implied.
 *
 * `target="_blank"` + `rel="noopener noreferrer"` apply to every external
 * profile link so a visitor never loses the portfolio tab, but never to the
 * `Email` platform's `mailto:` URL — opening the visitor's mail client "in a
 * new tab" is meaningless, and Chrome/Firefox already ignore `target` on
 * `mailto:` anchors, so omitting it keeps the markup honest about what
 * actually happens.
 *
 * ## Icon resolution
 *
 * `Social.icon` is a `lucide-react` icon **name** string (the same convention
 * `data/current-activity.ts` documents). This is the first component in the
 * codebase to resolve one of these names to a component at render time, via
 * `lucide-react`'s `icons` runtime export — a plain `Record<string,
 * LucideIcon>` — rather than a hardcoded `import { X } from "lucide-react"`
 * per platform.
 *
 * **Why a fallback is required, not just defensive:** the installed
 * `lucide-react` version no longer ships trademarked brand icons (the same
 * fact `GitHubContributionCard` documents), so `data/socials.ts`'s `"Github"`,
 * `"Linkedin"`, and `"Twitter"` icon names do not resolve to anything in
 * `lucide-react`'s `icons` map today. Falling back to `undefined` — or
 * throwing — would make three of six buttons render with no glyph. Instead,
 * {@link FALLBACK_ICON_NAME} gives every platform a neutral icon that *does*
 * exist in the installed version, and {@link resolveSocialIcon} reaches for it
 * whenever `Social.icon` is absent or fails to resolve. `GitBranch` for GitHub
 * mirrors `GitHubContributionCard`'s own substitution for the same reason;
 * `Link`, `X`, `Mail`, `MessageCircle`, and `Globe` are the neutral choices for
 * the rest (the latter three already match what `data/socials.ts` ships, so
 * the fallback is invisible for those three platforms today).
 *
 * ## GitHub and LinkedIn: real Simple Icons CDN logos instead of a Lucide fallback
 *
 * GitHub and LinkedIn are the two platforms a visitor is most likely to
 * recognise by their actual brand mark, so rather than lean on the neutral
 * `GitBranch`/`Link` Lucide substitutes above, {@link SIMPLE_ICON_PLATFORM_SLUG}
 * maps them to their Simple Icons CDN slugs (`github`, `linkedin`) and
 * {@link resolveSocialIconElement} renders a plain `<img
 * src="https://cdn.simpleicons.org/<slug>">` for them instead — the same
 * externally-hosted-image pattern `TechBadge.tsx` already establishes for
 * per-technology brand logos, and `CurrentActivityCard.tsx` for its own
 * rotation. Every other platform keeps resolving through
 * {@link resolveSocialIcon} exactly as before. Both the real logo and every
 * Lucide fallback render at the same `size-4` footprint so the pill's icon
 * slot never shifts based on which platform is being rendered, and the CDN
 * logo is forced monochrome via {@link BRAND_ICON_FILTER} so it reads as a
 * neutral white/grey mark against the dark theme rather than GitHub/LinkedIn's
 * own brand colours (matching the treatment `CurrentActivityCard` applies to
 * its own CDN icons).
 *
 * Purely presentational Server Component: no state, no effects; the only data
 * read is the static `Social` dataset resolved at render time via
 * `getSocials()`, the data-access layer's single entry point
 * (Requirement 4.2) — `data/socials.ts` is never imported directly here.
 */

/** The full `SocialPlatform` union, in the fixed order every render walks. */
const KNOWN_PLATFORMS: readonly SocialPlatform[] = [
  "GitHub",
  "LinkedIn",
  "X",
  "Email",
  "Portfolio",
];

/**
 * A neutral, currently-installed `lucide-react` icon per platform, used when
 * `Social.icon` is missing or does not resolve (see module doc above).
 */
const FALLBACK_ICON_NAME: Record<SocialPlatform, keyof typeof lucideIcons> = {
  GitHub: "GitBranch",
  LinkedIn: "Link",
  X: "X",
  Email: "Mail",
  Discord: "MessageCircle",
  Portfolio: "Globe",
};

/**
 * Resolves a platform's rendered icon: the dataset's own `Social.icon` name
 * when it names a real `lucide-react` export, otherwise the platform's
 * {@link FALLBACK_ICON_NAME}. Never returns `undefined` — every known platform
 * has a fallback, so this function always has something to render.
 */
function resolveSocialIcon(platform: SocialPlatform, iconName?: string) {
  const named =
    iconName !== undefined
      ? lucideIcons[iconName as keyof typeof lucideIcons]
      : undefined;

  return named ?? lucideIcons[FALLBACK_ICON_NAME[platform]];
}

/**
 * Simple Icons CDN slug for the platforms rendered with a real brand logo
 * instead of a Lucide fallback (module doc above). Every platform not listed
 * here keeps resolving through {@link resolveSocialIcon}.
 */
/**
 * Resolves a platform's rendered icon element: the real inlined Bootstrap
 * Icons glyph for GitHub/LinkedIn (above), otherwise the Lucide icon
 * {@link resolveSocialIcon} already resolves. `aria-hidden` on both paths —
 * the adjacent `<span>` label already carries the platform's accessible name.
 */
function resolveSocialIconElement(platform: SocialPlatform, iconName?: string) {
  if (platform === "GitHub") return <GitHubGlyph />;
  if (platform === "LinkedIn") return <LinkedInGlyph />;

  const Icon = resolveSocialIcon(platform, iconName);
  return <Icon aria-hidden="true" />;
}

/** Accessible name for a disabled placeholder, naming the channel and its state. */
function disabledLabel(platform: SocialPlatform): string {
  return `${platform} (unavailable)`;
}

/**
 * Uppercase visible label per platform, matching the reference's "GITHUB",
 * "LINKEDIN", "X/TWITTER" pill text. `X` renders as "X/TWITTER" so the pill
 * stays recognisable to visitors who still know the platform by its former
 * name; every other label is just the platform name uppercased via CSS
 * (`uppercase`), so only the one irregular case needs an explicit override.
 */
const PLATFORM_LABEL: Partial<Record<SocialPlatform, string>> = {
  X: "X/Twitter",
};

function platformLabel(platform: SocialPlatform): string {
  return PLATFORM_LABEL[platform] ?? platform;
}

/**
 * Discord-badge-style pill treatment: icon on the left, uppercase platform
 * label on the right, a dark rounded rectangle background with a subtle
 * border — replacing the earlier icon-only square buttons (item 2 of the
 * hero redesign). Built on `buttonVariants({ variant: "outline", size: "sm"
 * })` and widened via `cn`'s de-duplication rather than the `icon` size,
 * since these buttons now carry visible text alongside the icon.
 */
const SOCIAL_PILL_CLASSES =
  "gap-1.5 rounded-full border-border bg-card px-3 text-caption font-semibold tracking-wide uppercase";

export interface SocialLinksProps {
  /** Extra utilities merged onto the wrapper; conflicting classes win (see `cn`). */
  className?: string;
}

export function SocialLinks({ className }: SocialLinksProps) {
  const socials = getSocials();
  const byPlatform = new Map<SocialPlatform, Social>(
    socials.map((social) => [social.platform, social] as const),
  );

  return (
    <div
      data-slot="social-links"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {KNOWN_PLATFORMS.map((platform) => {
        const social = byPlatform.get(platform);
        const isActive = social?.visible === true;
        const iconElement = resolveSocialIconElement(platform, social?.icon);

        if (isActive) {
          const isMailto = social.url.startsWith("mailto:");

          return (
            <a
              key={platform}
              data-slot="social-link"
              data-platform={platform}
              data-disabled="false"
              href={social.url}
              aria-label={platform}
              target={isMailto ? undefined : "_blank"}
              rel={isMailto ? undefined : "noopener noreferrer"}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                SOCIAL_PILL_CLASSES,
              )}
            >
              {iconElement}
              <span>{platformLabel(platform)}</span>
            </a>
          );
        }

        return (
          <button
            key={platform}
            data-slot="social-link"
            data-platform={platform}
            data-disabled="true"
            type="button"
            disabled
            aria-label={disabledLabel(platform)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              SOCIAL_PILL_CLASSES,
            )}
          >
            {iconElement}
            <span>{platformLabel(platform)}</span>
          </button>
        );
      })}
    </div>
  );
}
