import { PlatformCard } from "@/components/competitive-programming/PlatformCard";
import { Section } from "@/components/shared/Section";
import { competitiveProgramming } from "@/data/competitive-programming";
import { getCodeChefProfile } from "@/lib/codechef";
import { getCodeforcesProfile } from "@/lib/codeforces";
import { getLeetCodeProfile } from "@/lib/leetcode";
import type { CompetitiveProgrammingPlatform } from "@/types";

/**
 * The Homepage's CompetitiveProgrammingSection (Requirements 13.1, 13.2,
 * design.md "CertificationsSection / CompetitiveProgrammingSection / ...").
 *
 * Async Server Component: fetches live LeetCode, Codeforces, and CodeChef
 * profiles concurrently via `Promise.all()` and renders one `PlatformCard`
 * per platform with real numbers, falling back to the last-known static
 * values in `data/competitive-programming.ts` — per platform — when that
 * platform's live fetch fails. A single platform's failure never crashes the
 * section or affects the other two platforms' live data.
 */
export async function CompetitiveProgrammingSection() {
  const platforms = await resolvePlatforms();

  return (
    <Section
      id="competitive-programming"
      title="Competitive Programming"
      className="py-6! lg:py-8!"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <PlatformCard key={platform.id} platform={platform} />
        ))}
      </div>
    </Section>
  );
}

/**
 * Resolves the three `CompetitiveProgrammingPlatform` records `PlatformCard`
 * renders, preferring live data and falling back to the static dataset entry
 * for whichever platform's fetch rejects. `getCodeChefProfile` never
 * rejects (see `lib/codechef.ts`), but its `Promise.allSettled` branch is
 * handled the same way as the other two for symmetry and in case that
 * contract ever changes.
 */
async function resolvePlatforms(): Promise<
  readonly CompetitiveProgrammingPlatform[]
> {
  const leetcodeStatic = findStatic("LeetCode");
  const codeforcesStatic = findStatic("Codeforces");
  const codechefStatic = findStatic("CodeChef");

  const [leetcodeResult, codeforcesResult, codechefResult] =
    await Promise.allSettled([
      getLeetCodeProfile(leetcodeStatic.username),
      getCodeforcesProfile(codeforcesStatic.username),
      getCodeChefProfile(codechefStatic.username),
    ]);

  return [
    resolveLeetCode(leetcodeResult, leetcodeStatic),
    resolveCodeforces(codeforcesResult, codeforcesStatic),
    resolveCodeChef(codechefResult, codechefStatic),
  ];
}

function findStatic(
  platform: CompetitiveProgrammingPlatform["platform"],
): CompetitiveProgrammingPlatform {
  const entry = competitiveProgramming.find((p) => p.platform === platform);

  if (!entry) {
    throw new Error(
      `CompetitiveProgrammingSection: no static fallback entry for "${platform}"`,
    );
  }

  return entry;
}

function resolveLeetCode(
  result: PromiseSettledResult<Awaited<ReturnType<typeof getLeetCodeProfile>>>,
  fallback: CompetitiveProgrammingPlatform,
): CompetitiveProgrammingPlatform {
  if (result.status !== "fulfilled") {
    return fallback;
  }

  const profile = result.value;

  return {
    ...fallback,
    rating: profile.rating ?? fallback.rating,
    solved: profile.totalSolved,
    rank: fallback.rank,
  };
}

function resolveCodeforces(
  result: PromiseSettledResult<
    Awaited<ReturnType<typeof getCodeforcesProfile>>
  >,
  fallback: CompetitiveProgrammingPlatform,
): CompetitiveProgrammingPlatform {
  if (result.status !== "fulfilled") {
    return fallback;
  }

  const profile = result.value;

  return {
    ...fallback,
    rating: profile.rating ?? fallback.rating,
    solved: profile.solvedCount,
    rank: profile.rank ?? fallback.rank,
  };
}

function resolveCodeChef(
  result: PromiseSettledResult<Awaited<ReturnType<typeof getCodeChefProfile>>>,
  fallback: CompetitiveProgrammingPlatform,
): CompetitiveProgrammingPlatform {
  if (result.status !== "fulfilled") {
    return fallback;
  }

  const profile = result.value;

  // `getCodeChefProfile` never rejects — a fully zeroed placeholder (its own
  // failure mode) is treated the same as a rejection, since a zeroed live
  // profile is a worse result than the last-known-good static fallback.
  const isPlaceholder = profile.rating === 0 && profile.solvedCount === 0;

  if (isPlaceholder) {
    return fallback;
  }

  return {
    ...fallback,
    rating: profile.rating,
    solved: profile.solvedCount,
    rank: profile.stars ?? fallback.rank,
  };
}
