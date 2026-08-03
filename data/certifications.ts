import type { Certification } from "@/types";

/**
 * Professional certification entries — the sole source of credential content
 * for the homepage CertificationsSection preview and the `/certifications`
 * listing page (Requirements 4.1, 4.7, 12.1, 12.2, 12.3, 21.3, 21.4).
 *
 * Follows the `data/technologies.ts` conventions: one named export typed
 * against the entity from the `@/types` barrel, no default export, data only
 * (selection and ordering live in `lib/data-access.ts`), stable kebab-case ids.
 *
 * These are the real, currently-held certifications:
 *
 * 1. 100xDevs Cohort 3 (Web Development, DevOps & Blockchain) — issued
 *    January 2026, verifiable via the Google Drive certificate link.
 * 2. Udemy "Complete Web Development Course" — issued August 2026.
 * 3. Udemy "Python Bootcamp" — issued November 2025.
 *
 * All three carry `featured: true` since there is no larger real pool to
 * curate a subset from yet; `getFeaturedCertifications()` caps the homepage
 * preview at 3, so all three render there, and `/certifications` renders the
 * same three via `getAllCertifications()`.
 */
export const certifications: Certification[] = [
  {
    id: "100xdevs-cohort-3",
    title: "100xDevs Cohort 3 – Web Development, DevOps & Blockchain",
    issuer: "100xDevs",
    issueDate: "2026-01-01",
    credentialUrl:
      "https://drive.google.com/file/d/1JxRSYH2jMN1uEF4cgUTcp1UtXtoaZh7v/view",
    badgeImage: "/images/certifications/100xdevs-cohort-3.webp",
    technologies: ["typescript", "react", "nextjs", "nodejs", "docker", "aws"],
    featured: true,
  },
  {
    id: "udemy-complete-web-development-course",
    title: "Complete Web Development Course",
    issuer: "Udemy",
    issueDate: "2026-08-01",
    credentialUrl:
      "https://www.udemy.com/certificate/UC-26fc1b8c-0d65-457c-b56b-6aa5e8c09f6b/",
    badgeImage: "/images/certifications/udemy-web-dev.webp",
    technologies: ["html5", "css3", "javascript", "nodejs"],
    featured: true,
  },
  {
    id: "udemy-python-bootcamp",
    title: "Python Bootcamp",
    issuer: "Udemy",
    issueDate: "2025-11-01",
    credentialUrl:
      "https://www.udemy.com/certificate/UC-66af88e6-5986-4bb3-9d44-9671720e2eb2/",
    badgeImage: "/images/certifications/udemy-python-bootcamp.webp",
    technologies: ["python"],
    featured: true,
  },
];
