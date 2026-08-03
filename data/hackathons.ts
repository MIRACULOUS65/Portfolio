import type { Hackathon } from "@/types";

/**
 * Hackathon participation records — the sole source for the homepage
 * HackathonsSection preview (name, organizer, date, achievement) and for the
 * full `/hackathons` listing page (achievement, date, technologies)
 * (Requirements 4.1, 4.8, 14.1, 14.2, 21.1, 21.2).
 *
 * Follows the `data/*.ts` conventions documented at the top of
 * `data/technologies.ts`: one named export typed against the entity from the
 * `@/types` barrel, data only (no functions or derived values), stable
 * kebab-case ids, and grouping comments in authoring order.
 *
 * ## Size and ordering
 *
 * Eight entries — comfortably more than any plausible preview cap, so
 * `getHackathonsPreview(cap)` always returns a strict subset of what
 * `getAllHackathons()` feeds the listing page. Source order is authoring order
 * only; recency ordering is a presentation concern owned by the selectors in
 * `lib/data-access.ts`. Every `date` is distinct (no ties), which keeps any date
 * ordering unambiguous.
 *
 * ## Field conventions
 *
 * - `achievement` is optional and means "this entry placed or won something".
 *   Two entries below omit it (participated without placing) so consumers are
 *   forced to handle the absent case.
 * - `technologies` holds `Technology.id` references from `data/technologies.ts`,
 *   never embedded copies. `lib/validate-data.ts` fails the build when one of
 *   them fails to resolve, so treat these strings as ids, not display text.
 * - `teamMembers` is the full roster including the developer, so a solo entry is
 *   a single-name array. One entry carries an empty roster (the organizer never
 *   published one), which exercises the empty-list rendering path.
 * - `location` mixes in-person cities with remote events ("Online"/"Remote").
 * - `demo` and `github` are both optional: some entries have both, some one, and
 *   one has neither (nothing was published publicly).
 *
 * ## Images
 *
 * Six real event photos live under `public/images/hackathons/` as
 * `pic1.webp` through `pic6.webp`. They are distributed sequentially across
 * the entries below (`pic1` on the first entry, `pic2` on the second, and so
 * on), cycling back to `pic1` once all six are used, since there are eight
 * entries and only six real photos.
 *
 * This is placeholder content for the portfolio template — event names,
 * organizers, teammate names, and URLs are all generic. Replace them with your
 * own.
 */
