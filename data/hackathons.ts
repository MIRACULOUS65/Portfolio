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
    id: "stellar-build-a-thon-2026",
    slug: "stellar-build-a-thon-2026",
    name: "Stellar Build-a-thon",
    organizer: "Sentinel",
    description:
      "Implemented a comprehensive SDK for blockchain development, featuring " +
      "robust APIs, developer-friendly documentation, and seamless integration " +
      "with existing infrastructure for rapid deployment.",
    date: "2026-01-26",
    location: "Delhi, India",
    achievement: "SDK Implemented",
    teamMembers: ["Sushovan Ghosh", "Rohan Verma"],
    technologies: ["typescript", "nodejs", "ethereum", "docker", "aws"],
    images: ["/images/hackathons/pic1.webp", "/images/hackathons/pic2.webp"],
    demo: "https://stellar-sdk.example.dev",
    github: "https://github.com/example/stellar-sdk",
  },
  {
    id: "hacktropica-2026",
    slug: "hacktropica-2026",
    name: "Hacktropica 2026",
    organizer: "MLH",
    description:
      "An innovative healthcare platform powered by AI and machine learning, " +
      "providing personalized patient care recommendations and health monitoring " +
      "solutions with real-time analytics.",
    date: "2024-04-04",
    location: "Bangalore, India",
    achievement: "Best HealthTech Idea",
    teamMembers: ["Sushovan Ghosh", "Ananya Roy", "Karthik Menon"],
    technologies: ["react", "nodejs", "tensorflow", "mongodb", "tailwindcss"],
    images: ["/images/hackathons/pic3.webp"],
    github: "https://github.com/example/hacktropica-healthtech",
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
    id: "hacktonix-2026",
    slug: "hacktonix-2026",
    name: "Hacktonix 2026",
    organizer: "Swyftpay",
    description:
      "A decentralized payment platform leveraging blockchain technology for " +
      "secure and transparent transactions, featuring smart contract integration " +
      "and real-time settlement capabilities.",
    date: "2026-04-27",
    location: "Mumbai, India",
    achievement: "Best BlockChain Idea Implementation",
    teamMembers: ["Sushovan Ghosh", "Arjun Patel", "Priya Sharma"],
    technologies: ["solidity", "ethereum", "nextjs", "typescript", "web3js"],
    images: ["/images/hackathons/pic3.webp", "/images/hackathons/pic4.webp"],
    github: "https://github.com/example/hacktonix-blockchain",
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
