import type { CompetitiveProgrammingPlatform } from "@/types";

/**
 * Competitive programming profiles shown on the homepage
 * (Requirements 4.1, 4.10, 13.1, 13.2).
 *
 * `CPPlatformName` is a closed union of `"LeetCode" | "Codeforces" |
 * "CodeChef"`, and `CompetitiveProgrammingSection` renders exactly one
 * `PlatformCard` per platform, so this array holds exactly three entries — one
 * for each union member, with no duplicates and none missing.
 *
 * ## Real profiles, last-known-good static fallback
 *
 * `CompetitiveProgrammingSection` fetches live data for all three platforms at
 * render time (`lib/leetcode.ts`, `lib/codeforces.ts`, `lib/codechef.ts`) and
 * only falls back to this dataset's `rating`/`solved`/`rank` values, per
 * platform, when that platform's live fetch fails — so the numbers below are a
 * last-known-good snapshot rather than the numbers a visitor normally sees.
 * `username`, `profileUrl`, and `logo` are otherwise the real, live values.
 *
 * Conventions for `data/`:
 * - Single named export, typed as the array of the matching `types/` model.
 * - Stable kebab-case `id` values (`cp-<platform>`), used as React keys.
 * - `logo` is a root-relative path under `public/images/competitive-programming/`.
 *   LeetCode and Codeforces share one photo (`leetcode-codeforces.webp`); CodeChef
 *   has its own (`codechef.webp`).
 */
export const competitiveProgramming: CompetitiveProgrammingPlatform[] = [
  {
    id: "cp-leetcode",
    platform: "LeetCode",
    username: "Ayanokoji_65",
    profileUrl: "https://leetcode.com/u/Ayanokoji_65",
    rating: 1685,
    solved: 52,
    rank: undefined,
    badges: [],
    logo: "/images/competitive-programming/leetcode-codeforces.webp",
  },
  {
    id: "cp-codeforces",
    platform: "Codeforces",
    username: "sushovan1908",
    profileUrl: "https://codeforces.com/profile/sushovan1908",
    rating: 369,
    solved: 4,
    rank: "Newbie",
    badges: [],
    logo: "/images/competitive-programming/leetcode-codeforces.webp",
  },
  {
    id: "cp-codechef",
    platform: "CodeChef",
    username: "sushovan_680",
    profileUrl: "https://www.codechef.com/users/sushovan_680",
    rating: 1511,
    solved: 61,
    rank: "2★",
    badges: [],
    logo: "/images/competitive-programming/codechef.webp",
  },
];
