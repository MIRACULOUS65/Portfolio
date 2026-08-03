/**
 * Project entity types and the Featured Projects configuration.
 *
 * Requirements 4.4, 4.5
 */

import type { ISODateString, SEOFields } from "./index";

/**
 * Fixed set of project categories used by the ProjectsPage category filter.
 */
export type ProjectCategory =
  "Web" | "Mobile" | "AI/ML" | "Web3" | "Tooling" | "Other";

/**
 * Lifecycle status of a project, used by the ProjectsPage status filter.
 */
export type ProjectStatus =
  "In Progress" | "Completed" | "Archived" | "Maintained";

/**
 * A single portfolio project. This is the core content entity shared by the
 * homepage FeaturedProjectsSection, the ProjectsPage, and the
 * ProjectDetailPage — no project data is duplicated between them
 * (Requirement 4.16).
 *
 * Extends {@link SEOFields} to inherit the optional `metaTitle` /
 * `metaDescription` overrides.
 *
 * Requirement 4.4
 */
export interface Project extends SEOFields {
  // General
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;

  // Media
  thumbnail: string;
  heroImage: string;
  gallery: string[];
  /** YouTube video id consumed by the Featured Projects VideoPlayer. */
  youtubeVideoId?: string;

  // Links
  github?: string;
  liveDemo?: string;
  documentation?: string;

  // Dates
  startDate: ISODateString;
  completionDate?: ISODateString;

  // Metadata
  featured: boolean;
  pinned: boolean;
  archived: boolean;

  // Technology
  /** `Technology.id` references — never embedded Technology objects. */
  technologies: string[];

  // Content
  features: string[];
  challenges: string[];
  learnings: string[];
  architecture: string[];
  screenshots: string[];

  // Related
  /** `Project.id` references — never embedded Project objects. */
  relatedProjects: string[];

  // Future (reserved, optional)
  downloads?: string[];
  changelog?: string[];
}

/**
 * A single featured-project reference. Holds only a `Project.id` plus its
 * display order, so featured content never duplicates Project data.
 *
 * Requirement 4.5
 */
export interface FeaturedProjectEntry {
  /** `Project.id` reference — no duplicated Project data. */
  projectId: string;
  /** Display order; the lowest `order` is the default selection. */
  order: number;
}

/**
 * The Featured Projects dataset: any number of id-only references, resolved
 * against `getAllProjects()` and ordered by `order` at read time.
 *
 * Requirement 4.5
 */
export type FeaturedProjectsConfig = FeaturedProjectEntry[];
