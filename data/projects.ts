/**
 * Project dataset — the single source of project content for the homepage
 * FeaturedProjectsSection, the ProjectsPage, and the ProjectDetailPage
 * (Requirements 4.1, 4.4, 4.16).
 *
 * Conventions carried over from `data/technologies.ts`:
 * - one named export per module (`export const projects: Project[]`), never a
 *   default export
 * - data only: no functions, no derived values, no imports beyond types.
 *   Selection, filtering, and id resolution live in `lib/data-access.ts`
 * - stable kebab-case ids. Ids here are a public contract: they are referenced
 *   from `data/featured-projects.ts` and from `relatedProjects` below, and
 *   `lib/validate-data.ts` fails the build when a reference does not resolve
 * - `slug` equals `id` for every entry, so `/projects/[slug]` URLs are
 *   derivable from an id without a lookup table. They stay separate fields
 *   because the model allows them to diverge if a URL ever has to change
 *   without invalidating existing references
 * - dates are `"YYYY-MM-DD"` strings (`ISODateString`) so the data stays
 *   JSON-serializable across the Server/Client Component boundary
 *
 * ## Id references, never embedded objects
 *
 * `technologies` holds `Technology.id` values from `data/technologies.ts` and
 * `relatedProjects` holds `Project.id` values from this file — never copies of
 * the referenced records (Requirements 4.5, 4.16, 19.3). No entry lists its own
 * id in `relatedProjects`.
 *
 * ## Fixture shape (deliberate — downstream selectors depend on it)
 *
 * - **Eight projects, five featured.** The five featured ones are exactly the
 *   ids referenced from `data/featured-projects.ts`, so `featured: true` and
 *   membership in that config never disagree.
 * - **One archived project** (`beacon-status-page`, `status: "Archived"`) whose
 *   title and description contain "dashboard" — a term also used by
 *   non-archived projects. `filterProjects` excludes archived entries, so a
 *   search for a shared term has an observable exclusion to prove rather than a
 *   vacuous one (Requirement 18.2). `archived` and `status` are kept mutually
 *   consistent: the archived entry is the only `"Archived"` status.
 * - **Three non-featured projects**, one of them `pinned`, so preview slices are
 *   a strict subset of the full list (Requirement 17.1).
 * - **Both `relatedProjects` cases.** Six entries carry non-empty references;
 *   `ledger-lens` and `signal-mesh` are empty, which is what exercises the
 *   popular/pinned fallback in `getRelatedOrPopularProjects` (Requirements 19.3,
 *   19.5). Three entries are `pinned: true` so that fallback always has
 *   something to return.
 * - **Both `youtubeVideoId` cases.** Every featured project has one, because the
 *   VideoPlayer is the centrepiece of the homepage section; the three
 *   non-featured entries omit it, covering the absent case.
 * - **Category and status spread.** All six `ProjectCategory` values and all
 *   four `ProjectStatus` values appear, so the ProjectsPage filters render
 *   distinct, non-empty options (Requirement 18.4).
 * - **Content arrays are populated non-trivially.** `features`, `challenges`,
 *   `learnings`, `architecture`, `screenshots`, and `gallery` are all rendered
 *   by the ProjectDetailPage (Requirement 19.2), so every entry has real
 *   content in each.
 *
 * ## Media paths
 *
 * Image fields are root-relative paths under `/images/projects/<slug>/`
 * (`thumbnail.jpg`, `hero.jpg`, `gallery-N.jpg`, `screenshot-N.jpg`).
 * `public/images/` is currently committed empty — the referenced assets land
 * with the real content pass, and the image audit (tasks 42.9 / 46.2) covers
 * them. Nothing here is a hard runtime dependency on an asset existing.
 *
 * `youtubeVideoId` is a bare 11-character YouTube id, not a URL: `VideoPlayer`
 * builds the embed `src` itself so the embed host and query parameters are
 * decided in one place.
 */

import type { Project } from "@/types";

