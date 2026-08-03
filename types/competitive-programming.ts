/**
 * The fixed set of competitive programming platforms featured on the portfolio.
 *
 * The union is closed so the data layer must supply exactly one
 * `CompetitiveProgrammingPlatform` entry per platform, and the
 * `CompetitiveProgrammingSection` can render one `PlatformCard` for each.
 *
 * Requirement 4.10
 */
export type CPPlatformName = "LeetCode" | "Codeforces" | "CodeChef";

/**
 * A developer profile on a single competitive programming platform.
 *
 * Rendered as a `PlatformCard` inside the homepage
 * `CompetitiveProgrammingSection`, which surfaces the platform logo, rating,
 * problems solved, rank, and a link to the profile.
 *
 * Requirement 4.10
 */
export interface CompetitiveProgrammingPlatform {
  /** Stable unique identifier, also used as a React key. */
  id: string;
  /** Which platform this profile belongs to. */
  platform: CPPlatformName;
  /** Handle used on the platform, e.g. `"johndoe"`. */
  username: string;
  /** Public profile URL on the platform. */
  profileUrl: string;
  /** Current contest rating as reported by the platform. */
  rating: number;
  /** Total number of problems solved. */
  solved: number;
  /** Rank or tier label, e.g. `"Knight"`. Omitted when unranked. */
  rank?: string;
  /** Badge or award labels earned on the platform. */
  badges: string[];
  /** Path to the platform logo under `public/`. */
  logo: string;
}
