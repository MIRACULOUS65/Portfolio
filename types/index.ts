/**
 * Barrel module for the portfolio data layer types.
 *
 * Declares the shared primitives consumed by every entity type under `types/`
 * and by the typed data modules under `data/`, then re-exports every entity
 * type so consumers import from a single `@/types` entry point
 * (Requirement 4.1).
 *
 * Entity modules import the primitives from `./index`, so this file forms a
 * type-level cycle with them. Every re-export below is `export type`, which is
 * erased at compile time — no value bindings are emitted and no runtime cycle
 * can form.
 */

/**
 * A date encoded as an ISO 8601 calendar date string (`"YYYY-MM-DD"`).
 *
 * Stored as a string so data files stay JSON-serializable across the
 * Server/Client Component boundary.
 */
export type ISODateString = string;

/**
 * Fixed set of technology categories rendered as TechStack marquee rows.
 *
 * Requirement 4.11
 */
export type TechCategory =
  "Frontend" | "Backend" | "Database" | "DevOps" | "AI/ML" | "Web3";

/**
 * Status reported by the Current Activity widget.
 *
 * Requirement 4.12
 */
export type ActivityStatus =
  "Listening" | "Coding" | "Gaming" | "Idle" | "Offline";

/**
 * Supported social platforms for profile links.
 *
 * Requirement 4.14
 */
export type SocialPlatform =
  "GitHub" | "LinkedIn" | "X" | "Email" | "Discord" | "Portfolio";

/**
 * Optional per-entity SEO overrides. When omitted, page metadata falls back to
 * the site-level defaults.
 */
export interface SEOFields {
  metaTitle?: string;
  metaDescription?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Entity re-exports                             */
/* -------------------------------------------------------------------------- */

export type {
  Project,
  ProjectCategory,
  ProjectStatus,
  FeaturedProjectEntry,
  FeaturedProjectsConfig,
} from "./project";
export type { Blog } from "./blog";
export type { Certification } from "./certification";
export type { Hackathon } from "./hackathon";
export type { Education } from "./education";
export type {
  CPPlatformName,
  CompetitiveProgrammingPlatform,
} from "./competitive-programming";
export type { Technology } from "./technology";
export type { ActivitySource, CurrentActivity } from "./current-activity";
export type { NavigationItem } from "./navigation";
export type { Profile } from "./profile";
export type { Social } from "./social";
export type { SiteConfig } from "./site";
