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
    id: "sentinel-sdk",
    slug: "sentinel-sdk",
    title: "Sentinel SDK",
    shortDescription:
      "Decentralized AI-powered risk engine and credit-scoring SDK for Stellar Network with real-time fraud prevention.",
    description: `Sentinel is a decentralized AI-powered risk engine and credit-scoring SDK with a companion web dashboard for the Stellar Network, connecting off-chain ML analytics with on-chain Soroban smart contracts to prevent fraud and enable real-time under-collateralized DeFi.

The system combines Python-based machine learning for risk assessment with Rust-powered Soroban contracts for on-chain verification, creating a trustless credit scoring infrastructure.`,
    category: "Web3",
    status: "Completed",
    thumbnail: "/images/projects/sentinel.webp",
    heroImage: "/images/projects/sentinel.webp",
    gallery: [
      "/images/projects/sentinel.webp",
    ],
    youtubeVideoId: "OUSeO34ztnE",
    github: "https://github.com/MIRACULOUS65/Sentinel_Ts_Rust_Sdk",
    liveDemo: "https://sentinel-chi-ten.vercel.app/",
    startDate: "2024-08-01",
    completionDate: "2024-11-30",
    featured: true,
    pinned: true,
    archived: false,
    technologies: [
      "nextjs",
      "typescript",
      "python",
      "rust",
      "tailwindcss",
      "postgresql",
    ],
    features: [
      "AI-powered behavioral risk analysis using Scikit-Learn ML models",
      "Real-time fraud detection with off-chain computation and on-chain verification",
      "Soroban smart contracts for trustless credit scoring on Stellar Network",
      "Interactive dashboard with Next.js 14 and Shadcn UI for risk visualization",
      "Under-collateralized DeFi lending enabled by ML-driven creditworthiness",
    ],
    challenges: [
      "Bridging off-chain ML predictions with on-chain smart contract execution trustlessly",
      "Achieving sub-second risk assessment latency for real-time fraud prevention",
      "Designing credit scoring algorithms that work with blockchain transparency constraints",
    ],
    learnings: [
      "Combining AI analytics with blockchain requires careful data privacy considerations",
      "Soroban's Rust-based smart contracts offer significant performance advantages for complex logic",
      "Real-time fraud prevention needs aggressive caching and predictive pre-computation",
    ],
    architecture: [
      "Next.js 14 dashboard with Tailwind and Shadcn UI for interactive risk visualization",
      "Python FastAPI backend running Scikit-Learn models for behavioral analysis",
      "Rust Soroban smart contracts on Stellar for on-chain credit score verification",
      "PostgreSQL for historical risk data and audit trails",
      "Render cloud hosting for scalable ML inference",
    ],
    screenshots: [
      "/images/projects/sentinel.webp",
    ],
    relatedProjects: ["swyftpay", "infinitycare"],
  },
  {
    id: "swyftpay",
    slug: "swyftpay",
    title: "SwyftPay",
    shortDescription:
      "Escrow-backed cross-currency payments: Pay crypto, receive INR via QR scan with <2s settlement.",
    description: `SwyftPay enables seamless crypto-to-fiat payments through QR code scanning. Customers pay in cryptocurrency on Polygon Amoy, funds are escrowed on-chain, and merchants receive INR via Razorpay UPI — all in under 2 seconds.

The system uses smart contract escrow for security, native camera QR scanning for UX, and event-driven settlement for speed, creating a frictionless bridge between crypto and traditional payment rails.`,
    category: "Web3",
    status: "Completed",
    thumbnail: "/images/projects/swyftpay.webp",
    heroImage: "/images/projects/swyftpay.webp",
    gallery: [
      "/images/projects/swyftpay.webp",
    ],
    youtubeVideoId: "dmW97PE1v04",
    github: "https://github.com/MIRACULOUS65/SwyftPay",
    liveDemo: "#",
    startDate: "2024-10-01",
    completionDate: "2024-12-15",
    featured: true,
    pinned: true,
    archived: false,
    technologies: [
      "nextjs",
      "typescript",
      "solidity",
      "postgresql",
      "tailwindcss",
    ],
    features: [
      "Sub-2-second settlement from crypto payment to INR credit",
      "Escrow-backed smart contracts ensure funds are never at risk",
      "Real camera QR scanning with jsQR and BarcodeDetector APIs",
      "Razorpay Checkout integration with HMAC signature verification",
      "Unique QR code per user encoding wallet address and identity",
      "0% platform fee during launch phase",
      "BetterAuth for Email + Google OAuth authentication",
      "Event-driven settlement watcher using eth_getLogs",
    ],
    challenges: [
      "Achieving sub-2-second settlement required event-driven architecture with aggressive polling",
      "Ensuring HMAC signature verification security without blocking the user experience",
      "Handling camera permissions and QR scanning across different mobile browsers reliably",
    ],
    learnings: [
      "Event-driven settlement beats polling for real-time blockchain payment processing",
      "Escrow contracts need careful gas optimization to keep transaction costs acceptable",
      "Native browser QR scanning (BarcodeDetector) provides better UX than third-party libraries when available",
    ],
    architecture: [
      "Next.js 15 App Router with TypeScript for full-stack implementation",
      "Solidity escrow smart contracts deployed on Polygon Amoy testnet",
      "Prisma ORM with Neon PostgreSQL for serverless database",
      "Node.js settlement watcher listening to eth_getLogs for OrderCreated events",
      "Razorpay Checkout.js for INR withdrawal with HMAC-SHA256 verification",
      "jsQR + BarcodeDetector for native camera QR scanning",
      "react-qr-code for unique QR generation per user",
    ],
    screenshots: [
      "/images/projects/swyftpay.webp",
    ],
    relatedProjects: ["sentinel-sdk", "infinitycare"],
  },
  {
    id: "infinitycare",
    slug: "infinitycare",
    title: "InfinityCare",
    shortDescription:
      "Zero-trust AI-powered healthcare: Patient-owned data, AI-assisted doctors, blockchain-verified medicines.",
    description: `InfinityCare is a zero-trust healthcare ecosystem where patients own their medical data encrypted in personal vaults, doctors receive AI-generated clinical summaries, and medicine authenticity is verified on Algorand blockchain.

The platform combines Gemini AI for clinical intelligence, DeepFace biometric identification for emergency care, Presage SmartSpectra for contactless vitals, and blockchain-backed supply chain verification.`,
    category: "AI/ML",
    status: "Completed",
    thumbnail: "/images/projects/infintycare.webp",
    heroImage: "/images/projects/infintycare.webp",
    gallery: [
      "/images/projects/infintycare.webp",
    ],
    youtubeVideoId: "PkyaTOJA9oU",
    github: "https://github.com/MIRACULOUS65/InfinityCare",
    liveDemo: "https://infinity-care-topaz.vercel.app/",
    startDate: "2024-06-01",
    completionDate: "2024-10-30",
    featured: true,
    pinned: true,
    archived: false,
    technologies: [
      "nextjs",
      "react",
      "typescript",
      "python",
      "postgresql",
      "tailwindcss",
    ],
    features: [
      "AI prescription scanning with Tesseract.js OCR + Gemini 2.5 Flash structured output",
      "DeepFace VGG-Face CNN for emergency biometric patient identification",
      "Presage SmartSpectra SDK for contactless vital signs (HR, HRV, BP, breathing rate)",
      "Algorand blockchain medicine verification with tamper-proof QR codes",
      "Role-based dashboards: Patient, Doctor, Hospital, Nurse, Pharmacy, Vendor",
      "Per-file access control: patients grant/revoke document access to hospitals",
      "Disease prediction ML model from extracted symptoms",
      "Real-time notifications on document access",
    ],
    challenges: [
      "Achieving sub-2-second biometric identification with DeepFace CNN matching",
      "Structuring Gemini AI output into reliable JSON for clinical use",
      "Designing zero-trust access control without centralized key management",
    ],
    learnings: [
      "AI clinical summarization needs a fallback chain (Gemini → Ollama → Custom) for reliability",
      "Browser-side OCR with Tesseract.js keeps sensitive data off external servers",
      "Blockchain verification works best for supply chain integrity, not all medical records",
    ],
    architecture: [
      "Next.js 16 + React 19 with TypeScript 5 for full-stack application",
      "PostgreSQL with Supabase and Prisma ORM 7 for patient vault storage",
      "BetterAuth for session-based, role-gated authentication",
      "Gemini 2.5 Flash for AI clinical intelligence with Ollama Cloud fallback",
      "Tesseract.js 7 for browser-side OCR of prescriptions",
      "DeepFace (VGG-Face CNN) Flask service for biometric identification",
      "Presage SmartSpectra SDK for contactless vital monitoring via camera",
      "Algorand (algosdk) for medicine supply chain verification",
      "Cloudinary CDN for encrypted medical document storage",
    ],
    screenshots: [
      "/images/projects/infintycare.webp",
    ],
    relatedProjects: ["sentinel-sdk", "swyftpay"],
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
