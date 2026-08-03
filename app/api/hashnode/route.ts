import { NextResponse } from "next/server";

import { getLatestHashnodeBlogs } from "@/lib/hashnode";

/**
 * `GET /api/hashnode` — returns the latest posts from the portfolio owner's
 * Hashnode publication. Exists for potential client-side/external use;
 * `BlogPreviewSection` calls `lib/hashnode.ts` directly rather than
 * round-tripping through this route. `getLatestHashnodeBlogs` never throws,
 * so this route always returns `200` with either real posts or `[]`.
 */
export const revalidate = 3600;

export async function GET() {
  const posts = await getLatestHashnodeBlogs();
  return NextResponse.json(posts);
}
