import type { ISODateString } from "./index";

/**
 * A professional certification or credential.
 *
 * Rendered by the homepage `CertificationsSection` preview (featured entries
 * first, falling back to non-featured) and in full on the `/certifications`
 * page. `technologies` holds `Technology.id` references rather than embedded
 * technology objects, so the build-time validation script can verify every id
 * resolves.
 *
 * Requirement 4.7
 */
export interface Certification {
  /** Stable unique identifier, also used as a React key. */
  id: string;
  /** Certification name, e.g. `"AWS Certified Developer – Associate"`. */
  title: string;
  /** Issuing organization, e.g. `"Amazon Web Services"`. */
  issuer: string;
  /** Date the certification was awarded. */
  issueDate: ISODateString;
  /** Date the certification lapses. Omitted when it never expires. */
  expirationDate?: ISODateString;
  /** Issuer-assigned credential/serial number, when published. */
  credentialId?: string;
  /** Public verification URL. Omitted when no credential link exists. */
  credentialUrl?: string;
  /** Path to the badge image under `public/`. */
  badgeImage: string;
  /** `Technology.id` references for the skills this certification covers. */
  technologies: string[];
  /** Whether the certification is prioritized in the homepage preview. */
  featured: boolean;
}
