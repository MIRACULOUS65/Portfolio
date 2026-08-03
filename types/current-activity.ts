import type { ActivityStatus, ISODateString } from "./index";

/**
 * Origin of a resolved {@link CurrentActivity} value.
 *
 * - `"lanyard"` — live Discord presence returned by the Lanyard REST endpoint.
 * - `"static"` — the configured fallback entry from `data/current-activity.ts`,
 *   including the `"Offline"` default used when nothing else can be determined.
 *
 * Requirements 8.2, 8.3, 8.4
 */
export type ActivitySource = "lanyard" | "static";

/**
 * A single resolved snapshot of the developer's current activity.
 *
 * Rendered by the hero `CurrentActivityCard`. The server passes a `static`
 * snapshot as the initial fallback; `useCurrentActivity` replaces it with a
 * `lanyard` snapshot whenever live data is reachable, so live always wins while
 * available and the widget never renders an error state.
 *
 * Every field is a JSON-serializable primitive (no `Date` objects) because the
 * value crosses the Server/Client Component boundary as a prop.
 *
 * Requirement 4.12
 */
export interface CurrentActivity {
  /** Whether this snapshot came from live Lanyard data or the static fallback. */
  source: ActivitySource;
  /** The state displayed by the widget. */
  status: ActivityStatus;
  /** Primary line, e.g. a track name, project name, or `"Offline"`. */
  title: string;
  /** Supporting line, e.g. artist, repository, or game detail. Omitted when there is none. */
  subtitle?: string;
  /** Icon identifier for the status, resolved through the status→presentation map. */
  icon: string;
  /** Optional artwork path or URL, e.g. Spotify album art for the Listening state. */
  image?: string;
  /** ISO 8601 timestamp of when this snapshot was produced. */
  updatedAt: ISODateString;
}
