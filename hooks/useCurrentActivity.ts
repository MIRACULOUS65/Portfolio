"use client";

import { useEffect, useState } from "react";

import { fetchLanyardStatus } from "@/lib/lanyard";
import type { ActivityStatus, CurrentActivity } from "@/types";

/**
 * The Discord user id (snowflake) Lanyard should look up, read from a
 * `NEXT_PUBLIC_`-prefixed env var so it is available in the client bundle
 * (design.md § CurrentActivityWidget Data-Fetching Design, step 2).
 *
 * Referenced as a literal `process.env.NEXT_PUBLIC_...` expression (rather
 * than through a dynamic lookup) because Next.js inlines `NEXT_PUBLIC_*`
 * values at build time by statically matching that exact expression form.
 * Absent or empty in an environment that has not configured Lanyard —
 * `fetchLanyardStatus` already treats an empty id as "not configured" and
 * resolves to `undefined` without attempting a request (Requirement 8.3).
 */
const DISCORD_USER_ID = process.env.NEXT_PUBLIC_LANYARD_DISCORD_USER_ID ?? "";

/**
 * The icon/title/subtitle shown for a given {@link ActivityStatus} when a
 * `CurrentActivity` snapshot does not otherwise specify one — concretely, the
 * hard-coded `"Offline"` snapshot this hook synthesizes itself (tier 3 of the
 * resolution order below) has no upstream source to draw copy from, so it
 * draws it from here (Requirement 8.5).
 *
 * A live Lanyard snapshot (`lib/lanyard.ts`) and a configured static fallback
 * (`data/current-activity.ts`) already carry their own specific `icon`/
 * `title`/`subtitle` — a Spotify track name, a VS Code file, the developer's
 * own fallback copy — which this map does not override; `CurrentActivity`'s
 * fields win whenever a snapshot supplies them. This map exists so that
 * **every** `ActivityStatus`, including the one status this hook can
 * originate on its own, has defined presentation (Property 7).
 *
 * `subtitle` is intentionally omitted for every entry: a generic subtitle
 * ("a game", "a track") would be less honest than no subtitle at all, and
 * `CurrentActivity.subtitle` is optional for exactly this reason.
 */
export interface ActivityPresentation {
  /** `lucide-react` icon name, matching the convention `data/socials.ts` and `lib/lanyard.ts` use. */
  icon: string;
  /** Default primary line for this status. */
  title: string;
  /** Default supporting line for this status, if any. */
  subtitle?: string;
}

export const ACTIVITY_PRESENTATION: Record<ActivityStatus, ActivityPresentation> =
  {
    Listening: { icon: "Music", title: "Listening" },
    Coding: { icon: "Code", title: "Coding" },
    Gaming: { icon: "Gamepad2", title: "Gaming" },
    Idle: { icon: "Moon", title: "Idle" },
    Offline: { icon: "CircleOff", title: "Offline" },
  };

/**
 * Builds the hard-coded `"Offline"` snapshot this hook falls back to when
 * neither live Lanyard data nor a configured static fallback is available
 * (Requirement 8.4, tier 3 of `resolveCurrentActivity`).
 *
 * `source: "static"` — it is authored (by this map), not fetched — matching
 * the `ActivitySource` doc comment's description of the `"Offline"` default.
 * `updatedAt` is computed at call time, the same convention
 * `lib/lanyard.ts#mapLanyardDataToCurrentActivity` uses, so the snapshot never
 * reads as stale.
 */
function createOfflineActivity(): CurrentActivity {
  const presentation = ACTIVITY_PRESENTATION.Offline;

  return {
    source: "static",
    status: "Offline",
    title: presentation.title,
    subtitle: presentation.subtitle,
    icon: presentation.icon,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Resolves the three-tier precedence the CurrentActivityWidget renders
 * (Requirements 8.2, 8.3, 8.4; design.md § CurrentActivityWidget
 * Data-Fetching Design; Property 6):
 *
 * 1. `live` — a Lanyard snapshot (`source: "lanyard"`) — wins whenever it is
 *    defined, i.e. whenever Lanyard was reachable and configured.
 * 2. `fallback` — the server-supplied static snapshot from
 *    `data/current-activity.ts` — used silently, with no visible error, when
 *    `live` is `undefined`.
 * 3. A hard-coded `"Offline"` snapshot, synthesized here — used only when
 *    neither of the above exists, e.g. no `discordUserId` is configured *and*
 *    no `fallback` prop was supplied.
 *
 * Pure and exported on its own so Property 6 (task 20.7) can exercise the
 * precedence directly, without mounting the hook or faking `fetch`.
 */
export function resolveCurrentActivity(
  fallback: CurrentActivity | undefined,
  live: CurrentActivity | undefined,
): CurrentActivity {
  return live ?? fallback ?? createOfflineActivity();
}

/**
 * Resolves the CurrentActivityWidget's displayed state (Requirements 8.1–8.4;
 * design.md § CurrentActivityWidget Data-Fetching Design).
 *
 * Renders `fallback` (or the hard-coded `"Offline"` snapshot, if `fallback` is
 * `undefined`) on every render until the Lanyard fetch settles, so the very
 * first paint already carries meaningful content — `CurrentActivityCard`
 * (task 20.9) uses that window to show its `aria-busy` loading state.
 * On mount, it calls `lib/lanyard.ts#fetchLanyardStatus` exactly once; if that
 * resolves to a defined snapshot, live data replaces the fallback for the rest
 * of the component's lifetime and always wins over it while defined
 * (Requirement 8.2). If it resolves to `undefined` — Lanyard unreachable, not
 * configured, timed out, or returned an unrecognised payload — the hook simply
 * keeps rendering `fallback`, with no error state of any kind
 * (Requirement 8.3).
 *
 * Never throws: `fetchLanyardStatus` already guarantees it never rejects, and
 * the `.catch` below is a second, redundant safety net so a future change to
 * that contract cannot turn into an unhandled rejection or a thrown render
 * error here.
 *
 * @param fallback The server-computed static snapshot
 *   (`data/current-activity.ts`), passed down from the Server Component. May
 *   be `undefined` if the caller has none to offer, in which case tier 3
 *   applies immediately.
 */
export function useCurrentActivity(
  fallback: CurrentActivity | undefined,
): CurrentActivity {
  const [liveActivity, setLiveActivity] = useState<CurrentActivity | undefined>(
    undefined,
  );

  useEffect(() => {
    let isMounted = true;

    fetchLanyardStatus(DISCORD_USER_ID)
      .then((result) => {
        if (isMounted) {
          setLiveActivity(result);
        }
      })
      .catch(() => {
        // `fetchLanyardStatus` never rejects; this is a redundant safety net
        // so this hook's own never-throws contract cannot regress silently.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return resolveCurrentActivity(fallback, liveActivity);
}