export const projects: Project[] = [
  /* -------------------------- Real projects (resume) ---------------------- */
  {
    id: "aerosense",
    slug: "aerosense",
    title: "AeroSense",
    shortDescription:
      "An AI-powered environmental monitoring and weather intelligence platform combining IoT sensor data with predictive models.",
    description: `AeroSense is an AI-powered environmental monitoring and
weather intelligence platform that pairs Arduino-based IoT sensors with a
real-time web dashboard and a PyTorch forecasting model.

Live readings stream from field sensors over WebSocket into a Next.js
dashboard, while a Python service layers OpenWeather API data on top to power
short-term weather intelligence and anomaly alerts.`,
    category: "AI/ML",
    status: "Completed",
    thumbnail: "/images/projects/aerosense/thumbnail.jpg",
    heroImage: "/images/projects/aerosense/hero.jpg",
    gallery: [
      "/images/projects/aerosense/gallery-1.jpg",
      "/images/projects/aerosense/gallery-2.jpg",
    ],
    youtubeVideoId: "dQw4w9WgXcQ",
    github: "#",
    liveDemo: "#",
    startDate: "2025-12-01",
    completionDate: "2025-12-31",
    featured: true,
    pinned: false,
    archived: false,
    technologies: [
      "nextjs",
      "react",
      "nodejs",
      "python",
      "pytorch",
      "typescript",
    ],
    features: [
      "Real-time environmental data streamed from Arduino IoT sensors over WebSocket",
      "AI-driven weather intelligence combining live sensor readings with the OpenWeather API",
      "PyTorch-based predictive models for short-term environmental forecasting",
      "Live dashboard visualizing temperature, humidity, and air quality trends",
      "Anomaly detection to flag unusual environmental readings in real time",
    ],
    challenges: [
      "Keeping the WebSocket connection between the Arduino sensors and the dashboard stable under intermittent connectivity",
      "Reconciling live sensor data with third-party weather API data on differing update cycles",
      "Training a forecasting model accurate enough to be useful on a small, self-collected sensor dataset",
    ],
    learnings: [
      "Streaming IoT data end to end taught a lot about buffering and reconnect strategies over WebSocket",
      "Combining first-party sensor data with a third-party API needs careful normalization before it's useful",
      "Small-scale ML forecasting benefits more from good feature engineering than from a bigger model",
    ],
    architecture: [
      "Arduino sensor nodes publish readings over a serial-to-WebSocket bridge",
      "Node.js WebSocket server ingests sensor streams and relays them to connected dashboard clients",
      "Next.js/React dashboard renders live charts and alerts from the streamed data",
      "Python service calls the OpenWeather API and runs the PyTorch forecasting model",
      "Forecast and anomaly results are pushed back to the dashboard alongside live sensor data",
    ],
    screenshots: [
      "/images/projects/aerosense/screenshot-1.jpg",
      "/images/projects/aerosense/screenshot-2.jpg",
    ],
    relatedProjects: ["novaaid", "digital-health-records"],
  },
  {
    id: "novaaid",
    slug: "novaaid",
    title: "NovaAid",
    shortDescription:
      "A blockchain-powered refugee assistance platform for identity, aid distribution, and private verification.",
    description: `NovaAid is a blockchain-powered refugee assistance platform
built on Celo. It gives displaced individuals a verifiable digital identity and
lets aid organizations distribute assistance transparently on-chain, while
Semaphore zero-knowledge proofs let recipients verify eligibility without
exposing sensitive personal data.

WebRTC-based calling connects field workers and beneficiaries directly, and
Firebase plus Clerk handle auxiliary data and authentication around the
on-chain core.`,
    category: "Web3",
    status: "Completed",
    thumbnail: "/images/projects/novaaid/thumbnail.jpg",
    heroImage: "/images/projects/novaaid/hero.jpg",
    gallery: [
      "/images/projects/novaaid/gallery-1.jpg",
      "/images/projects/novaaid/gallery-2.jpg",
    ],
    youtubeVideoId: "aqz-KE-bpKQ",
    github: "#",
    liveDemo: "#",
    startDate: "2025-10-01",
    completionDate: "2025-10-31",
    featured: true,
    pinned: false,
    archived: false,
    technologies: [
      "nextjs",
      "typescript",
      "nodejs",
      "express",
      "solidity",
      "firebase",
    ],
    features: [
      "On-chain verifiable digital identity for displaced individuals, built on Celo",
      "Transparent, blockchain-recorded aid distribution that donors and organizations can audit",
      "Semaphore zero-knowledge proofs so recipients verify eligibility without revealing personal data",
      "WebRTC-based direct calling between field workers and beneficiaries",
      "Clerk-based authentication layered over the on-chain identity system",
    ],
    challenges: [
      "Designing an identity scheme that stays verifiable on-chain without exposing personally identifying information",
      "Integrating Semaphore's zero-knowledge proof flow into a usable, low-bandwidth-friendly web app",
      "Keeping WebRTC calls reliable for users on unstable connections in the field",
    ],
    learnings: [
      "Zero-knowledge proofs are a genuinely practical tool for privacy-preserving eligibility checks, not just a research topic",
      "Designing for low-connectivity, high-stakes users changes almost every UX decision",
      "Smart contract gas costs on Celo needed to be budgeted for from day one, not optimized after the fact",
    ],
    architecture: [
      "Next.js/TypeScript front end for both field workers and beneficiaries",
      "Node.js/Express API layer coordinating off-chain data with on-chain calls",
      "Solidity contracts on Celo recording identity attestations and aid distribution events",
      "Semaphore ZK circuits verifying eligibility proofs without revealing underlying identity data",
      "Firebase for auxiliary application data and Clerk for authentication",
      "WebRTC data channels for direct field worker to beneficiary communication",
    ],
    screenshots: [
      "/images/projects/novaaid/screenshot-1.jpg",
      "/images/projects/novaaid/screenshot-2.jpg",
    ],
    relatedProjects: ["digital-health-records", "aerosense"],
  },
  {
    id: "digital-health-records",
    slug: "digital-health-records",
    title: "Digital Health Records (DHR)",
    shortDescription:
      "A decentralized medical records management system built on Algorand and IPFS.",
    description: `Digital Health Records (DHR) is a decentralized medical
records management system that stores patient records on IPFS and anchors
their integrity on the Algorand blockchain, giving patients and providers a
tamper-evident, verifiable record trail without centralizing sensitive data in
one database.

Clerk handles authentication for patients and providers, Firebase supports
auxiliary application data, and the whole experience is built as a
Tailwind-styled React/TypeScript app on a Node/Express backend.`,
    category: "Web3",
    status: "Completed",
    thumbnail: "/images/projects/digital-health-records/thumbnail.jpg",
    heroImage: "/images/projects/digital-health-records/hero.jpg",
    gallery: [
      "/images/projects/digital-health-records/gallery-1.jpg",
      "/images/projects/digital-health-records/gallery-2.jpg",
    ],
    youtubeVideoId: "5qap5aO4i9A",
    github: "#",
    liveDemo: "#",
    startDate: "2025-09-01",
    completionDate: "2025-09-30",
    featured: true,
    pinned: false,
    archived: false,
    technologies: [
      "react",
      "typescript",
      "nodejs",
      "express",
      "firebase",
      "tailwindcss",
    ],
    features: [
      "Decentralized medical record storage on IPFS, with integrity anchored on Algorand",
      "Tamper-evident record history that patients and providers can independently verify",
      "Clerk-based authentication distinguishing patient and provider roles",
      "Tailwind-styled React interface for uploading, viewing, and sharing records",
      "Express API layer coordinating IPFS storage with Algorand transactions",
    ],
    challenges: [
      "Balancing decentralized storage on IPFS with the need for fast, reliable record retrieval",
      "Designing the Algorand anchoring scheme so record integrity checks stay cheap at scale",
      "Modeling patient/provider access control without a central authority holding all the keys",
    ],
    learnings: [
      "Anchoring off-chain data integrity on a low-fee chain like Algorand is a practical middle ground between full decentralization and usability",
      "IPFS pinning strategy matters as much as the storage model itself for real-world reliability",
      "Healthcare data UX has to default to the most conservative access assumption, not the most convenient one",
    ],
    architecture: [
      "React/TypeScript front end styled with Tailwind CSS",
      "Node.js/Express backend coordinating uploads, IPFS pinning, and Algorand transactions",
      "IPFS for decentralized storage of the medical record payloads",
      "Algorand smart contracts anchoring record hashes for tamper-evidence",
      "Clerk for authentication and Firebase for auxiliary application data",
    ],
    screenshots: [
      "/images/projects/digital-health-records/screenshot-1.jpg",
      "/images/projects/digital-health-records/screenshot-2.jpg",
    ],
    relatedProjects: ["novaaid", "aerosense"],
  },

  /* ------------------------------ Featured (template) --------------------- */
  {
    id: "nebula-analytics",
    slug: "nebula-analytics",
    title: "Nebula Analytics",
    shortDescription:
      "A self-hosted product analytics dashboard with sub-second queries over billions of events.",
    description: `Nebula Analytics is a self-hosted alternative to hosted product
analytics. It ingests event streams over HTTP, rolls them into pre-aggregated
tables, and serves an interactive dashboard where funnels, retention curves, and
segment breakdowns stay responsive at billions of rows.

The design goal was operational simplicity: a single Postgres instance, one
worker process, and no external queue. Everything else is derived at query time
from materialized rollups that the worker refreshes incrementally.`,
    category: "Web",
    status: "Completed",
    thumbnail: "/images/projects/nebula-analytics/thumbnail.jpg",
    heroImage: "/images/projects/nebula-analytics/hero.jpg",
    gallery: [
      "/images/projects/nebula-analytics/gallery-1.jpg",
      "/images/projects/nebula-analytics/gallery-2.jpg",
      "/images/projects/nebula-analytics/gallery-3.jpg",
    ],
    youtubeVideoId: "dQw4w9WgXcQ",
    github: "https://github.com/example/nebula-analytics",
    liveDemo: "https://nebula-analytics.example.dev",
    documentation: "https://docs.example.dev/nebula-analytics",
    startDate: "2024-02-12",
    completionDate: "2024-11-30",
    featured: false,
    pinned: true,
    archived: false,
    technologies: [
      "typescript",
      "nextjs",
      "react",
      "tailwindcss",
      "framer-motion",
      "postgresql",
      "prisma",
      "redis",
      "vercel",
    ],
    features: [
      "Event ingestion endpoint that batches writes and survives bursts without dropping payloads",
      "Funnel builder with drag-to-reorder steps and per-step conversion windows",
      "Retention curves computed from incremental rollups rather than full scans",
      "Saved segments shareable by URL, so a dashboard link reproduces exactly what the author saw",
      "Role-scoped API tokens with per-project read and write separation",
    ],
    challenges: [
      "Keeping funnel queries under a second meant abandoning ad-hoc SQL in favour of pre-aggregated rollups refreshed incrementally",
      "Late-arriving events broke naive rollup windows, so the worker had to become idempotent and re-entrant",
      "The dashboard's charting layer initially re-rendered on every pointer move, which dominated the frame budget",
    ],
    learnings: [
      "Pre-aggregation beats query optimisation once the row count stops fitting in cache",
      "Idempotent workers are far easier to reason about than exactly-once delivery",
      "A single well-indexed Postgres instance goes much further than the usual architecture diagrams suggest",
    ],
    architecture: [
      "Next.js App Router front end; every dashboard page is a Server Component that reads through a typed query layer",
      "Ingestion route handler writes raw events to a partitioned Postgres table",
      "Background worker refreshes materialized rollups incrementally and records watermarks per partition",
      "Redis caches resolved segment definitions and rate-limits ingestion per API token",
      "Prisma owns the schema and migrations; no raw SQL outside the analytics query layer",
    ],
    screenshots: [
      "/images/projects/nebula-analytics/screenshot-1.jpg",
      "/images/projects/nebula-analytics/screenshot-2.jpg",
      "/images/projects/nebula-analytics/screenshot-3.jpg",
      "/images/projects/nebula-analytics/screenshot-4.jpg",
    ],
    relatedProjects: ["pulse-design-system", "atlas-edge-cache"],
    metaTitle: "Nebula Analytics — self-hosted product analytics",
    metaDescription:
      "A self-hosted product analytics dashboard: incremental rollups over Postgres keep funnels and retention queries under a second.",
  },
  {
    id: "pulse-design-system",
    slug: "pulse-design-system",
    title: "Pulse Design System",
    shortDescription:
      "A themeable React component library where every colour is a token and dark mode costs no component changes.",
    description: `Pulse is the component library that three internal products
share. Its central rule is that components never name a colour: they reference
semantic tokens, and themes are the only place a raw hex value appears.

That constraint made a second theme a data change rather than a code change, and
it keeps contrast ratios auditable — a token either passes AA in both themes or
it does not ship.`,
    category: "Tooling",
    status: "Maintained",
    thumbnail: "/images/projects/pulse-design-system/thumbnail.jpg",
    heroImage: "/images/projects/pulse-design-system/hero.jpg",
    gallery: [
      "/images/projects/pulse-design-system/gallery-1.jpg",
      "/images/projects/pulse-design-system/gallery-2.jpg",
    ],
    youtubeVideoId: "aqz-KE-bpKQ",
    github: "https://github.com/example/pulse-design-system",
    liveDemo: "https://pulse.example.dev",
    documentation: "https://pulse.example.dev/docs",
    startDate: "2023-06-01",
    featured: false,
    pinned: true,
    archived: false,
    technologies: [
      "typescript",
      "react",
      "tailwindcss",
      "framer-motion",
      "github-actions",
      "vercel",
    ],
    features: [
      "Forty accessible components built on headless primitives, each keyboard-operable by default",
      "Semantic colour tokens with light and dark values resolved through CSS variables",
      "Motion tokens shared with the consuming apps so durations and easings never drift",
      "Contrast audit that runs in CI and fails the build on a token pair below AA",
      "Interactive docs site generated from the same prop types the compiler checks",
    ],
    challenges: [
      "Retrofitting tokens onto components that already shipped hard-coded colours, without a breaking release",
      "Preventing a flash of the wrong theme on first paint while still respecting a stored preference",
      "Keeping animation opt-out honest: `prefers-reduced-motion` had to disable transforms, not merely shorten them",
    ],
    learnings: [
      "A design system's real product is its constraints, not its component count",
      "Tokens only stay honest when something automated rejects the ones that fail",
      "Documentation generated from types stays correct; documentation written by hand does not",
    ],
    architecture: [
      "Token layer: a plain TypeScript module compiled to CSS variables at build time",
      "Component layer: unstyled headless primitives wrapped with token-driven Tailwind classes",
      "Motion layer: duration and easing constants imported by both the library and its consumers",
      "Docs site deployed per pull request, so reviewers see the rendered diff",
      "GitHub Actions runs type checks, unit tests, and the contrast audit on every push",
    ],
    screenshots: [
      "/images/projects/pulse-design-system/screenshot-1.jpg",
      "/images/projects/pulse-design-system/screenshot-2.jpg",
      "/images/projects/pulse-design-system/screenshot-3.jpg",
    ],
    relatedProjects: ["nebula-analytics", "trailhead-mobile"],
  },
  {
    id: "orbital-vision",
    slug: "orbital-vision",
    title: "Orbital Vision",
    shortDescription:
      "Satellite imagery segmentation that flags new construction across revisits of the same tile.",
    description: `Orbital Vision compares successive satellite passes over the
same ground tile and segments what changed. The practical target was new
construction: foundations and roof outlines appearing where a previous pass shows
bare ground.

The model is a fairly ordinary segmentation network. Most of the work went into
the data pipeline — co-registration, cloud masking, and the sampling strategy
that stops the loss from being dominated by unchanged pixels.`,
    category: "AI/ML",
    status: "Completed",
    thumbnail: "/images/projects/orbital-vision/thumbnail.jpg",
    heroImage: "/images/projects/orbital-vision/hero.jpg",
    gallery: [
      "/images/projects/orbital-vision/gallery-1.jpg",
      "/images/projects/orbital-vision/gallery-2.jpg",
      "/images/projects/orbital-vision/gallery-3.jpg",
    ],
    youtubeVideoId: "5qap5aO4i9A",
    github: "https://github.com/example/orbital-vision",
    startDate: "2023-09-18",
    completionDate: "2024-05-22",
    featured: false,
    pinned: false,
    archived: false,
    technologies: [
      "python",
      "pytorch",
      "opencv",
      "numpy",
      "pandas",
      "fastapi",
      "docker",
      "aws",
    ],
    features: [
      "Change-detection segmentation over co-registered image pairs from the same tile",
      "Cloud and shadow masking that discards unusable pixels before they reach the loss",
      "Hard-negative sampling so unchanged ground stops dominating training batches",
      "Inference API that accepts a tile pair and returns a polygon set with confidence scores",
      "Reproducible training runs pinned to a dataset manifest hash",
    ],
    challenges: [
      "Sub-pixel misregistration produced phantom changes along every building edge until co-registration moved ahead of tiling",
      "Class imbalance was extreme — under one percent of pixels change between passes",
      "Seasonal colour shifts read as change, which forced normalisation per tile rather than per dataset",
    ],
    learnings: [
      "In change detection the alignment step decides the ceiling; the model only decides how close you get to it",
      "A dataset manifest hash is the cheapest reproducibility guarantee available",
      "Confidence scores are worthless without a calibration step, and calibration is worth doing early",
    ],
    architecture: [
      "Preprocessing stage: download, co-register, mask, and tile passes into fixed-size chips",
      "Training stage: PyTorch segmentation network with hard-negative sampling, checkpointed to object storage",
      "Serving stage: FastAPI service loading the exported weights, containerised for horizontal scaling",
      "Batch inference runs as a scheduled container job writing polygons back to object storage",
      "All stages share one config module, so a run is fully described by a single file",
    ],
    screenshots: [
      "/images/projects/orbital-vision/screenshot-1.jpg",
      "/images/projects/orbital-vision/screenshot-2.jpg",
      "/images/projects/orbital-vision/screenshot-3.jpg",
    ],
    relatedProjects: ["signal-mesh"],
    metaTitle: "Orbital Vision — satellite change detection",
    metaDescription:
      "Segmenting new construction from successive satellite passes, where co-registration mattered more than model architecture.",
  },
  {
    id: "atlas-edge-cache",
    slug: "atlas-edge-cache",
    title: "Atlas Edge Cache",
    shortDescription:
      "A programmable HTTP cache that runs at the edge and invalidates by tag instead of by URL.",
    description: `Atlas sits in front of origin services and caches responses
against tags the origin declares in a header. Invalidation is then a tag purge:
one call drops every response that depended on a record, however many URLs that
covers.

It is deliberately boring infrastructure. The interesting part is the coherence
protocol between edge nodes, which trades a small window of staleness for not
needing a consensus round on the hot path.`,
    category: "Tooling",
    status: "In Progress",
    thumbnail: "/images/projects/atlas-edge-cache/thumbnail.jpg",
    heroImage: "/images/projects/atlas-edge-cache/hero.jpg",
    gallery: [
      "/images/projects/atlas-edge-cache/gallery-1.jpg",
      "/images/projects/atlas-edge-cache/gallery-2.jpg",
    ],
    youtubeVideoId: "jNQXAC9IVRw",
    github: "https://github.com/example/atlas-edge-cache",
    documentation: "https://docs.example.dev/atlas",
    startDate: "2025-01-08",
    featured: false,
    pinned: false,
    archived: false,
    technologies: [
      "go",
      "redis",
      "docker",
      "kubernetes",
      "terraform",
      "nginx",
      "grafana",
      "linux",
    ],
    features: [
      "Tag-based invalidation: one purge call drops every cached response carrying the tag",
      "Stale-while-revalidate with a per-route budget, so an origin outage degrades instead of failing",
      "Request coalescing that collapses a thundering herd into a single origin fetch",
      "Per-tenant quotas enforced at the edge rather than at the origin",
      "Dashboards for hit ratio, origin offload, and purge propagation latency",
    ],
    challenges: [
      "Cross-node purge propagation needed an ordering guarantee without a consensus round on the request path",
      "Coalescing introduced a deadlock when the leader request timed out mid-flight",
      "Cache key normalisation is where correctness bugs hide — vary headers and query ordering both bit",
    ],
    learnings: [
      "Tags are the right invalidation primitive; URL-keyed purging pushes cache topology into application code",
      "A bounded staleness window is a much cheaper guarantee than strict coherence, and usually sufficient",
      "Metrics on purge propagation caught more bugs than the unit tests did",
    ],
    architecture: [
      "Go proxy process per edge node, holding an in-memory index over an on-disk response store",
      "Redis pub/sub distributes purge events; each node applies them idempotently with a monotonic epoch",
      "Terraform provisions the node pool; Kubernetes schedules one proxy per node with host networking",
      "Nginx terminates TLS in front of the proxy so certificate handling stays out of the cache path",
      "Grafana dashboards read from the proxy's own metrics endpoint",
    ],
    screenshots: [
      "/images/projects/atlas-edge-cache/screenshot-1.jpg",
      "/images/projects/atlas-edge-cache/screenshot-2.jpg",
      "/images/projects/atlas-edge-cache/screenshot-3.jpg",
    ],
    relatedProjects: ["nebula-analytics", "signal-mesh"],
  },
  {
    id: "ledger-lens",
    slug: "ledger-lens",
    title: "Ledger Lens",
    shortDescription:
      "A wallet-agnostic explorer that turns raw contract calls into readable transaction stories.",
    description: `Ledger Lens decodes a wallet's on-chain history into sentences.
Instead of a list of opaque method selectors it shows what happened: a swap, an
approval, a mint, with the amounts and counterparties resolved.

Decoding relies on published ABIs where they exist and on heuristics over event
signatures where they do not. Everything is read-only: the app never requests a
signature, which keeps the trust story simple.`,
    category: "Web3",
    status: "Maintained",
    thumbnail: "/images/projects/ledger-lens/thumbnail.jpg",
    heroImage: "/images/projects/ledger-lens/hero.jpg",
    gallery: [
      "/images/projects/ledger-lens/gallery-1.jpg",
      "/images/projects/ledger-lens/gallery-2.jpg",
      "/images/projects/ledger-lens/gallery-3.jpg",
    ],
    youtubeVideoId: "M7lc1UVf-VE",
    github: "https://github.com/example/ledger-lens",
    liveDemo: "https://ledger-lens.example.dev",
    startDate: "2024-07-04",
    featured: false,
    pinned: true,
    archived: false,
    technologies: [
      "solidity",
      "hardhat",
      "ethers-js",
      "wagmi",
      "polygon",
      "ipfs",
      "nextjs",
      "typescript",
    ],
    features: [
      "Human-readable decoding of swaps, approvals, transfers, and mints from raw call data",
      "Read-only wallet connection: the app never requests a signature",
      "Token metadata resolved through IPFS with a local cache and a graceful unknown-token state",
      "Cross-chain view that merges history from multiple networks into one timeline",
      "Shareable permalinks for a single decoded transaction",
    ],
    challenges: [
      "Unverified contracts have no ABI, so decoding had to degrade to event-signature heuristics rather than give up",
      "IPFS gateway latency was wildly variable and needed a timeout plus a cache to stay usable",
      "Merging multi-chain history exposed how unreliable block timestamps are as a sort key across networks",
    ],
    learnings: [
      "Read-only is an underrated product decision: it removes an entire class of user anxiety",
      "Heuristic decoding is acceptable when the UI is honest about its confidence",
      "Contract fixtures in a local Hardhat chain make decoder tests deterministic and fast",
    ],
    architecture: [
      "Next.js front end with wagmi for read-only wallet connection and network switching",
      "Decoder module: ABI registry first, event-signature heuristics as fallback, pure and unit-tested",
      "Metadata resolver fetching from IPFS gateways with timeout, retry, and a persistent cache",
      "Hardhat project holding contract fixtures used by the decoder test suite",
      "Server-rendered permalink route so a shared transaction link is crawlable",
    ],
    screenshots: [
      "/images/projects/ledger-lens/screenshot-1.jpg",
      "/images/projects/ledger-lens/screenshot-2.jpg",
    ],
    // Deliberately empty: exercises the popular/pinned fallback in
    // `getRelatedOrPopularProjects` (Requirements 19.3, 19.5).
    relatedProjects: [],
  },

  /* ---------------------------- Not featured ----------------------------- */
  {
    id: "trailhead-mobile",
    slug: "trailhead-mobile",
    title: "Trailhead",
    shortDescription:
      "An offline-first hiking companion that records tracks without a signal and syncs when one returns.",
    description: `Trailhead records a hike while the phone has no connectivity,
then reconciles it with the server once a signal comes back. The whole app is
built around that assumption rather than treating offline as an error state.

Local writes go to an on-device queue with a logical clock; the server accepts
them out of order and resolves conflicts per field. Nothing a hiker records is
ever lost to a bad connection.`,
    category: "Mobile",
    status: "Completed",
    thumbnail: "/images/projects/trailhead-mobile/thumbnail.jpg",
    heroImage: "/images/projects/trailhead-mobile/hero.jpg",
    gallery: [
      "/images/projects/trailhead-mobile/gallery-1.jpg",
      "/images/projects/trailhead-mobile/gallery-2.jpg",
    ],
    github: "https://github.com/example/trailhead-mobile",
    startDate: "2023-03-15",
    completionDate: "2023-12-08",
    featured: false,
    pinned: false,
    archived: false,
    technologies: [
      "typescript",
      "react",
      "firebase",
      "nodejs",
      "express",
      "sqlite",
    ],
    features: [
      "Track recording that continues in the background with the screen off",
      "Offline map tiles pre-cached per planned route, with a storage budget the hiker controls",
      "Write queue with per-field conflict resolution, so a late sync never overwrites newer data",
      "Elevation profile and pace summary computed on device from the raw track",
      "Trip export to GPX for use in other tools",
    ],
    challenges: [
      "Background location on both platforms is a maze of permissions and OS-level throttling",
      "Naive last-write-wins sync silently dropped edits made while offline, which forced per-field clocks",
      "Battery drain from a high GPS sample rate needed an adaptive rate tied to movement speed",
    ],
    learnings: [
      "Offline-first is an architecture, not a feature to bolt on later",
      "Per-field conflict resolution is more code than last-write-wins and worth every line",
      "Sampling adaptively saves more battery than any amount of micro-optimisation",
    ],
    architecture: [
      "React client with a local SQLite database as the single source of truth on device",
      "Sync engine draining an append-only write queue, retrying with exponential backoff",
      "Express API validating and merging writes, keyed by a per-device logical clock",
      "Firebase handles authentication and push notifications only, not primary storage",
      "Tile cache stored on the filesystem with an explicit eviction policy",
    ],
    screenshots: [
      "/images/projects/trailhead-mobile/screenshot-1.jpg",
      "/images/projects/trailhead-mobile/screenshot-2.jpg",
      "/images/projects/trailhead-mobile/screenshot-3.jpg",
    ],
    relatedProjects: ["pulse-design-system"],
  },
  {
    id: "signal-mesh",
    slug: "signal-mesh",
    title: "Signal Mesh",
    shortDescription:
      "A peer-to-peer telemetry relay for sensor fleets on links too unreliable for a central broker.",
    description: `Signal Mesh moves telemetry off sensor nodes that share a
patchy radio link. Each node gossips readings to its neighbours, and any node
with upstream connectivity drains the mesh to the collector.

There is no broker and no elected leader. A node only has to know its
neighbours, which is what keeps the mesh working while individual links come and
go.`,
    category: "Other",
    status: "In Progress",
    thumbnail: "/images/projects/signal-mesh/thumbnail.jpg",
    heroImage: "/images/projects/signal-mesh/hero.jpg",
    gallery: [
      "/images/projects/signal-mesh/gallery-1.jpg",
      "/images/projects/signal-mesh/gallery-2.jpg",
    ],
    github: "https://github.com/example/signal-mesh",
    startDate: "2025-04-21",
    featured: false,
    pinned: true,
    archived: false,
    technologies: ["rust", "nodejs", "mongodb", "docker", "linux", "git"],
    features: [
      "Gossip-based replication so any connected node can drain the whole mesh",
      "Bounded on-node buffer that sheds the oldest low-priority readings first when full",
      "Delta encoding for slow-moving sensors, cutting radio airtime substantially",
      "Deduplication at the collector keyed by node id and sequence number",
      "Fleet health view that infers link quality from gossip round-trip times",
    ],
    challenges: [
      "Gossip amplification saturated the radio band until fan-out became a function of neighbour count",
      "Clock drift across nodes made timestamps unusable for ordering, so sequence numbers replaced them",
      "Deciding what to drop when a buffer fills is a product question disguised as an engineering one",
    ],
    learnings: [
      "Backpressure has to be designed at the same time as the buffer, not after it overflows in the field",
      "Sequence numbers beat timestamps whenever the clocks are not yours to trust",
      "Field debugging is mostly an observability problem, and it starts at the protocol design stage",
    ],
    architecture: [
      "Rust agent per node: sampler, bounded buffer, and gossip transport as three independent tasks",
      "Collector service in Node.js deduplicating by node id and sequence number before persisting",
      "MongoDB stores raw readings; rollups are computed on read for the fleet health view",
      "Agent ships as a container image for the gateway class of node and a static binary elsewhere",
      "Protocol messages are versioned from the first commit, since field nodes update slowly",
    ],
    screenshots: [
      "/images/projects/signal-mesh/screenshot-1.jpg",
      "/images/projects/signal-mesh/screenshot-2.jpg",
    ],
    // Deliberately empty: the second fallback case for
    // `getRelatedOrPopularProjects` (Requirements 19.3, 19.5).
    relatedProjects: [],
  },

  /* ------------------------------- Archived ------------------------------ */
  {
    // Archived, so `filterProjects` excludes it from the ProjectsPage
    // (Requirement 18.2). Its title and description mention "dashboard" and
    // "analytics" — terms shared with active projects — so the exclusion is
    // observable through a search that would otherwise match.
    id: "beacon-status-page",
    slug: "beacon-status-page",
    title: "Beacon Status Dashboard",
    shortDescription:
      "A public status dashboard with uptime analytics, retired once the platform moved to a hosted provider.",
    description: `Beacon published service health to customers: current status
per component, incident history, and a rolling uptime dashboard. It ran for two
years before the platform standardised on a hosted status provider, at which
point maintaining it stopped making sense.

It is kept here because the incident-timeline model held up well and the writeup
is still the clearest example of the team's incident communication practice.`,
    category: "Web",
    status: "Archived",
    thumbnail: "/images/projects/beacon-status-page/thumbnail.jpg",
    heroImage: "/images/projects/beacon-status-page/hero.jpg",
    gallery: [
      "/images/projects/beacon-status-page/gallery-1.jpg",
      "/images/projects/beacon-status-page/gallery-2.jpg",
    ],
    github: "https://github.com/example/beacon-status-page",
    startDate: "2021-05-10",
    completionDate: "2023-04-28",
    featured: false,
    pinned: false,
    archived: true,
    technologies: ["javascript", "vuejs", "nodejs", "sqlite", "nginx", "linux"],
    features: [
      "Per-component status with an operator override for planned maintenance windows",
      "Incident timeline where every update is append-only and timestamped",
      "Rolling ninety-day uptime analytics computed from probe results",
      "Email and webhook subscriptions per component rather than per site",
      "Static export fallback served from a separate host, so the status page survived a full platform outage",
    ],
    challenges: [
      "A status page hosted on the infrastructure it reports on is useless during the outages that matter most",
      "Probe flapping produced noisy incidents until a hysteresis window was added",
      "Uptime percentages are surprisingly contentious: the denominator needed documenting before anyone trusted them",
    ],
    learnings: [
      "Host the status page somewhere the monitored system cannot take down",
      "Append-only incident updates make postmortems write themselves",
      "Publishing the uptime formula ends the argument about the number",
    ],
    architecture: [
      "Vue single-page app reading a static JSON snapshot regenerated on every status change",
      "Node.js prober running scheduled checks and writing results to SQLite",
      "Nginx serves the snapshot and the static export fallback from a host outside the main platform",
      "Subscription dispatcher fans out email and webhook notifications from the incident event log",
      "Deployment was a single systemd unit per component on a small Linux box",
    ],
    screenshots: [
      "/images/projects/beacon-status-page/screenshot-1.jpg",
      "/images/projects/beacon-status-page/screenshot-2.jpg",
    ],
    relatedProjects: ["nebula-analytics"],
  },
];
