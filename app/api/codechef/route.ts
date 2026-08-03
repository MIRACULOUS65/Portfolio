import { NextResponse } from "next/server";

import { getCodeChefProfile } from "@/lib/codechef";

/**
 * `GET /api/codechef` — returns the CodeChef profile for the portfolio
 * owner's username. Exists for potential client-side/external use;
 * `CompetitiveProgrammingSection` calls `lib/codechef.ts` directly rather
 * than round-tripping through this route. `getCodeChefProfile` never
 * throws, so this route always returns `200` with either real or
 * placeholder (zeroed) data.
 */
export const revalidate = 3600;

const CODECHEF_USERNAME = "sushovan_680";

export async function GET() {
  const profile = await getCodeChefProfile(CODECHEF_USERNAME);
  return NextResponse.json(profile);
}