export const hackathons: Hackathon[] = [
  /* ---------------------- Placed / award-winning entries ---------------------- */
  {
    id: "nova-global-hack-2024",
    slug: "nova-global-hack-2024",
    name: "Nova Global Hack 2024",
    organizer: "Nova Foundation",
    description:
      "Secured the Third Runner-Up position by building a real-time incident " +
      "dashboard that ingests webhook events and streams status changes to " +
      "on-call responders, shipped end to end over a single weekend.",
    date: "2024-03-16",
    location: "Kolkata, India",
    achievement: "Third Runner-Up",
    teamMembers: ["Sushovan Ghosh"],
    technologies: ["nextjs", "typescript", "firebase", "tailwindcss"],
    images: ["/images/hackathons/pic1.webp", "/images/hackathons/pic2.webp"],
    demo: "#",
    github: "#",
  },
  {
    id: "orbit-ai-jam-2024",
    slug: "orbit-ai-jam-2024",
    name: "Orbit AI Jam 2024",
    organizer: "Orbit Labs",
    description:
      "A retrieval-augmented assistant that answers questions over a team's " +
      "internal runbooks, with citations back to the source paragraph so " +
      "answers stay auditable.",
    date: "2024-07-20",
    location: "Online",
    achievement: "Best Use of AI",
    teamMembers: ["Sushovan Ghosh", "Mei Tanaka", "Daniel Okoro", "Sofia Bianchi"],
    technologies: ["python", "fastapi", "langchain", "openai", "postgresql"],
    images: ["/images/hackathons/pic3.webp"],
    github: "https://github.com/example/orbit-runbook-assistant",
  },
  {
    id: "civic-code-sprint-2023",
    slug: "civic-code-sprint-2023",
    name: "Civic Code Sprint 2023",
    organizer: "City of Rivermouth",
    description:
      "An accessible transit-delay reporter for city buses: riders submit a " +
      "delay in two taps and the operations team sees aggregated hotspots on a " +
      "live map.",
    date: "2023-11-04",
    location: "Rivermouth, United States",
    achievement: "2nd Place — Civic Tech Track",
    teamMembers: ["Sushovan Ghosh", "Nadia Fischer", "Owen Blake"],
    technologies: ["react", "nodejs", "mongodb", "docker"],
    images: [
      "/images/hackathons/pic4.webp",
      "/images/hackathons/pic5.webp",
      "/images/hackathons/pic6.webp",
    ],
    demo: "https://transit-reporter.example.dev",
    github: "https://github.com/example/transit-delay-reporter",
  },
  {
    id: "chainforge-web3-hack-2023",
    slug: "chainforge-web3-hack-2023",
    name: "ChainForge Web3 Hack 2023",
    organizer: "ChainForge Collective",
    description:
      "A milestone-escrow contract for freelance work, with a wallet-native UI " +
      "that walks both parties through funding, approval, and dispute windows.",
    date: "2023-05-13",
    location: "Remote",
    achievement: "Finalist — Top 10",
    teamMembers: ["Sushovan Ghosh", "Luis Ferreira"],
    technologies: ["solidity", "hardhat", "ethers-js", "polygon", "wagmi"],
    images: ["/images/hackathons/pic1.webp"],
    demo: "https://milestone-escrow.example.dev",
    github: "https://github.com/example/milestone-escrow",
  },
  {
    id: "cloudscape-summer-hack-2022",
    slug: "cloudscape-summer-hack-2022",
    name: "Cloudscape Summer Hack 2022",
    organizer: "Cloudscape Community",
    description:
      "A one-command preview-environment provisioner: every pull request gets " +
      "an isolated stack, and it is torn down automatically when the branch " +
      "merges or goes stale.",
    date: "2022-06-11",
    location: "Online",
    achievement: "3rd Place — Developer Tooling",
    teamMembers: ["Sushovan Ghosh", "Grace Lindqvist"],
    technologies: ["aws", "terraform", "nodejs", "github-actions"],
    images: ["/images/hackathons/pic2.webp"],
    demo: "https://preview-envs.example.dev",
  },
  {
    id: "openbench-ml-marathon-2025",
    slug: "openbench-ml-marathon-2025",
    name: "OpenBench ML Marathon 2025",
    organizer: "OpenBench Alliance",
    description:
      "A reproducible benchmarking harness for small vision models that pins " +
      "seeds, records hardware, and publishes a comparable score card for every " +
      "submitted run.",
    date: "2025-02-08",
    location: "Zurich, Switzerland",
    achievement: "Best Technical Implementation",
    teamMembers: ["Sushovan Ghosh", "Ibrahim Haddad", "Chen Wei"],
    technologies: ["pytorch", "pandas", "numpy", "huggingface"],
    images: ["/images/hackathons/pic3.webp", "/images/hackathons/pic4.webp"],
    github: "https://github.com/example/openbench-harness",
  },

  /* ------------------- Participated without placing (no award) ------------------- */
  {
    id: "terminal-velocity-devfest-2022",
    slug: "terminal-velocity-devfest-2022",
    name: "Terminal Velocity Devfest 2022",
    organizer: "Devfest Southbank",
    description:
      "A solo build: a terminal-first latency profiler that samples a service " +
      "under load and renders percentile drift as a live sparkline in the shell.",
    date: "2022-09-24",
    location: "Southbank, Australia",
    teamMembers: ["Sushovan Ghosh"],
    technologies: ["go", "redis", "grafana", "kubernetes"],
    images: ["/images/hackathons/pic5.webp"],
  },
  {
    id: "pixelpush-game-jam-2021",
    slug: "pixelpush-game-jam-2021",
    name: "PixelPush Game Jam 2021",
    organizer: "PixelPush Studio",
    description:
      "A browser puzzle game about routing packets through a failing network, " +
      "built in 48 hours with a shared team roster that the organizers never " +
      "published.",
    date: "2021-08-15",
    location: "Online",
    teamMembers: [],
    technologies: ["javascript", "html5", "css3", "vercel"],
    images: ["/images/hackathons/pic6.webp"],
    demo: "https://packet-puzzle.example.dev",
    github: "https://github.com/example/packet-puzzle",
  },
];
