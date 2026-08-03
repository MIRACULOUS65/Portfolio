import { NextResponse } from "next/server";

import { getLeetCodeProfile } from "@/lib/leetcode";

/**
 * `GET /api/leetcode` — returns the LeetCode profile for the portfolio
 * owner's username. Exists for potential client-side/external use;
 * `CompetitiveProgrammingSection` calls `lib/leetcode.ts` directly rather
 * than round-tripping through this route.
 */
export const revalidate = 3600;

const LEETCODE_USERNAME = "Ayanokoji_65";

export async function GET() {
  try {
    const profile = await getLeetCodeProfile(LEETCODE_USERNAME);
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
