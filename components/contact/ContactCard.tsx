import { icons as lucideIcons } from "lucide-react";
import { Download, ExternalLink, Send } from "lucide-react";

import { GitHubGlyph, LinkedInGlyph } from "@/components/shared/BrandIcons";
import { Card, CardContent, CardFooter } from "@/components/shared/Card";
import SpecularButton from "@/components/ui/specular-button";
import type { Social } from "@/types";
import { cn } from "@/utils/cn";

/**
 * The ContactSection's single content card: the four contact channels
 * Requirement 16.1 names (email, GitHub, LinkedIn, X/Twitter), a resume
 * download action (Requirement 16.2), and a primary call-to-action
 * (Requirement 16.3) — Component_Specification §13 "ContactCard — Email,
 * GitHub, LinkedIn, X, Resume, Primary CTA."
 *
 * ## One button per known contact platform — always, regardless of the dataset
 *
 * {@link CONTACT_PLATFORMS} is the fixed four-platform list in Requirement
 * 16.1's own order (Email, GitHub, LinkedIn, X), and this component maps over
 * that list, never over `socials` directly — the same "platform list drives
 * the render loop, not the data" pattern `SocialLinks` uses for the full
 * six-platform set (Requirement 7.5, design.md Property 5). A `socials` array
 * missing one of these four platforms — or shipping it with `visible: false` —
 * still renders exactly four buttons; the entry only decides whether a given
 * button is active or a disabled placeholder in the same position, never
 * whether it appears at all.
 *
 * Unlike `SocialLinks` (icon-only, full six-platform set for the HeroSection),
 * these buttons render their platform label alongside the icon: the Contact
 * card is a smaller, more deliberate set of channels where the label carries
 * real information density, not just an accessible name.
 *
 * ## Icon resolution
 *
 * `Social.icon` is a `lucide-react` icon **name** string. The installed
 * `lucide-react` version ships no trademarked brand icons, so
 * `data/socials.ts`'s `"Github"`, `"Linkedin"`, and `"Twitter"` icon names do
 * not resolve to anything in the runtime `icons` map. {@link
 * CONTACT_FALLBACK_ICON_NAME} mirrors `SocialLinks`' own fallback choices
 * (`GitBranch` for GitHub, `Link` for LinkedIn, `X` for X, `Mail` for Email)
 * so a visitor sees the same glyph for a given platform in both places.
 *
 * ## Resume download and primary CTA are plain anchors, not `next/link`
 *
 * `resumeHref` points at a `public/` asset, and `ctaHref` is typically a
 * `mailto:` URL — neither is an App Router route, so both render as real
 * `<a>` elements composing `buttonVariants`, the same choice `SocialLinks`
 * makes for its external profile links (`ExploreMoreButton` remains the only
 * shared component that invokes `next/link`, per Requirement 17.3). The
 * resume link carries the `download` attribute so activating it prompts a
 * download rather than a same-tab navigation.
 *
 * Purely presentational Server Component: no state, no effects, no data
 * access — the caller (`ContactSection`) resolves `socials`, `resumeHref`, and
 * `ctaHref` from `lib/data-access.ts` and passes them down as plain props,
 * matching the `HackathonCard`/`CertificationCard` convention of receiving
 * already-resolved data rather than fetching it themselves.
 */

/** The fixed four contact channels, in Requirement 16.1's own order. */
type ContactPlatform = "Email" | "GitHub" | "LinkedIn" | "X";

const CONTACT_PLATFORMS: readonly ContactPlatform[] = [
  "Email",
  "GitHub",
  "LinkedIn",
  "X",
];

/**
 * A neutral, currently-installed `lucide-react` icon per contact platform,
 * used when `Social.icon` is missing or does not resolve (see module doc
 * above). Mirrors `SocialLinks`' `FALLBACK_ICON_NAME` for the same four
 * platforms.
 */
const CONTACT_FALLBACK_ICON_NAME: Record<
  ContactPlatform,
  keyof typeof lucideIcons
> = {
  Email: "Mail",
  GitHub: "GitBranch",
  LinkedIn: "Link",
  X: "X",
};

/**
 * Resolves a contact platform's rendered icon: the dataset's own
 * `Social.icon` name when it names a real `lucide-react` export, otherwise
 * the platform's {@link CONTACT_FALLBACK_ICON_NAME}. Never returns
 * `undefined` — every known contact platform has a fallback.
 */
