# Implementation Plan: Developer Portfolio v2

## Overview

This plan builds the portfolio bottom-up: tooling → types → data → data-access/validation → font/theme foundation → shared design-system components → layout/navigation → homepage sections in roadmap order (Hero → Featured Projects → Blog Preview → Tech Stack → Certifications → Competitive Programming → Hackathons → Education → Contact/Footer) → dedicated pages → SEO → animation/reduced-motion → accessibility → performance → final polish. Every task produces something renderable or testable before the next task depends on it; no section is wired into the homepage until its own data, logic, and components exist. Property-based tests (fast-check + Vitest) are placed immediately after the implementation task for the correctness property they validate, per `design.md`'s Correctness Properties section (27 properties) and Testing Strategy.

## Tasks

- [x] 1. Initialize Next.js App Router project with strict TypeScript
  - Run `pnpm create next-app` (App Router, TypeScript, no `src/` dir per Structure.md) and commit the generated baseline
  - Enable `"strict": true` in `tsconfig.json` (Requirement 1.2) and configure path aliases (`@/*`) for absolute imports
  - _Requirements: 1.1, 1.2, 1.7_

- [x] 2. Configure Tailwind CSS, ESLint, and Prettier
  - Install and configure TailwindCSS as the exclusive styling mechanism (`tailwind.config.ts`, `styles/globals.css` base layer)
  - Configure ESLint (Next.js + TypeScript rules) and Prettier, with `pnpm lint`/`pnpm format` scripts
  - _Requirements: 1.3, 1.7_

