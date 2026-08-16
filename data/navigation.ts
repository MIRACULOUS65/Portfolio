import type { NavigationItem } from "@/types";

/**
 * Navbar link set (Requirements 4.1, 4.13).
 *
 * The Navbar renders these items dynamically — sorted by `order`, filtered to
 * `visible` — instead of hardcoding anchors in JSX, and `useActiveSection()`
 * matches its reported id against `sectionId` to highlight exactly one link
 * (Requirement 5.5).
 *
 * ## Six full-viewport groups
 *
 * The homepage is grouped into six full-viewport-height sections
 * (`app/page.tsx`), each with exactly one Navbar entry pointing at the
 * group's outer wrapper id:
 *
 * - `hero` — Hero only.
 * - `projects` — Featured Projects only.
 * - `tech-stack` — Tech Stack + Competitive Programming (the latter keeps its
 *   own `#competitive-programming` anchor nested inside, with no separate nav
 *   entry).
 * - `blog` — Blog Preview + Certifications (the latter nested, no separate
 *   nav entry).
 * - `hackathon` — Hackathons only.
 * - `connect` — Education + Contact (the former nested, no separate nav
 *   entry).
 *
 * Every entry but one targets a homepage section, so `href` is `#<sectionId>`
 * for those; activating one of those links on the homepage smooth-scrolls
 * rather than navigating (Requirement 5.2), and `href` is otherwise used as a
 * `router.push` target (`"/#hero"`) from a dedicated page (Requirement 5.9).
 *
 * `recommendation` is the one exception: it points at a real dedicated route
 * (`/recommendation`) rather than a homepage hash, since Recommendations is
 * its own page, not a homepage section. `components/navbar/Navbar.tsx`
 * special-cases any `href` that does not start with `"#"`/`"/#"` to render as
 * an ordinary route link with no scroll-handling logic.
 */
export const navigation: NavigationItem[] = [
  {
    id: "nav-home",
    label: "Home",
    href: "#hero",
    sectionId: "hero",
    order: 1,
    visible: true,
  },
  {
    id: "nav-projects",
    label: "Projects",
    href: "#projects",
    sectionId: "projects",
    order: 2,
    visible: true,
  },
  {
    id: "nav-tech-stack",
    label: "Tech Stack",
    href: "#tech-stack",
    sectionId: "tech-stack",
    order: 3,
    visible: true,
  },
  {
    id: "nav-blog",
    label: "Blog",
    href: "#blog",
    sectionId: "blog",
    order: 4,
    visible: true,
  },
  {
    id: "nav-hackathon",
    label: "Hackathon",
    href: "#hackathon",
    sectionId: "hackathon",
    order: 5,
    visible: true,
  },
  {
    id: "nav-recommendation",
    label: "Recommendation",
    // A real route, not a homepage hash anchor — Recommendations now lives at
    // its own dedicated page (`app/recommendation/page.tsx`) rather than as a
    // homepage section. `sectionId` still names a value (harmless: it just
    // never matches a homepage section, so `useActiveSection()` never
    // highlights this link, which is the correct behaviour for a page link).
    href: "/recommendation",
    sectionId: "recommendation",
    order: 6,
    visible: false, // Hidden for now
  },
  {
    id: "nav-connect",
    label: "Connect",
    href: "#connect",
    sectionId: "connect",
    order: 7,
    visible: true,
  },
];
