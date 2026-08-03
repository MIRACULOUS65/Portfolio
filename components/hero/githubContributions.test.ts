import { describe, expect, it } from "vitest";

import {
  type ContributionDay,
  currentStreak,
  longestStreak,
  totalContributions,
} from "@/components/hero/githubContributions";

function day(date: string, count: number): ContributionDay {
  const level = count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 9 ? 3 : 4;
  return { date, count, level };
}

describe("totalContributions", () => {
  it("sums the count field across all days", () => {
    const days = [day("2025-01-01", 1), day("2025-01-02", 3), day("2025-01-03", 0)];
    expect(totalContributions(days)).toBe(4);
  });

  it("returns 0 for an empty list", () => {
    expect(totalContributions([])).toBe(0);
  });
});

describe("currentStreak", () => {
  it("counts consecutive nonzero days walking back from the end", () => {
    const days = [
      day("2025-01-01", 1),
      day("2025-01-02", 0),
      day("2025-01-03", 2),
      day("2025-01-04", 1),
      day("2025-01-05", 3),
    ];
    expect(currentStreak(days)).toBe(3);
  });

  it("is 0 when the most recent day has no contributions", () => {
    const days = [day("2025-01-01", 5), day("2025-01-02", 0)];
    expect(currentStreak(days)).toBe(0);
  });

  it("equals the full length when every day is nonzero", () => {
    const days = [day("2025-01-01", 1), day("2025-01-02", 1), day("2025-01-03", 1)];
    expect(currentStreak(days)).toBe(3);
  });

  it("is 0 for an empty list", () => {
    expect(currentStreak([])).toBe(0);
  });
});

describe("longestStreak", () => {
  it("finds the longest run of consecutive nonzero days anywhere in the list", () => {
    const days = [
      day("2025-01-01", 1),
      day("2025-01-02", 1),
      day("2025-01-03", 0),
      day("2025-01-04", 1),
      day("2025-01-05", 1),
      day("2025-01-06", 1),
      day("2025-01-07", 0),
    ];
    expect(longestStreak(days)).toBe(3);
  });

  it("is 0 when every day has no contributions", () => {
    const days = [day("2025-01-01", 0), day("2025-01-02", 0)];
    expect(longestStreak(days)).toBe(0);
  });

  it("is 0 for an empty list", () => {
    expect(longestStreak([])).toBe(0);
  });
});
