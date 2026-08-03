import { NextResponse } from "next/server";

import { getCodeforcesProfile } from "@/lib/codeforces";

/**
 * `GET /api/codeforces` — returns the Codeforces profile for the portfolio
 * owner's handle. Exists for potential client-side/external use;
 * `CompetitiveProgrammingSection` calls `lib/codeforces.ts` directly rather
 * than round-tripping through this route.
 */
export const revalidate = 3600;

const CODEFORCES_HANDLE = "sushovan1908";

export async function GET() {
  try {
    const profile = await getCodeforcesProfile(CODEFORCES_HANDLE);
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
