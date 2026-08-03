import { Code } from "lucide-react";

import { cn } from "@/utils/cn";
import type { Technology } from "@/types";

/**
 * A single technology tag inside a `TechCategoryRow` marquee (Requirement
 * 11.7, Component_Specification §8 "TechBadge — Icon, Name").
 *
 * ## Own markup — a bordered chip, not the shared `Badge`
 *
 * Unlike the technology badge lists in `ProjectDetails`, certifications, and
 * hackathons (which render through `components/shared/Badge.tsx`),
 * `TechBadge` renders its own bordered chip so the marquee can carry a
 * dedicated hover treatment: the whole chip gets a border/background
 * emphasis on hover, and the brand icon fades in from grayscale on that same
 * hover (`group-hover/item:grayscale-0`) — an effect specific to this
 * marquee, not shared with the generic `Badge`.
 *
 * ## Icon resolution: Simple Icons CDN, with a graceful Lucide fallback
 *
 * `public/images/tech/` is committed empty and no per-tech local SVG asset
 * exists yet, so rather than wait on that asset pass, this resolves a real
 * brand logo from the Simple Icons CDN (`https://cdn.simpleicons.org/<slug>`)
 * as a plain `<img>` — the same externally-hosted-image pattern
 * `GitHubContributionCard`'s embed and `image-auto-slider.tsx`'s Unsplash
 * images already establish in this codebase. `TechBadge` is rendered inside
 * the Client `TechCategoryRow`, so a plain `<img>` (not `next/image`) is used
 * deliberately — same reasoning this file previously documented for avoiding
 * a server-only `node:fs` import.
 *
 * {@link SIMPLE_ICON_SLUG_OVERRIDES} maps the handful of `Technology.id`
 * values whose Simple Icons slug does not equal the id itself (e.g. `nextjs`
 * → `nextdotjs`, `nodejs` → `nodedotjs`, `cpp` → `cplusplus`, `vuejs` →
 * `vuedotjs`, `scikit-learn` → `scikitlearn`). Every id not listed there is
 * assumed to equal its own slug (`react`, `typescript`, `docker`, ... — true
 * for the large majority of `data/technologies.ts`'s entries).
 *
 * A handful of technologies in the dataset (`sql`, `evm`, `aws`, `metamask`,
 * `hardhat`, `wagmi`, `web3js` is the one exception that *does* resolve, as
 * `web3dotjs`) have **no** Simple Icons mark at all — confirmed against the
 * published slug list rather than guessed — and keep the neutral Lucide
 * `Code` glyph via {@link NO_SIMPLE_ICON_IDS} instead of a link that would
 * 404. This mirrors the fallback reasoning `SocialLinks`/
 * `GitHubContributionCard`/`CurrentActivityCard` already document for their
 * own brand-icon gaps.
 *
 * Both the `<img>` and the fallback glyph render `aria-hidden`, so
 * `technology.name` remains the chip's sole accessible text either way
 * (Requirement 11.7: "an icon and the technology name" — the icon itself
 * carries no independent accessible content).
 *
 * Purely presentational Server Component: no state, no effects, no data
 * access — `TechBadge` receives an already-resolved `Technology` record and
 * renders it, the same contract `BlogCard` and `CertificationCard` follow for
 * their own entity props.
 */
export interface TechBadgeProps {
  /** The technology to render. Sourced by the caller from `lib/data-access.ts`. */
  technology: Technology;
  /** Extra utilities merged onto the badge; conflicting classes win (see `cn`). */
  className?: string;
}

/**
 * `Technology.id` → Simple Icons slug, for the ids whose slug does not equal
 * the id itself. Verified against the published Simple Icons slug list
 * (`simple-icons/simple-icons`'s `slugs.md`) rather than guessed.
 */
const SIMPLE_ICON_SLUG_OVERRIDES: Readonly<Record<string, string>> = {
  nextjs: "nextdotjs",
  nodejs: "nodedotjs",
  cpp: "cplusplus",
  vuejs: "vuedotjs",
  "scikit-learn": "scikitlearn",
  "framer-motion": "framer",
  "github-actions": "githubactions",
  "ethers-js": "ethers",
  web3js: "web3dotjs",
  css3: "css",
};

/**
 * `Technology.id`s confirmed to have **no** Simple Icons mark at all (checked
 * against the published slug list, not guessed). These keep the Lucide
 * `Code` fallback rather than link an image that would 404.
 */
const NO_SIMPLE_ICON_IDS: ReadonlySet<string> = new Set([
  "sql",
  "aws",
  "evm",
  "metamask",
  "hardhat",
]);

/** Resolves a `Technology.id` to its Simple Icons CDN slug, or `null` when none exists. */
function resolveSimpleIconSlug(id: string): string | null {
  if (NO_SIMPLE_ICON_IDS.has(id)) {
    return null;
  }

  return SIMPLE_ICON_SLUG_OVERRIDES[id] ?? id;
}

/** Grayscale-to-colour reveal shared by both the `<img>` and the Lucide fallback. */
const ICON_HOVER_CLASSES =
  "grayscale group-hover/item:grayscale-0 transition-all duration-500";

export function TechBadge({ technology, className }: TechBadgeProps) {
  const { id, name } = technology;
  const slug = resolveSimpleIconSlug(id);

  const icon =
    slug !== null ? (
      /* Third-party brand logo from cdn.simpleicons.org: not a local
         `public/` asset, same externally-hosted-image pattern as
         GitHubContributionCard's embed. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://cdn.simpleicons.org/${slug}`}
        alt=""
        aria-hidden="true"
        className={cn("size-6 object-contain", ICON_HOVER_CLASSES)}
      />
    ) : (
      <Code aria-hidden="true" className={cn("size-6", ICON_HOVER_CLASSES)} />
    );

  return (
    <div
      data-slot="tech-badge"
      className={cn(
        "group/item flex items-center gap-3 rounded-md border border-border bg-card/30 px-4 py-2 backdrop-blur-sm transition-all duration-300 hover:border-foreground/50 hover:bg-card/50",
        className,
      )}
    >
      <span className="relative size-6 shrink-0">{icon}</span>
      <span className="text-foreground text-sm tracking-tight whitespace-nowrap md:text-base">
        {name}
      </span>
    </div>
  );
}
