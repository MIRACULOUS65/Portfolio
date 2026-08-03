/**
 * A single Navbar link.
 *
 * The Navbar renders its link set dynamically from `data/navigation.ts` rather
 * than hardcoding anchors in JSX (Requirement 4.13). Every homepage link is a
 * same-page anchor: clicking one smooth-scrolls to the matching
 * `<section id={sectionId}>` instead of performing a route navigation, and
 * `href` is only used as the `router.push` target (`"/#hero"`) when the visitor
 * is not currently on the homepage.
 *
 * The fixed homepage section ids are `hero`, `projects`, `blog`, `tech-stack`,
 * `certifications`, `competitive-programming`, `hackathons`, `education`, and
 * `contact`.
 *
 * Requirement 4.13
 */
export interface NavigationItem {
  /** Stable unique identifier, also used as a React key. */
  id: string;
  /** Visible link text, e.g. `"Projects"`. */
  label: string;
  /**
   * Anchor target for the link, e.g. `"#projects"` for a homepage section or
   * `"/projects"` for a dedicated page.
   */
  href: string;
  /**
   * Id of the target `<section>` element, e.g. `"projects"` (no `#` prefix).
   * Matched against the id reported by `useActiveSection()` to highlight
   * exactly one link as active.
   */
  sectionId: string;
  /** Display order within the Navbar; lower values render first. */
  order: number;
  /** Whether the link is rendered. Hidden items are omitted entirely. */
  visible: boolean;
}