function resolveContactIcon(platform: ContactPlatform, iconName?: string) {
  const named =
    iconName !== undefined
      ? lucideIcons[iconName as keyof typeof lucideIcons]
      : undefined;

  return named ?? lucideIcons[CONTACT_FALLBACK_ICON_NAME[platform]];
}

/**
 * Resolves a contact platform's rendered icon element: the real inlined
 * Bootstrap Icons glyph for GitHub/LinkedIn (shared with `SocialLinks` via
 * `BrandIcons.tsx`), otherwise the Lucide icon {@link resolveContactIcon}
 * already resolves.
 */
function resolveContactIconElement(
  platform: ContactPlatform,
  iconName: string | undefined,
  className: string,
) {
  if (platform === "GitHub") return <GitHubGlyph className={className} />;
  if (platform === "LinkedIn") return <LinkedInGlyph className={className} />;

  const Icon = resolveContactIcon(platform, iconName);
  return <Icon className={className} />;
}

/** Accessible name for a disabled placeholder, naming the channel and its state. */
function disabledLabel(platform: ContactPlatform): string {
  return `${platform} (unavailable)`;
}

export interface ContactCardProps {
  /**
   * The Social dataset, sourced by the caller from `getSocials()`. Only the
   * four entries matching {@link CONTACT_PLATFORMS} are rendered; any other
   * platform present in this array (Discord, Portfolio) is ignored here —
   * the HeroSection's `SocialLinks` is the full six-platform surface.
   */
  socials: readonly Social[];
  /** Resume asset href, sourced by the caller from `getProfile().resume`. */
  resumeHref: string;
  /** Primary call-to-action destination, e.g. a `mailto:` URL. */
  ctaHref: string;
  /** Visible text for the primary CTA. Defaults to `"Get in Touch"`. */
  ctaLabel?: string;
  /** Extra utilities merged onto the card; conflicting classes win (see `cn`). */
  className?: string;
}

export function ContactCard({
  socials,
  resumeHref,
  ctaHref,
  ctaLabel = "Get in Touch",
  className,
}: ContactCardProps) {
  const byPlatform = new Map<ContactPlatform, Social>(
    socials
      .filter((social): social is Social & { platform: ContactPlatform } =>
        CONTACT_PLATFORMS.includes(social.platform as ContactPlatform),
      )
      .map((social) => [social.platform as ContactPlatform, social] as const),
  );

  return (
    <Card as="article" data-slot="contact-card" className={cn(className)}>
      <CardContent className="gap-3">
        <div data-slot="contact-methods" className="flex flex-col gap-2">
          {CONTACT_PLATFORMS.map((platform) => {
            const social = byPlatform.get(platform);
            const isActive = social?.visible === true;
            const iconElement = resolveContactIconElement(
              platform,
              social?.icon,
              "size-4.5",
            );

            const row = (
              <>
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground"
                >
                  {iconElement}
                </span>
                <span className="flex flex-1 flex-col gap-0.5 text-left">
                  <span className="text-small font-medium text-foreground">
                    {platform}
                  </span>
                  <span className="truncate text-caption text-muted-foreground">
                    {social?.username ?? "Not available"}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </span>
              </>
            );

            if (isActive) {
              const isMailto = social.url.startsWith("mailto:");

              return (
                <a
                  key={platform}
                  data-slot="contact-method"
                  data-platform={platform}
                  data-disabled="false"
                  href={social.url}
                  target={isMailto ? undefined : "_blank"}
                  rel={isMailto ? undefined : "noopener noreferrer"}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors duration-150 ease-out hover:border-muted-foreground"
                >
                  {row}
                </a>
              );
            }

            return (
              <button
                key={platform}
                data-slot="contact-method"
                data-platform={platform}
                data-disabled="true"
                type="button"
                disabled
                aria-label={disabledLabel(platform)}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 opacity-50 disabled:cursor-not-allowed"
              >
                {row}
              </button>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="flex-col justify-center gap-3 sm:flex-row">
        <SpecularButton
          data-slot="resume-download"
          href={resumeHref}
          download
          size="sm"
          baseColor="#404040"
          lineColor="#ededed"
          textColor="var(--foreground)"
        >
          <Download aria-hidden="true" className="size-4" />
          Download Resume
        </SpecularButton>

        <SpecularButton
          data-slot="contact-primary-cta"
          href={ctaHref}
          size="sm"
          baseColor="#333333"
          lineColor="#a1a1a1"
          textColor="var(--foreground)"
        >
          <Send aria-hidden="true" className="size-4" />
          {ctaLabel}
        </SpecularButton>
      </CardFooter>
    </Card>
  );
}
