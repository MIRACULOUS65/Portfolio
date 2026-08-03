import type { ISODateString } from "./index";

/**
 * A hackathon participation record.
 *
 * Rendered by the Hackathons preview section on the homepage (name, organizer,
 * date, achievement) and in full on the `/hackathons` listing page (achievement,
 * date, technologies).
 *
 * Requirement 4.8
 */
export interface Hackathon {
  id: string;
  slug: string;
  name: string;
  organizer: string;
  description: string;
  date: ISODateString;
  location: string;
  /** Award or placement, when the entry earned one. */
  achievement?: string;
  teamMembers: string[];
  /** `Technology.id` references — validated at build time. */
  technologies: string[];
  images: string[];
  /** Live demo URL for the hackathon project. */
  demo?: string;
  /** Source repository URL for the hackathon project. */
  github?: string;
}
