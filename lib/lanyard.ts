import type { ActivityStatus, CurrentActivity } from "@/types";

/**
 * Live Discord presence fetch for the hero Current Activity widget (design.md
 * § CurrentActivityWidget Data-Fetching Design, step 2; Requirements 8.2, 8.6).
 *
 * This module is plain, framework-agnostic `lib/` code — no `"use client"` —
 * so it is safe to import from either a Server Component or the
 * `useCurrentActivity` Client hook (task 20.6). It never throws: every
 * failure mode (network error, non-OK response, timeout, malformed JSON,
 * an unrecognised payload shape) resolves to `undefined` instead of
 * rejecting, which is the contract `useCurrentActivity` depends on to fall
 * back to the server-supplied static snapshot, and ultimately to `"Offline"`,
 * without ever needing a `catch` of its own (Requirement 8.3, 8.4).
 */

const LANYARD_API_BASE = "https://api.lanyard.rest/v1/users";

/**
 * Abort budget for the REST request. Short enough that a hung or slow
 * endpoint cannot noticeably delay the widget settling on its fallback
 * state, per design.md's "wrapped in try/catch with a short timeout".
 */
const REQUEST_TIMEOUT_MS = 5_000;

/**
 * Discord activity `type` values relevant here, per the Discord Gateway
 * activity object (`0` = "Playing", `2` = "Listening").
 * https://discord.com/developers/docs/topics/gateway-events#activity-object-activity-types
 */
const ACTIVITY_TYPE_GAME = 0;

/**
 * The stable `application_id` Discord assigns to its official "Visual Studio
 * Code" Rich Presence integration. Lanyard reports an active coding session
 * as a `type: 0` ("Playing") activity with this application id, so it has to
 * be distinguished from an actual game by id rather than by type alone.
 */
const VSCODE_APPLICATION_ID = "383226320970055681";
const VSCODE_ACTIVITY_NAME = "Visual Studio Code";

interface LanyardActivity {
  readonly type?: unknown;
  readonly name?: unknown;
  readonly details?: unknown;
  readonly state?: unknown;
  readonly application_id?: unknown;
}

interface LanyardData {
  readonly discord_status?: unknown;
  readonly listening_to_spotify?: unknown;
  readonly spotify?: unknown;
  readonly activities?: unknown;
}

interface LanyardResponse {
  readonly success?: unknown;
  readonly data?: unknown;
}

/* -------------------------------------------------------------------------- */
/*                         Untrusted-payload validation                      */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLanyardResponse(value: unknown): value is LanyardResponse {
  return isRecord(value);
}

function isLanyardData(value: unknown): value is LanyardData {
  return isRecord(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asActivityArray(value: unknown): readonly LanyardActivity[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

/* -------------------------------------------------------------------------- */
/*                          Payload → CurrentActivity                        */
/* -------------------------------------------------------------------------- */

function findCodingActivity(
  activities: readonly LanyardActivity[],
): LanyardActivity | undefined {
  return activities.find(
    (activity) =>
      activity.application_id === VSCODE_APPLICATION_ID ||
      activity.name === VSCODE_ACTIVITY_NAME,
  );
}

function findGameActivity(
  activities: readonly LanyardActivity[],
): LanyardActivity | undefined {
  return activities.find(
    (activity) =>
      activity.type === ACTIVITY_TYPE_GAME &&
      activity.application_id !== VSCODE_APPLICATION_ID &&
      activity.name !== VSCODE_ACTIVITY_NAME,
  );
}

/**
 * Maps Discord's `discord_status` to the subset of `ActivityStatus` values
 * that describe presence rather than a specific activity. There is no
 * `ActivityStatus` for a generic "online, doing nothing in particular", so
 * `"online"`/`"dnd"` without a matched Spotify/coding/game activity collapse
 * to `"Idle"` — the closest honest description available in this project's
 * vocabulary — while `"offline"` (and anything unrecognised) maps to
 * `"Offline"`.
 */
function mapDiscordStatus(discordStatus: unknown): ActivityStatus {
  return discordStatus === "offline" ? "Offline" : "Idle";
}

function mapLanyardDataToCurrentActivity(data: LanyardData): CurrentActivity {
  const updatedAt = new Date().toISOString();
  const activities = asActivityArray(data.activities);
  const spotify = isRecord(data.spotify) ? data.spotify : undefined;

  if (data.listening_to_spotify === true && spotify) {
    const song = asString(spotify.song);
    const artist = asString(spotify.artist);

    if (song) {
      return {
        source: "lanyard",
        status: "Listening",
        title: song,
        subtitle: artist,
        icon: "Music",
        image: asString(spotify.album_art_url),
        updatedAt,
      };
    }
  }

  const codingActivity = findCodingActivity(activities);
  if (codingActivity) {
    const title = asString(codingActivity.details) ?? VSCODE_ACTIVITY_NAME;

    return {
      source: "lanyard",
      status: "Coding",
      title,
      subtitle: asString(codingActivity.state),
      icon: "Code",
      updatedAt,
    };
  }

  const gameActivity = findGameActivity(activities);
  if (gameActivity) {
    const title = asString(gameActivity.name) ?? "Gaming";

    return {
      source: "lanyard",
      status: "Gaming",
      title,
      subtitle: asString(gameActivity.details) ?? asString(gameActivity.state),
      icon: "Gamepad2",
      updatedAt,
    };
  }

  const status = mapDiscordStatus(data.discord_status);

  return {
    source: "lanyard",
    status,
    title: status,
    icon: status === "Offline" ? "CircleOff" : "Moon",
    updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/*                                 Public API                                 */
/* -------------------------------------------------------------------------- */

/**
 * Fetches the given Discord user's live presence from the public Lanyard REST
 * endpoint and maps it to a `CurrentActivity` snapshot with `source:
 * "lanyard"` (Requirement 8.2).
 *
 * Never throws and never rejects. On any failure — an empty/missing user id,
 * a network error, a timeout, a non-OK HTTP response, malformed JSON, or a
 * payload that isn't a successful Lanyard response — this resolves to
 * `undefined` so the caller (`useCurrentActivity`, task 20.6) can fall back
 * to the server-supplied static snapshot without needing its own try/catch.
 *
 * @param discordUserId - The Discord user id (snowflake) to look up.
 */
export async function fetchLanyardStatus(
  discordUserId: string,
): Promise<CurrentActivity | undefined> {
  if (!discordUserId) {
    return undefined;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${LANYARD_API_BASE}/${encodeURIComponent(discordUserId)}`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      return undefined;
    }

    const payload: unknown = await response.json();

    if (
      !isLanyardResponse(payload) ||
      payload.success !== true ||
      !isLanyardData(payload.data)
    ) {
      return undefined;
    }

    return mapLanyardDataToCurrentActivity(payload.data);
  } catch {
    // Network error, abort/timeout, or a `response.json()` parse failure all
    // land here — every failure mode degrades to `undefined` (Requirement 8.3).
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}
