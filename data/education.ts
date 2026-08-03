import type { Education } from "@/types";

/**
 * Education history entries — the sole source of academic content for the
 * homepage EducationSection (Requirements 4.1, 4.9).
 *
 * Ordering note: this array is deliberately **not** stored in chronological
 * order. Ordering is a presentation concern owned by
 * `getEducationSortedByDate()` in `lib/data-access.ts` (Requirement 15.2), so
 * the source order here is authoring order only. Every `startDate` is distinct
 * (no ties), which keeps the sorted result unambiguous.
 *
 * The last entry omits `endDate`, which the `Education` model defines as
 * "ongoing" — consumers render that as "Present".
 *
 * `logo` points at the real Techno India University logo committed under
 * `public/images/education/`.
 */
export const education: Education[] = [
  {
    id: "techno-india-university-btech-cse",
    institution: "Techno India University",
    degree: "Bachelor of Technology",
    specialization: "Computer Science Engineering",
    startDate: "2024-08-01",
    // No endDate: currently in progress.
    achievements: [
      "AIR 5270 in WBJEE 2024 (among 0.15 million candidates)",
      "AIR 19000 in JEE Main 2024 (among 1.2 million candidates)",
    ],
    coursework: [
      "Data Structures and Algorithms",
      "Object-Oriented Programming",
      "Database Management Systems",
      "Operating Systems",
      "Computer Networks",
    ],
    logo: "/images/education/techno-india-university.png",
  },
];
