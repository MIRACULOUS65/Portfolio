import type { SocialPlatform } from "./index";

/**
 * A single social channel entry, sourced from `data/socials.ts`.
 *
 * Consumed by the HeroSection `SocialLinks`, the ContactSection, and the Footer.
 *
 * Visibility semantics (Requirement 7.5, design.md Property 5): `SocialLinks`
 * renders exactly one button per known {@link SocialPlatform} — always the full
 * platform set, regardless of the dataset. A `visible: false` entry maps to a
 * **disabled** (placeholder) button in the same position, never to an omitted
 * one, so visitors can see every channel that exists. Only `visible: true`
 * entries produce an active button that navigates to `url`.
 *
 * Requirement 4.14
 */
export interface Social {
  /** Stable unique identifier, also used as a React key. */
  id: string;
  /** Which known platform this entry represents. */
  platform: SocialPlatform;
  /** Handle on the platform, e.g. `"octocat"`. */
  username: string;
  /** Absolute profile URL (or `mailto:` URL for `"Email"`). */
  url: string;
  /** Icon identifier or `public/` path for the platform glyph. */
  icon: string;
  /**
   * Whether the channel is active. `false` renders a disabled button rather
   * than removing it (Requirement 7.5).
   */
  visible: boolean;
}
