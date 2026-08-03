import type { CurrentActivity } from "@/types";

/**
 * The static configured fallback for the hero Current Activity widget
 * (Requirements 4.1, 4.12, 8.3, 8.4).
 *
 * `app/page.tsx` reads this synchronously and passes it to
 * `CurrentActivityCard` as its `fallback` prop, so the very first paint carries
 * meaningful content with no client JS executed and no layout shift. On mount,
 * `useCurrentActivity` swaps in live Lanyard data whenever the endpoint is
 * reachable. The full resolution order is therefore:
 *
 * 1. live Lanyard snapshot (`source: "lanyard"`) — always wins while available
 *    (Requirement 8.2)
 * 2. **this entry** — shown silently, with no visible error, when Lanyard is
 *    unreachable or unconfigured (Requirement 8.3)
 * 3. a hard-coded `"Offline"` default synthesised by the hook when neither of
 *    the above can be determined (Requirement 8.4)
 *
 * Tier 3 is the hook's business, not this file's; nothing here should be
 * confused with it.
 *
 * ## Why `source: "static"`
 *
 * By definition: this value is authored, not fetched. `ActivitySource` is what
 * lets `CurrentActivityCard` and Property 6 tell the three tiers apart, so a
 * static entry claiming `"lanyard"` would make the precedence rule untestable.
 *
 * ## Why `status: "Coding"` and not `"Offline"`
 *
 * Requirements 8.3 and 8.4 describe two *different* degradations: 8.3 shows
 * "a static fallback status", 8.4 falls back to `"Offline"` only when no
 * configured fallback exists. Authoring this entry as `"Offline"` would
 * collapse the two into one observable outcome — tier 2 and tier 3 would render
 * identically, Requirement 8.3 would carry no information beyond 8.4, and
 * Property 6 could no longer distinguish "fallback was used" from "defaulted to
 * Offline". A configured fallback should therefore say something true and
 * useful about the developer, which is exactly the value 8.3 adds over 8.4.
 *
 * `"Coding"` is the honest choice among the informative statuses. `"Listening"`
 * and `"Gaming"` assert a specific in-progress session (a named track, a named
 * game) that a hard-coded value cannot possibly have right, and `"Idle"` is
 * barely distinguishable from `"Offline"`. The copy below stays evergreen — a
 * standing habit rather than a claim about this minute — so it never reads as
 * stale when live data is down.
 *
 * ## Field conventions
 *
 * - `icon` is a `lucide-react` icon **name** string, matching the convention
 *   `data/socials.ts` established, since Lucide is the project's exclusive icon
 *   library (Requirement 1.6). `"Code"` is used rather than the `Code2` alias,
 *   which upstream has since renamed to `CodeXml`. `CurrentActivityCard` may
 *   still prefer its status→presentation map (task 20.6) for the rendered
 *   glyph; this field is the per-entry override that keeps the data
 *   self-describing.
 * - `image` is **omitted**. It exists for Listening-state album art, which only
 *   live data can supply; a committed artwork path would render a picture of
 *   something that is not playing.
 * - `subtitle` and `image` are the only optional fields, so every other field is
 *   present and the widget can render without any defaulting.
 * - Every value is a JSON-serializable primitive because this object crosses the
 *   Server/Client boundary as a prop. `updatedAt` is consequently an ISO 8601
 *   string, never a `Date`. Unlike the `"YYYY-MM-DD"` dates elsewhere in
 *   `data/`, it carries a time component: it is a snapshot timestamp compared
 *   against live Lanyard values produced by `Date#toISOString`, and day
 *   granularity would make a fallback look a day stale the moment it is used.
 *
 * Placeholder content for the template: replace the copy with your own standing
 * activity.
 */
export const currentActivity: CurrentActivity = {
  source: "static",
  status: "Coding",
  title: "Grinding VS Code",
  subtitle: "Mostly TypeScript, Next.js, and refactors nobody asked for",
  icon: "Code",
  updatedAt: "2026-01-05T09:30:00.000Z",
};