- [x] 3. Create base folder structure and install shadcn/ui
  - Create empty (or `.gitkeep`'d) `app/`, `components/{ui,shared,navbar,hero,featured-projects,blog-preview,tech-stack,certifications,competitive-programming,hackathons,education,contact,footer,projects-page,project-detail,blog-page,blog-article}/`, `sections/`, `hooks/`, `lib/`, `types/`, `data/`, `utils/`, `styles/`, `public/{fonts,images}/` directories per design.md Folder Structure
  - Initialize shadcn/ui (`components/ui/`) and add the primitives needed later (dialog, tooltip, popover, accordion, dropdown, sheet, command, toast)
  - _Requirements: 1.5, 1.10_

- [x] 4. Checkpoint - Ensure project builds and lints cleanly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Define shared primitive types
  - Create `types/index.ts` with `ISODateString`, `TechCategory`, `ActivityStatus`, `SocialPlatform`, and `SEOFields` per design.md Data Models § Shared primitives
  - _Requirements: 4.11, 4.12, 4.14_

- [x] 6. Define entity type interfaces (types/ directory)
  - [x] 6.1 Create `types/project.ts` with `Project`, `ProjectCategory`, `ProjectStatus`, `FeaturedProjectEntry`, and `FeaturedProjectsConfig`
    - _Requirements: 4.4, 4.5_
  - [x] 6.2 Create `types/blog.ts` with the `Blog` interface
    - _Requirements: 4.6_
  - [x] 6.3 Create `types/certification.ts` with the `Certification` interface
    - _Requirements: 4.7_
  - [x] 6.4 Create `types/hackathon.ts` with the `Hackathon` interface
    - _Requirements: 4.8_
  - [x] 6.5 Create `types/education.ts` with the `Education` interface
    - _Requirements: 4.9_
  - [x] 6.6 Create `types/competitive-programming.ts` with `CPPlatformName` and `CompetitiveProgrammingPlatform`
    - _Requirements: 4.10_
  - [x] 6.7 Create `types/technology.ts` with the `Technology` interface
    - _Requirements: 4.11_
  - [x] 6.8 Create `types/current-activity.ts` with the `CurrentActivity` interface
    - _Requirements: 4.12_
  - [x] 6.9 Create `types/navigation.ts`, `types/profile.ts`, and `types/social.ts` with `NavigationItem`, `Profile`, and `Social`
    - _Requirements: 4.13, 4.14_
  - [x] 6.10 Create `types/site.ts` with the Site configuration interface (site name, tagline, description, domain, default SEO fields, theme defaults, analytics config, social preview image)
    - _Requirements: 4.15_
  - [x] 6.11 Re-export all entity types from `types/index.ts` as a barrel
    - _Requirements: 4.1_

- [x] 7. Populate the DataLayer with typed sample content (data/ directory)
  - [x] 7.1 Create `data/profile.ts`, `data/socials.ts`, `data/navigation.ts`, and `data/site.ts` with representative sample/placeholder content typed against `Profile`, `Social[]`, `NavigationItem[]`, and the Site config type
    - _Requirements: 4.1, 4.13, 4.14, 4.15_
  - [x] 7.2 Create `data/technologies.ts` with sample `Technology[]` entries covering all six `TechCategory` values (Frontend, Backend, Database, DevOps, AI/ML, Web3)
    - _Requirements: 4.1, 4.11, 11.1_
  - [x] 7.3 Create `data/projects.ts` and `data/featured-projects.ts` with sample `Project[]` (including at least one archived, one non-featured, one with `relatedProjects`) and a `FeaturedProjectsConfig` referencing project ids by reference only
    - _Requirements: 4.1, 4.4, 4.5_
  - [x] 7.4 Create `data/blogs.ts` with sample `Blog[]` entries including at least one `draft: true` post and enough non-draft posts to exercise both the "exactly 2" and "3+" preview cases
    - _Requirements: 4.1, 4.6_
  - [x] 7.5 Create `data/certifications.ts` with sample `Certification[]` entries including both featured and non-featured entries
    - _Requirements: 4.1, 4.7_
  - [x] 7.6 Create `data/hackathons.ts` with sample `Hackathon[]` entries
    - _Requirements: 4.1, 4.8_
  - [x] 7.7 Create `data/education.ts` with sample `Education[]` entries with varying `startDate`s
    - _Requirements: 4.1, 4.9_
  - [x] 7.8 Create `data/competitive-programming.ts` with one entry each for LeetCode, Codeforces, and CodeChef
    - _Requirements: 4.1, 4.10_
  - [x] 7.9 Create `data/current-activity.ts` with a static fallback `CurrentActivity` entry
    - _Requirements: 4.1, 4.12, 8.3, 8.4_

- [x] 8. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement data-access selectors (lib/data-access.ts)
  - [x] 9.1 Implement general getters: `getAllProjects`, `getProjectById`, `getProjectBySlug`, `getAllTechnologies`, `getTechnologyById`, `getAllBlogs`, `getBlogBySlug`, `getAllCertifications`, `getAllHackathons`, `getAllEducation`, `getAllCompetitiveProgrammingPlatforms`
    - Selectors read exclusively from `data/*.ts`; no network or async calls
    - _Requirements: 4.2, 4.16, 22.3_
  - [x] 9.2 Write property test for selector determinism
    - **Property 19: Data selectors are deterministic (pure)**
    - **Validates: Requirements 22.3**
  - [x] 9.3 Implement `getFeaturedProjectsResolved()` (resolves `FeaturedProjectsConfig` ids against `getAllProjects()`, ordered by `order`, first entry = default selection)
    - _Requirements: 4.5, 9.1, 9.3_
  - [x] 9.4 Implement `getRecentPublishedBlogs(min = 2, max = 3)` and `getAllPublishedBlogs()`
    - _Requirements: 10.1, 10.5, 20.2_
  - [x] 9.5 Implement `getFeaturedCertifications(cap)` with fallback to non-featured subset per design.md's CertificationsSection selector rule
    - _Requirements: 12.1, 12.2_
  - [x] 9.6 Implement `getHackathonsPreview(cap)`, `getAllHackathons()`, `getAllCertifications()`, and `getEducationSortedByDate()`
    - _Requirements: 14.1, 15.1, 15.2, 21.2, 21.4_
  - [x] 9.7 Implement `filterProjects({ search, category, status })` excluding archived projects, matching title/description case-insensitively for `search`
    - _Requirements: 18.2, 18.3, 18.4_
  - [x] 9.8 Implement `getRelatedOrPopularProjects(project)` (resolves `relatedProjects` ids, falling back to a popular/pinned subset when empty) and `getPrevNextBlog(slug)`
    - _Requirements: 19.3, 19.5, 20.5_
  - [x] 9.9 Write property test for referential integrity of data-layer id references
    - **Property 2: Referential integrity of data-layer id references**
    - **Validates: Requirements 4.5, 4.16, 19.3**
  - [x] 9.10 Write property test for Featured Projects default selection and resolved list
    - **Property 8: ProjectSelector renders exactly the resolved featured project count**
    - **Validates: Requirements 9.1**
  - [x] 9.11 Write property test for preview strict-subset + single Explore More invariant on selector outputs
    - **Property 4: Preview sections show a strict subset with exactly one Explore More button**
    - **Validates: Requirements 6.3, 6.4, 17.1, 17.2**
  - [x] 9.12 Write property test for blog preview/listing selector filtering and bounds
    - **Property 10: Blog preview and listing selectors filter and bound correctly**
    - **Validates: Requirements 10.1, 10.5, 20.2**
  - [x] 9.13 Write property test for certification preview featured/non-featured fallback
    - **Property 13: Certification preview prefers featured, falls back to non-featured**
    - **Validates: Requirements 12.1, 12.2**
  - [x] 9.14 Write property test for preview/listing count bounds and Education chronological order
    - **Property 14: Listing and preview count bounds are respected**
    - **Validates: Requirements 14.1, 15.1, 15.2, 21.2, 21.4**
  - [x] 9.15 Write property test for ProjectsPage filtering exactness and empty-state-safety
    - **Property 15: ProjectsPage filtering is exact and empty-state-safe**
    - **Validates: Requirements 18.2, 18.3, 18.4, 18.7**
  - [x] 9.16 Write property test for not-found related-projects fallback exclusivity
    - **Property 16: Not-found related-projects fallback shows exactly one outcome**
    - **Validates: Requirements 19.5**
  - [x] 9.17 Write property test for blog article lookup distinguishing missing vs. draft slugs
    - **Property 17: Blog article lookup distinguishes missing and draft slugs correctly**
    - **Validates: Requirements 20.6**
  - [x] 9.18 Write property test for previous/next article navigation positional correctness
    - **Property 18: Previous/next article navigation is positionally correct**
    - **Validates: Requirements 20.5**

- [x] 10. Implement build-time referential integrity validation script (lib/validate-data.ts)
  - Write a script that checks every `FeaturedProjectEntry.projectId`, `Project.relatedProjects[]`, `Project.technologies[]`, `Hackathon.technologies[]`, and `Certification.technologies[]` id resolves to an existing record, exiting non-zero on failure
  - Add a `pnpm validate-data` script and wire it into the build pipeline (`prebuild` script in `package.json`)
  - _Requirements: 4.5, 4.16_

- [ ] 11. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement Instagram Sans font loading (lib/fonts.ts)
  - Add placeholder Instagram Sans `.woff2` files (400/500/600/700) under `public/fonts/instagram-sans/` and a monospace font under `public/fonts/geist-mono/` (or equivalent)
  - Implement `lib/fonts.ts` using `next/font/local` for `instagramSans` (variable `--font-sans`, `display: "swap"`, system-sans fallback stack) and `monoFont` (variable `--font-mono`)
  - Map `--font-sans`/`--font-mono` into `tailwind.config.ts` `theme.extend.fontFamily`, and define the H1–H4/body/small/caption/code `fontSize` scale tokens
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 13. Implement the theme system (next-themes, CSS tokens)
  - [x] 13.1 Define theme-aware CSS variable color tokens in `styles/globals.css` (`--background --foreground --card --card-foreground --muted --muted-foreground --border --primary --secondary --accent --ring --shadow`) for both `.dark` (default) and `.light`, and map them into `tailwind.config.ts` `theme.extend.colors`
    - _Requirements: 3.1, 3.6_
  - [x] 13.2 Create `components/theme/ThemeProvider.tsx` (Client) wrapping `next-themes`' `NextThemesProvider` with `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, `storageKey="portfolio-theme"`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 13.3 Create `hooks/useTheme.ts` as a thin wrapper over `next-themes`' `useTheme`
    - _Requirements: 3.5_
  - [x] 13.4 Write property test for theme resolution and persistence
    - **Property 1: Theme resolution and persistence**
    - **Validates: Requirements 3.2, 3.3**

- [ ] 14. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement shared design-system components (components/shared)
  - [x] 15.1 Implement `Container.tsx` (`{ children, className? }`, max-width 1280/1440px, responsive horizontal padding)
    - _Requirements: 1.10, 23.1_
  - [x] 15.2 Implement `Button.tsx` (variants `primary | secondary | outline | ghost | link`; default/hover/active/focus/disabled/loading states) and `Card.tsx` (variants `elevated | flat | interactive`; hover via transform/opacity only)
    - _Requirements: 1.6, 24.4_
  - [x] 15.3 Implement `Badge.tsx` (`{ icon?, label, color? }`)
    - _Requirements: 1.6, 11.7_
  - [x] 15.4 Implement `SectionHeading.tsx` (`{ title, subtitle?, divider? }`) and `ExploreMoreButton.tsx` (`{ href, label }`, the only shared component allowed to invoke `next/link` for cross-route navigation)
    - _Requirements: 17.1, 17.3_
  - [x] 15.5 Implement `Section.tsx` (`{ id, title, subtitle?, exploreMoreHref?, children }`) assigning the section's HTML id and rendering `SectionHeading` plus exactly one `ExploreMoreButton` when `exploreMoreHref` is supplied
    - _Requirements: 6.2, 6.3, 17.1_
  - [x] 15.6 Implement `EmptyState.tsx` and `ErrorState.tsx` (`{ title, message, action? }`), each rendering exactly one Homepage link when used as the error/not-found fallback
    - _Requirements: 18.7, 28.1, 28.2, 28.3_
  - [x] 15.7 Write property test for error/empty state safety (no raw error leakage, exactly one home link)
    - **Property 26: Error and empty states never leak raw errors and always link home**
    - **Validates: Requirements 28.2, 28.3**
  - [x] 15.8 Implement `lib/motion.ts` motion tokens (`DURATION = { fast: 0.15, standard: 0.25, slow: 0.35 }`, `EASING = { out, inOut }`)
    - _Requirements: 24.2_
  - [x] 15.9 Implement `hooks/usePrefersReducedMotion.ts`
    - _Requirements: 24.5_
  - [x] 15.10 Implement `RevealOnView.tsx` (Client: IntersectionObserver-driven `useInView` + Framer Motion `whileInView`/`animate`, `variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }`, `viewport={{ once: true }}`, degrades to instant opacity change under reduced motion)
    - _Requirements: 24.3, 24.4, 24.5_
  - [x] 15.11 Write property test for scroll-reveal state machine revealing exactly once
    - **Property 20: Scroll-reveal state machine reveals exactly once**
    - **Validates: Requirements 24.3**
  - [x] 15.12 Write property test that all Framer Motion variants used across components only touch transform-safe style keys
    - **Property 21: Animation variants touch only transform-safe properties**
    - **Validates: Requirements 24.4**
  - [x] 15.13 Write property test for strictly-binary reduced-motion configuration resolution
    - **Property 22: Reduced-motion resolution is strictly binary**
    - **Validates: Requirements 24.5**

- [ ] 16. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement the Navbar and Active Section Indicator
  - [x] 17.1 Implement `hooks/useActiveSection.ts` (single IntersectionObserver watching all homepage `<section id>` elements, threshold array `[0, 0.25, 0.5, 0.75, 1]`, `rootMargin: "-45% 0px -45% 0px"`, returns the single currently-active section id)
    - _Requirements: 5.5_
  - [x] 17.2 Write property test for active section resolver selecting exactly one section
    - **Property 3: Active section resolver selects exactly one section**
    - **Validates: Requirements 5.5**
  - [x] 17.3 Implement `components/navbar/ActiveSectionIndicator.tsx` (Client, consumes `useActiveSection`, highlights exactly one Navbar link)
    - _Requirements: 5.5_
  - [x] 17.4 Implement `components/navbar/ThemeToggle.tsx` (Client, calls `setTheme`, icon crossfade using `lib/motion.ts` tokens)
    - _Requirements: 3.5_
  - [x] 17.5 Implement `components/navbar/Navbar.tsx` (Client): renders links from `data/navigation.ts`, sticky positioning, scroll-triggered blur/elevation via CSS transition, `scrollIntoView({ behavior: "smooth", block: "start" })` on link click (degrading to `"auto"` under reduced motion), and `router.push("/#section-id")` fallback when not on the homepage
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.9_
  - [x] 17.6 Implement the mobile drawer (shadcn `Sheet`) inside `Navbar.tsx`: collapses links below tablet breakpoint, closes drawer then scrolls on link selection, full keyboard operability (Tab/Shift+Tab/Enter/Space/Escape)
    - _Requirements: 5.6, 5.7, 5.8, 26.1, 26.2_
  - [x] 17.7 Write unit tests for Navbar: renders the fixed link set from `data/navigation.ts`, verifies clicking a link calls `scrollIntoView` and never `router.push` to a different route while on the homepage, verifies drawer open/close and keyboard operability
    - _Requirements: 5.1, 5.2, 5.6, 5.7, 5.8_

- [x] 18. Wire RootLayout
  - Implement `app/layout.tsx`: `<html suppressHydrationWarning>` with `className={cn(instagramSans.variable, monoFont.variable)}`, wraps `{children}` with `ThemeProvider`, renders `Navbar` and `Footer` (Footer stubbed as a static shell until Task 27), applies `scroll-margin-top` sizing convention for anchored sections
    - _Requirements: 1.9, 2.5, 3.4, 5.3_
  - _Requirements: 1.9, 2.5, 3.4_

- [ ] 19. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Implement Homepage shell and Hero Section
  - [x] 20.1 Implement `app/page.tsx` Homepage shell (Server): composes `Section` wrappers for all ten sections in the fixed order (Hero, Featured Projects, Latest Blogs, Tech Stack, Certifications, Competitive Programming, Hackathons, Education, Contact, Footer) with matching HTML ids (`#hero`, `#projects`, `#blog`, `#tech-stack`, `#certifications`, `#competitive-programming`, `#hackathons`, `#education`, `#contact`), and an effect that scrolls to `window.location.hash` after initial paint via `requestAnimationFrame`
    - Each section renders a temporary placeholder until implemented in later tasks
    - _Requirements: 6.1, 6.2, 6.5, 5.9_
  - [x] 20.2 Implement `components/hero/Avatar.tsx` and `components/hero/SocialLinks.tsx` (Server): render Profile photo and one button per known `SocialPlatform`, disabling (not omitting) buttons whose `Social.visible` is `false`
    - _Requirements: 7.1, 7.4, 7.5_
  - [x] 20.3 Write property test for social buttons always rendering per platform with visibility mapped to disabled state
    - **Property 5: Social buttons always render per platform; visibility maps to disabled state**
    - **Validates: Requirements 7.5**
  - [x] 20.4 Implement `components/hero/GitHubContributionCard.tsx` (Server, static image/embed)
    - _Requirements: 7.2_
  - [x] 20.5 Implement `lib/lanyard.ts` (`fetchLanyardStatus(discordUserId)` against the Lanyard REST endpoint, wrapped in try/catch with a short timeout, mapping the payload to `CurrentActivity`)
    - _Requirements: 8.2, 8.6_
  - [x] 20.6 Implement `hooks/useCurrentActivity.ts` (resolves live Lanyard status when reachable, else the server-supplied fallback, else `"Offline"`; never throws) and the status→presentation map (icon/title/subtitle per `ActivityStatus`)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 20.7 Write property test for current activity resolution precedence (live > fallback > Offline)
    - **Property 6: Current Activity resolution favors live data, then fallback, then Offline**
    - **Validates: Requirements 8.2, 8.3, 8.4**
  - [x] 20.8 Write property test for every activity status having a defined presentation
    - **Property 7: Every activity status has defined presentation**
    - **Validates: Requirements 8.5**
  - [x] 20.9 Implement `components/hero/CurrentActivityCard.tsx` (Client): receives server-computed `fallback` prop, uses `useCurrentActivity`, sets `aria-busy` + loading text before first resolution
    - _Requirements: 8.1, 8.3, 8.4, 8.6, 26.9_
  - [x] 20.10 Implement `components/hero/HeroSection.tsx` (Server): two-column CSS grid at desktop / single-column stacked at mobile, composing Avatar, name/role/bio, SocialLinks, CTA buttons, GitHubContributionCard, CurrentActivityCard; wrap in `RevealOnView`
    - _Requirements: 7.1, 7.6, 7.7, 7.8_
  - [x] 20.11 Wire `HeroSection` into `app/page.tsx` at `#hero` (no `exploreMoreHref`)
    - _Requirements: 6.1, 6.2_
  - [x] 20.12 Write unit tests for HeroSection: renders all fixed Profile/Social fields, fits above the fold at a fixed desktop viewport snapshot, mobile single-column stacking
    - _Requirements: 7.1, 7.6, 7.7, 7.8_

- [ ] 21. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Implement the Featured Projects selection reducer and its property tests
  - [x] 22.1 Implement `components/featured-projects/reducer.ts`: `SelectionState` discriminated union (`idle | transitioning | error`), `SelectionAction` (`SELECT | COMMIT | FAIL`), and `selectionReducer`/`initialSelectionState`, guaranteeing the initial state's `project` equals the first resolved featured project and that `FAIL` fully reverts to the pre-`SELECT` state
    - _Requirements: 9.3, 9.5, 9.6, 9.7_
  - [x] 22.2 Write property test for atomic selection, first-project default, and full revert-on-failure
    - **Property 9: Featured project selection is atomic, defaults to the first project, and reverts fully on failure**
    - **Validates: Requirements 9.3, 9.5, 9.6**

- [ ] 23. Implement Featured Projects components
  - [x] 23.1 Implement `components/featured-projects/VideoPlayer.tsx` (Client): renders a fixed-aspect-ratio placeholder box until an `IntersectionObserver` reports near-viewport, then injects the YouTube iframe `src`; dispatches `COMMIT` on successful assignment and `FAIL` on error
    - _Requirements: 9.10, 27.3_
  - [x] 23.2 Implement `components/featured-projects/ProjectSelector.tsx`: renders exactly the resolved featured project list (any length) as cards with title, one-line description, GitHub/demo links, and an active-state indicator driven by `state.selectedIndex`; renders as a horizontally scrollable list at mobile width
    - _Requirements: 9.1, 9.4, 23.5_
  - [x] 23.3 Write property test for ProjectSelector rendering exactly the resolved featured project count
    - **Property 8: ProjectSelector renders exactly the resolved featured project count**
    - **Validates: Requirements 9.1**
  - [x] 23.4 Implement `components/featured-projects/ProjectDetails.tsx`: renders title/description/features/technology badges/links from `state.project`, plus one `ExploreMoreButton` to `/projects`; cross-fades via `AnimatePresence mode="wait"` keyed by `project.id`, `transition={{ duration: DURATION.standard }}`
    - _Requirements: 9.11, 9.9, 17.1_
  - [x] 23.5 Implement `components/featured-projects/FeaturedProjectsClient.tsx` (Client): owns `selectionReducer` state, renders `VideoPlayer` + `ProjectSelector` + `ProjectDetails` from the single state object, dispatches `SELECT` on card click, never calls `router.push`/`window.location`, holds video container min-height constant to preserve scroll position
    - Desktop: VideoPlayer ~65% width left / ProjectSelector ~35% width right; Mobile: video → horizontal selector → details → buttons (CSS `order` utilities, not conditional rendering)
    - _Requirements: 9.2, 9.5, 9.6, 9.7, 9.8, 9.12, 9.13, 23.2, 23.5_
  - [x] 23.6 Write unit tests for FeaturedProjectsClient: clicking each card never calls `router.push`, video iframe absent until intersecting, scroll position (document height) unchanged after selection
    - _Requirements: 9.7, 9.8, 9.10, 9.13_
  - [x] 23.7 Implement `components/featured-projects/FeaturedProjectsSection.tsx` (Server): resolves data via `getFeaturedProjectsResolved()`, passes plain `Project[]` prop into `FeaturedProjectsClient`
    - _Requirements: 9.1, 9.3_
  - [x] 23.8 Wire `FeaturedProjectsSection` into `app/page.tsx` at `#projects` (no `exploreMoreHref` — the section's own `ExploreMoreButton` lives in `ProjectDetails`)
    - _Requirements: 6.1, 6.2, 17.3_

- [ ] 24. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Implement Blog Preview Section
  - [x] 25.1 Implement `components/blog-preview/BlogCard.tsx` (Server): cover image, title, published date, reading time, excerpt
    - _Requirements: 10.2_
  - [x] 25.2 Implement `components/blog-preview/BlogPreviewSection.tsx` (Server): uses `getRecentPublishedBlogs(2, 3)`, renders `BlogCard[]` inside `Section` with `exploreMoreHref="/blog"`; renders `EmptyState` when fewer than 2 non-draft posts exist, treats exactly 2 as normal (no partial-state indicator)
    - _Requirements: 10.1, 10.3, 10.4, 10.5_
  - [x] 25.3 Wire `BlogPreviewSection` into `app/page.tsx` at `#blog`
    - _Requirements: 6.1, 6.2_

- [ ] 26. Implement Tech Stack Marquee Section
  - [x] 26.1 Implement `components/tech-stack/TechBadge.tsx` (Server): icon + technology name
    - _Requirements: 11.7_
  - [x] 26.2 Implement the marquee direction resolver (pure function: even row index → left, odd row index → right) alongside `components/tech-stack/TechCategoryRow.tsx`
    - _Requirements: 11.5_
  - [x] 26.3 Write property test for marquee direction alternating strictly by row index
    - **Property 12: Marquee direction alternates strictly by row index**
    - **Validates: Requirements 11.5**
  - [x] 26.4 Implement `components/tech-stack/TechCategoryRow.tsx` (Client only for hover pause): renders the badge list twice back-to-back in a `flex-nowrap`/`overflow-hidden` track, CSS `@keyframes marquee` animation (`translateX(0)` → `translateX(-50%)`), `onMouseEnter`/`onMouseLeave` toggling `animation-play-state: paused`, `--marquee-duration` custom property adjusted per breakpoint, and a `prefers-reduced-motion` CSS media query pausing the animation outright
    - _Requirements: 11.3, 11.4, 11.6, 11.8, 24.4, 24.5, 24.6_
  - [x] 26.5 Write property test that TechCategoryRow renders exactly its own category's technologies
    - **Property 11: TechCategoryRow renders exactly its own category's technologies**
    - **Validates: Requirements 11.2**
  - [x] 26.6 Implement `components/tech-stack/TechStackSection.tsx` (Server): renders exactly six `TechCategoryRow`s (Frontend, Backend, Database, DevOps, AI/ML, Web3), each fed `technologies.filter(t => t.category === category)`
    - _Requirements: 11.1, 11.2_
  - [x] 26.7 Wire `TechStackSection` into `app/page.tsx` at `#tech-stack`
    - _Requirements: 6.1, 6.2_
  - [x] 26.8 Write unit test verifying the marquee track never wraps badges to multiple lines at mobile/tablet/laptop/desktop breakpoints
    - _Requirements: 11.3, 11.8, 23.1_

- [ ] 27. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 28. Implement Certifications Preview Section
  - [x] 28.1 Implement `components/certifications/CertificationCard.tsx` (Server): issuer, title, issue date, credential link where available
    - _Requirements: 12.3_
  - [x] 28.2 Implement `components/certifications/CertificationsSection.tsx` (Server): uses `getFeaturedCertifications`, renders `CertificationCard[]` inside `Section` with `exploreMoreHref="/certifications"`
    - _Requirements: 12.1, 12.2, 12.4_
  - [x] 28.3 Wire `CertificationsSection` into `app/page.tsx` at `#certifications`
    - _Requirements: 6.1, 6.2_

- [ ] 29. Implement Competitive Programming Section
  - [x] 29.1 Implement `components/competitive-programming/PlatformCard.tsx` (Server): platform logo, rating, solved count, rank, profile link
    - _Requirements: 13.2_
  - [x] 29.2 Implement `components/competitive-programming/CompetitiveProgrammingSection.tsx` (Server): renders one `PlatformCard` per LeetCode/Codeforces/CodeChef entry from `getAllCompetitiveProgrammingPlatforms()`
    - _Requirements: 13.1_
  - [x] 29.3 Wire `CompetitiveProgrammingSection` into `app/page.tsx` at `#competitive-programming`
    - _Requirements: 6.1, 6.2_

- [ ] 30. Implement Hackathons Preview Section
  - [x] 30.1 Implement `components/hackathons/HackathonCard.tsx` (Server): name, organizer, date, achievement
    - _Requirements: 14.2_
  - [x] 30.2 Implement `components/hackathons/HackathonsSection.tsx` (Server): uses `getHackathonsPreview(cap)`, renders `HackathonCard[]` inside `Section` with `exploreMoreHref="/hackathons"`
    - _Requirements: 14.1, 14.3_
  - [x] 30.3 Wire `HackathonsSection` into `app/page.tsx` at `#hackathons`
    - _Requirements: 6.1, 6.2_

- [ ] 31. Implement Education Section
  - [x] 31.1 Implement `components/education/EducationCard.tsx` (Server): institution, degree, duration, achievements
    - _Requirements: 15.1_
  - [x] 31.2 Implement `components/education/EducationSection.tsx` (Server): uses `getEducationSortedByDate()`, renders entries in a timeline/card layout ordered by date
    - _Requirements: 15.1, 15.2_
  - [x] 31.3 Wire `EducationSection` into `app/page.tsx` at `#education`
    - _Requirements: 6.1, 6.2_

- [x] 32. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 33. Implement Contact Section and Footer
  - [x] 33.1 Implement `components/contact/ContactCard.tsx` and `components/contact/ContactSection.tsx` (Server): email/GitHub/LinkedIn/X links and buttons sourced from the Social dataset, resume download action, primary CTA; no `exploreMoreHref` (Contact is exempt per Requirement 6.3)
    - _Requirements: 16.1, 16.2, 16.3_
  - [x] 33.2 Implement `components/footer/Footer.tsx` (Server): navigation links, social links, copyright text
    - _Requirements: 16.4_
  - [x] 33.3 Wire `ContactSection` into `app/page.tsx` at `#contact`, and replace the RootLayout Footer stub (Task 18) with the real `Footer`, confirming it renders as the final element on every route
    - _Requirements: 6.1, 6.2, 16.5_
  - [x] 33.4 Write unit tests for ContactSection and Footer: verifies all fixed Social/Profile-derived links render and Footer renders after all homepage sections
    - _Requirements: 16.1, 16.4, 16.5_

- [x] 34. Checkpoint - Full homepage assembled - Ensure all tests pass, ask the user if questions arise.

- [ ] 35. Implement the Projects listing page
  - [ ] 35.1 Implement `components/projects-page/SearchBar.tsx` and `components/projects-page/FilterBar.tsx` (Client): debounced text input and category/status selects, syncing filter state to URL `searchParams`
    - _Requirements: 18.3, 18.4, 22.3_
  - [ ] 35.2 Implement `components/projects-page/ProjectGrid.tsx` (Server): renders the already-filtered project list, or `EmptyState` when the filtered list is empty
    - _Requirements: 18.2, 18.7_
  - [ ] 35.3 Implement `app/projects/page.tsx` (Server, reads `searchParams`): calls `filterProjects` from `lib/data-access.ts`, composes `SearchBar` + `FilterBar` + `ProjectGrid`, wraps navigation-to-detail in `try/catch` to surface an inline error rather than failing silently
    - _Requirements: 18.1, 18.2, 18.5, 18.6_
  - [ ] 35.4 Implement `app/projects/page.tsx` `generateMetadata` via `lib/seo.ts#buildMetadata` (see Task 42)
    - _Requirements: 25.1, 25.2_
  - [ ] 35.5 Write unit tests for ProjectsPage: search/filter interactions update the rendered grid, empty state renders when no matches, direct route access renders without prior homepage navigation
    - _Requirements: 18.1, 18.3, 18.4, 18.7_

- [ ] 36. Implement the Project detail page
  - [ ] 36.1 Implement `components/project-detail/HeroBanner.tsx`, `ScreenshotGallery.tsx`, `FeatureList.tsx`, `ArchitectureSection.tsx`, `ChallengeSection.tsx`, and `RelatedProjects.tsx` (Server), each rendering their respective `Project` fields; `RelatedProjects` resolves `relatedProjects` ids via `getRelatedOrPopularProjects`
    - _Requirements: 19.2, 19.3_
  - [ ] 36.2 Implement `app/projects/[slug]/page.tsx`: `generateStaticParams` from all non-archived project slugs, calls `notFound()` when `getProjectBySlug(slug)` is undefined, composes `HeroBanner` + `VideoPlayer` + gallery/feature/architecture/challenge sections + `RelatedProjects` + a back-navigation control to `/projects`
    - _Requirements: 19.1, 19.2, 19.4_
  - [ ] 36.3 Implement `app/projects/[slug]/not-found.tsx`: "project not found" message, attempts `getRelatedOrPopularProjects()` as a fallback list, renders `EmptyState` if that list is also empty (never both messages at once)
    - _Requirements: 19.5, 28.4_
  - [ ] 36.4 Write property test for the not-found related-projects view rendering exactly one outcome (already implemented at Task 9.16); confirm this task's component consumes that resolver directly
    - _Requirements: 19.5_
  - [ ] 36.5 Implement `app/projects/[slug]/error.tsx` (friendly message, dev-only console logging, no stack trace, link home)
    - _Requirements: 28.2, 28.3_
  - [ ] 36.6 Write unit tests for ProjectDetailPage: valid slug renders full detail, invalid slug triggers `not-found.tsx`, back-navigation control present
    - _Requirements: 19.1, 19.2, 19.4, 19.5_

- [ ] 37. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 38. Implement the Blog listing and article pages
  - [ ] 38.1 Implement `components/blog-page/BlogGrid.tsx` (Server) and `components/blog-page/CategoryFilter.tsx` (Client, filters over tags)
    - _Requirements: 20.2_
  - [ ] 38.2 Implement `app/blog/page.tsx` (Server): uses `getAllPublishedBlogs()`, composes `CategoryFilter` + `BlogGrid`, `generateMetadata`
    - _Requirements: 20.1, 20.2, 25.1, 25.2_
  - [ ] 38.3 Implement `components/blog-article/TableOfContents.tsx` (derived from content headings at build time), `ReadingProgress.tsx` (Client, scroll-based), `ShareButtons.tsx` (Client), and `PrevNextNav.tsx` (uses `getPrevNextBlog`)
    - _Requirements: 20.5_
  - [ ] 38.4 Write property test for previous/next article navigation positional correctness (already implemented at Task 9.18); confirm `PrevNextNav` consumes `getPrevNextBlog` directly
    - _Requirements: 20.5_
  - [ ] 38.5 Implement `app/blog/[slug]/page.tsx`: `generateStaticParams` from non-draft blog slugs, calls `notFound()` for absent or draft slugs, composes `TableOfContents` + article content + `ReadingProgress` + `ShareButtons` + `PrevNextNav`, `generateMetadata`
    - _Requirements: 20.3, 20.4, 20.5, 25.1, 25.2_
  - [ ] 38.6 Implement `app/blog/[slug]/not-found.tsx` and `app/blog/[slug]/error.tsx` per the shared not-found/error convention
    - _Requirements: 20.6, 28.2, 28.3_
  - [ ] 38.7 Write unit tests for BlogPage/BlogArticlePage: listing shows only non-draft posts, article page renders TOC/reading time/tags/prev-next, draft/absent slug renders not-found
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ] 39. Implement the Hackathons and Certifications listing pages
  - [ ] 39.1 Implement `app/hackathons/page.tsx` (Server): renders all hackathons via `getAllHackathons()` including achievement/date/technologies for each entry, `generateMetadata`
    - _Requirements: 21.1, 21.2, 25.1, 25.2_
  - [ ] 39.2 Implement `app/certifications/page.tsx` (Server): renders all certifications via `getAllCertifications()` including issuer/date/credential link for each entry, `generateMetadata`
    - _Requirements: 21.3, 21.4, 25.1, 25.2_
  - [ ] 39.3 Implement `app/hackathons/not-found.tsx` and `app/certifications/not-found.tsx` per the shared convention
    - _Requirements: 28.1, 28.3_
  - [ ] 39.4 Write unit tests confirming both pages are directly reachable and render the full, un-truncated dataset
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [ ] 40. Implement root-level 404 and error boundaries
  - [ ] 40.1 Implement `app/not-found.tsx` (friendly 404 message + Homepage link) and `app/error.tsx` (friendly error message, dev-only logging, no stack trace, Homepage link)
    - _Requirements: 22.4, 28.2, 28.3_
  - [ ] 40.2 Implement a shared page-level render-state resolver (`{content, error, empty}` exclusivity) used by `ProjectsPage`, `ProjectDetailPage` not-found, and `BlogArticlePage` not-found
    - _Requirements: 28.4_
  - [ ] 40.3 Write property test for the page-level render-state resolver selecting exactly one of content/error/empty
    - **Property 27: Page-level state resolver renders exactly one of content, error, or empty**
    - **Validates: Requirements 28.4**

- [ ] 41. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 42. Implement SEO and metadata system (lib/seo.ts)
  - [ ] 42.1 Implement `lib/seo.ts#buildMetadata({ title, description, path, image? })`, generating title/description/canonical/Open Graph/Twitter Card consistently, ensuring no two routes receive an identical (title, description) pair
    - _Requirements: 25.1, 25.2, 25.3_
  - [ ] 42.2 Write property test for metadata uniqueness per distinct route
    - **Property 23: Metadata is unique per distinct route**
    - **Validates: Requirements 25.2, 25.3**
  - [ ] 42.3 Retrofit `generateMetadata`/static `metadata` exports onto `app/page.tsx`, `app/projects/page.tsx`, `app/projects/[slug]/page.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/hackathons/page.tsx`, and `app/certifications/page.tsx` using `buildMetadata` (detail routes derive title/description/image from `metaTitle`/`metaDescription`/`coverImage`/`heroImage`)
    - _Requirements: 25.1, 25.2, 25.3_
  - [ ] 42.4 Implement `app/sitemap.ts` (iterates non-archived projects, non-draft blogs, hackathons, certifications, plus the four listing routes and homepage) and `app/robots.ts` (allow all, points to sitemap)
    - _Requirements: 25.4_
  - [ ] 42.5 Write property test for sitemap including all eligible entities and excluding drafts/archived
    - **Property 24: Sitemap includes all eligible entities and excludes drafts/archived**
    - **Validates: Requirements 25.4**
  - [ ] 42.6 Implement JSON-LD builders in `lib/seo.ts`: `personSchema(profile, socials)`, `creativeWorkSchema(project)` (or `SoftwareSourceCode`), `blogPostingSchema(post)`, `breadcrumbListSchema(pathSegments)`
    - _Requirements: 25.5, 25.6_
  - [ ] 42.7 Write property test for structured-data builders returning the correct schema type and breadcrumb depth
    - **Property 25: Structured-data builders return the correct schema type and breadcrumb depth**
    - **Validates: Requirements 25.5, 25.6**
  - [ ] 42.8 Render `<script type="application/ld+json">` server-side on the Homepage (`personSchema`), `ProjectDetailPage` (`creativeWorkSchema` + `breadcrumbListSchema`), and `BlogArticlePage` (`blogPostingSchema` + `breadcrumbListSchema`)
    - _Requirements: 25.5, 25.6_
  - [ ] 42.9 Audit every `next/image` usage across all implemented components/pages, ensuring `alt`/`width`/`height` (or `fill` + aspect-ratio container) are set, with `alt=""` on purely decorative images
    - _Requirements: 25.7_

- [ ] 43. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 44. Accessibility pass
  - [ ] 44.1 Audit and correct semantic HTML usage across `RootLayout`, `Homepage`, and all dedicated pages (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer` in place of generic containers)
    - _Requirements: 26.3_
  - [ ] 44.2 Verify exactly one `H1` per page and a logical heading hierarchy across all implemented pages; fix any violations
    - _Requirements: 26.4_
  - [ ] 44.3 Add visible focus indicators (Tailwind `focus-visible` utilities) to every interactive element and accessible names (`aria-label` or visually-hidden text) to every icon-only control (ThemeToggle, drawer trigger, ShareButtons, social icon buttons)
    - _Requirements: 26.1, 26.2, 26.5_
  - [ ] 44.4 Audit theme color tokens in `styles/globals.css` for a minimum 4.5:1 contrast ratio (normal text) / 3:1 (large text) in both themes; adjust token values as needed
    - _Requirements: 26.6_
  - [ ] 44.5 Ensure every external link (GitHub/LinkedIn/X/demo/credential links) uses `target="_blank"` and `rel="noopener noreferrer"` with descriptive link text (no "click here")
    - _Requirements: 26.8_
  - [ ] 44.6 Write axe-core accessibility assertions per page template (Homepage, ProjectsPage, ProjectDetailPage, BlogPage, BlogArticlePage, HackathonsPage, CertificationsPage) and a one-H1-per-page check
    - _Requirements: 26.3, 26.4, 26.5, 26.6, 26.8_

- [ ] 45. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 46. Performance optimization pass
  - [ ] 46.1 Apply dynamic imports / code splitting to heavy, non-critical components (`VideoPlayer`, `TechCategoryRow` marquee, `Sheet` drawer contents, `ShareButtons`)
    - _Requirements: 27.4, 27.5_
  - [ ] 46.2 Audit all `next/image` usages for correct sizing/priority hints and confirm the `VideoPlayer` iframe only mounts once `FeaturedProjectsSection` is near-viewport (re-verify Task 23.1's IntersectionObserver gate)
    - _Requirements: 27.3, 27.5_
  - [ ] 46.3 Run a bundle analysis (`@next/bundle-analyzer`) and reduce Client Component JavaScript where a component can be pushed back to a Server Component boundary
    - _Requirements: 27.4, 27.5, 1.9_
  - [ ] 46.4 Write a regression test asserting Client Component boundaries are limited to the documented list (Navbar, ThemeProvider, CurrentActivityCard, FeaturedProjectsClient, VideoPlayer, TechCategoryRow, SearchBar/FilterBar/CategoryFilter, ReadingProgress, ShareButtons, RevealOnView, ThemeToggle)
    - _Requirements: 1.9, 27.5_

- [ ] 47. Checkpoint - Ensure all tests pass, ask the user if questions arise.

- [ ] 48. Final testing and polish
  - [ ] 48.1 Run `pnpm validate-data` (Task 10) against the final sample datasets and fix any referential-integrity failures surfaced
    - _Requirements: 4.5, 4.16_
  - [ ] 48.2 Add/verify Vitest configuration (`vitest.config.ts`) wires React Testing Library, fast-check, and axe-core across all test files created in prior tasks; ensure `pnpm test` runs the full suite headlessly
    - _Requirements: (supports all property/unit test tasks above)_
  - [ ] 48.3 Review responsive breakpoint behavior for Hero and FeaturedProjectsSection multi-column layouts (mobile/tablet/laptop/desktop) and touch-target sizing (≥44px) across all interactive elements; fix any violations found in code
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_
  - [ ] 48.4 Final pass ensuring `pnpm build` succeeds with the `prebuild` data-validation script, `pnpm lint`, and the full `pnpm test` suite all passing, confirming the app is deployable to the Vercel free tier without paid add-ons
    - _Requirements: 1.8_

- [ ] 49. Final checkpoint - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP; they are exclusively test-writing sub-tasks (unit or property-based) and are never core implementation.
- Every property-based test task references its exact property number and validated requirement clause(s) from `design.md`'s Correctness Properties section (27 properties total, all covered).
- Data-driven architecture is enforced structurally: no homepage section or dedicated page task renders content that doesn't originate from `lib/data-access.ts` selectors over `data/*.ts`.
- The Explore More routing pattern (Requirement 17) is enforced by construction: only `ExploreMoreButton` (Task 15.4) and in-card detail links call `next/link` for cross-route homepage navigation; this is verified by property test 9.11 and unit tests on `FeaturedProjectsClient` (23.6).
- Client Component boundaries are deliberately minimal and enumerated explicitly (Task 46.4) to satisfy Requirement 1.9/27.5.
- No task in this plan performs an actual deployment; Task 48.4 only verifies the project is build-clean and deployable, per the constraint against production deployment actions.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3"] },
    { "id": 3, "tasks": ["5", "12", "13.1", "15.1", "15.6", "15.8", "15.9"] },
    {
      "id": 4,
      "tasks": [
        "6.1",
        "6.2",
        "6.3",
        "6.4",
        "6.5",
        "6.6",
        "6.7",
        "6.8",
        "6.9",
        "6.10",
        "13.2",
        "15.2",
        "15.3",
        "15.4",
        "15.7",
        "15.10"
      ]
    },
    { "id": 5, "tasks": ["6.11", "13.3", "15.5", "15.11", "15.12", "15.13"] },
    {
      "id": 6,
      "tasks": [
        "7.1",
        "7.2",
        "7.3",
        "7.4",
        "7.5",
        "7.6",
        "7.7",
        "7.8",
        "7.9",
        "13.4"
      ]
    },
    { "id": 7, "tasks": ["9.1", "17.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "17.2", "17.3"] },
    { "id": 9, "tasks": ["9.4", "17.4"] },
    { "id": 10, "tasks": ["9.5", "17.5"] },
    { "id": 11, "tasks": ["9.6", "17.6"] },
    { "id": 12, "tasks": ["9.7", "17.7"] },
    { "id": 13, "tasks": ["9.8", "18"] },
    {
      "id": 14,
      "tasks": [
        "9.9",
        "9.10",
        "9.11",
        "9.12",
        "9.13",
        "9.14",
        "9.15",
        "9.16",
        "9.17",
        "9.18"
      ]
    },
    { "id": 15, "tasks": ["10"] },
    {
      "id": 16,
      "tasks": [
        "20.1",
        "20.2",
        "20.4",
        "20.5",
        "22.1",
        "25.1",
        "26.1",
        "28.1",
        "29.1",
        "30.1",
        "31.1",
        "33.1",
        "33.2"
      ]
    },
    {
      "id": 17,
      "tasks": [
        "33.3",
        "20.3",
        "20.6",
        "22.2",
        "23.1",
        "23.2",
        "23.4",
        "25.2",
        "26.2",
        "28.2",
        "29.2",
        "30.2",
        "31.2"
      ]
    },
    {
      "id": 18,
      "tasks": ["25.3", "20.7", "20.8", "20.9", "23.3", "23.5", "26.3", "33.4"]
    },
    { "id": 19, "tasks": ["28.3", "20.10", "23.6", "23.7", "26.4"] },
    { "id": 20, "tasks": ["29.3", "26.5"] },
    { "id": 21, "tasks": ["30.3", "26.6"] },
    { "id": 22, "tasks": ["31.3"] },
    { "id": 23, "tasks": ["20.11"] },
    { "id": 24, "tasks": ["23.8", "20.12"] },
    { "id": 25, "tasks": ["26.7"] },
    { "id": 26, "tasks": ["26.8"] },
    { "id": 27, "tasks": ["35.1", "35.2", "36.1", "38.1", "39.1", "39.2"] },
    { "id": 28, "tasks": ["35.3", "36.2", "38.2", "39.3"] },
    { "id": 29, "tasks": ["35.4", "35.5", "36.3", "38.3"] },
    { "id": 30, "tasks": ["36.4", "36.5", "38.4", "38.5"] },
    { "id": 31, "tasks": ["36.6", "38.6", "39.4"] },
    { "id": 32, "tasks": ["38.7"] },
    { "id": 33, "tasks": ["40.1", "40.2"] },
    { "id": 34, "tasks": ["40.3"] },
    { "id": 35, "tasks": ["42.1"] },
    { "id": 36, "tasks": ["42.2", "42.3"] },
    { "id": 37, "tasks": ["42.4"] },
    { "id": 38, "tasks": ["42.5", "42.6"] },
    { "id": 39, "tasks": ["42.7", "42.8"] },
    { "id": 40, "tasks": ["42.9"] },
    { "id": 41, "tasks": ["44.1"] },
    { "id": 42, "tasks": ["44.2"] },
    { "id": 43, "tasks": ["44.3"] },
    { "id": 44, "tasks": ["44.4"] },
    { "id": 45, "tasks": ["44.5"] },
    { "id": 46, "tasks": ["44.6"] },
    { "id": 47, "tasks": ["46.1"] },
    { "id": 48, "tasks": ["46.2"] },
    { "id": 49, "tasks": ["46.3"] },
    { "id": 50, "tasks": ["46.4"] },
    { "id": 51, "tasks": ["48.1"] },
    { "id": 52, "tasks": ["48.2"] },
    { "id": 53, "tasks": ["48.3"] },
    { "id": 54, "tasks": ["48.4"] }
  ]
}
```
