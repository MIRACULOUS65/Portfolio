import * as lucide from "lucide-react";
import { describe, expect, it } from "vitest";

import { currentActivity } from "@/data/current-activity";
import type { ActivityStatus } from "@/types";

/**
 * Guards the contracts `useCurrentActivity` (task 20.6) and
 * `CurrentActivityCard` (task 20.9) rely on: this entry is the *static* tier of
 * the live > fallback > Offline order, it is distinguishable from the hook's
 * `"Offline"` default, and it survives the Server/Client prop boundary
 * (Requirements 4.1, 4.12, 8.3, 8.4).
 */
const ALL_STATUSES: ActivityStatus[] = [
  "Listening",
  "Coding",
  "Gaming",
  "Idle",
  "Offline",
];

describe("currentActivity fallback", () => {
  it("declares itself as the static source, never live data", () => {
    expect(currentActivity.source).toBe("static");
  });

  it("uses a status from ActivityStatus", () => {
    expect(ALL_STATUSES).toContain(currentActivity.status);
  });

  it("is informative rather than the Offline default, so tiers 2 and 3 differ", () => {
    expect(currentActivity.status).not.toBe("Offline");
  });

  it("names a lucide-react icon", () => {
    expect(lucide).toHaveProperty(currentActivity.icon);
  });

  it("carries non-empty display copy", () => {
    expect(currentActivity.title.trim()).not.toBe("");
    expect(currentActivity.subtitle?.trim()).not.toBe("");
  });

  it("omits album art, which only live data can supply", () => {
    expect(currentActivity.image).toBeUndefined();
  });

  it("stores updatedAt as a parseable ISO 8601 string, not a Date", () => {
    expect(typeof currentActivity.updatedAt).toBe("string");
    expect(new Date(currentActivity.updatedAt).toISOString()).toBe(
      currentActivity.updatedAt,
    );
  });

  it("is JSON-serializable, so it can cross the Server/Client boundary", () => {
    expect(JSON.parse(JSON.stringify(currentActivity))).toEqual(
      currentActivity,
    );
  });
});
