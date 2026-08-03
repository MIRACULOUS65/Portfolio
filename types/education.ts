import type { ISODateString } from "./index";

/**
 * A single education history entry (degree, diploma, or schooling).
 *
 * Rendered by the homepage EducationSection, ordered chronologically by
 * `startDate` via `getEducationSortedByDate()`.
 *
 * Requirement 4.9
 */
export interface Education {
  id: string;
  institution: string;
  degree: string;
  specialization?: string;
  startDate: ISODateString;
  /** Absent/undefined = ongoing. */
  endDate?: ISODateString;
  grade?: string;
  achievements: string[];
  coursework: string[];
  logo: string;
}
