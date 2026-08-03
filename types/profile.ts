/**
 * The developer's personal information, sourced from `data/profile.ts`.
 *
 * Consumed by the homepage HeroSection (photo, name, role, bio, CTA buttons),
 * the ContactSection resume download action, and the Footer. No profile content
 * is hardcoded in JSX (Requirement 4.3).
 *
 * Requirement 4.14
 */
export interface Profile {
  /** Full display name. */
  name: string;
  /** Professional title/headline, e.g. `"Full-Stack Developer"`. */
  role: string;
  /** Short introductory paragraph rendered in the HeroSection. */
  bio: string;
  /** Path to the profile photo under `public/`, rendered by `Avatar`. */
  avatar: string;
  /** Human-readable location, e.g. `"Bengaluru, India"`. */
  location: string;
  /** URL or `public/` path to the downloadable resume. */
  resume: string;
  /** Public contact email address. */
  email: string;
  /** Availability blurb, e.g. `"Open to internships"`. */
  availability: string;
  /** Current employer. Omitted when not applicable. */
  currentCompany?: string;
  /** Years of professional experience. Omitted when not applicable. */
  yearsExperience?: number;
}
