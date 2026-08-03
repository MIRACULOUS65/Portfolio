# Requirements Document

## Introduction

This document defines the requirements for Developer Portfolio v2, a premium, interactive personal developer portfolio built with Next.js App Router. The portfolio is architected as a homepage-first experience: the homepage (`/`) is a long, single primary surface containing preview sections for Hero, Featured Projects, Latest Blogs, Tech Stack, Certifications, Competitive Programming, Hackathons, Education, Contact, and Footer. The navbar never changes routes — it only smooth-scrolls to homepage sections. Dedicated pages (`/projects`, `/projects/[slug]`, `/blog`, `/blog/[slug]`, `/hackathons`, `/certifications`) exist solely for expanded browsing and are reached only through "Explore More" buttons.

The requirements below are derived directly from the authoritative documentation suite located in `Docs/` (Portfolio_PRD, Tech_Stack, UI_UX_Guidelines, Design_System, Routing_Architecture, Data_Architecture, Component_Specification, Animation_Guidelines, Coding_Standards, SEO_Accessibility, Implementation_Roadmap, Structure). One explicit deviation from the Docs has been instructed by the user: the primary typeface is **Instagram Sans** (not Geist/Inter as suggested in Design_System.md and Tech_Stack.md). This deviation is captured explicitly in Requirement 2 below and flagged as needing a custom font-loading strategy since Instagram Sans is not available as a standard `next/font` Google font.

Non-negotiable architectural decisions inherited from the Docs (per the ROLE/MASTER_INDEX priority hierarchy) that MUST NOT be changed or reinterpreted during design or implementation:

- Homepage-first architecture with the section order defined in Requirement 6.
- Navbar scroll-only behavior (never routes).
- The "Explore More" routing pattern (only these buttons route to dedicated pages).
- The Featured Projects interaction model (video + selector, no navigation, no reload).
- The Tech Stack marquee concept (one infinite row per category, alternating direction).
- Light/dark theme support with dark as default.
- Data-driven architecture (no hardcoded JSX content, no duplicated data).

## Glossary

- **Portfolio_Application**: The complete Next.js application delivering the developer portfolio, encompassing the homepage and all dedicated pages.
- **Homepage**: The root route (`/`) of the Portfolio_Application, containing all preview sections in a fixed order.
- **Navbar**: The persistent navigation component rendered on all routes, containing links to Home, Projects, Blog, Hackathons, and Certifications.
- **Explore_More_Button**: A button rendered at the end of a homepage preview section that navigates the user to a corresponding dedicated page.
- **HeroSection**: The homepage section introducing the developer, containing profile photo, name, role, bio, CTA buttons, social links, GitHub contribution graph, and the CurrentActivityWidget.
- **CurrentActivityWidget**: The component displaying the developer's live status (Listening, Coding, Gaming, Idle, Offline), preferentially sourced from Discord via Lanyard.
- **FeaturedProjectsSection**: The homepage section acting as the visual centerpiece, composed of a VideoPlayer, a ProjectSelector, and ProjectDetails.
- **VideoPlayer**: The component embedding a YouTube iframe for the currently selected featured project's demo video.
- **ProjectSelector**: The component displaying the featured projects (typically three) as selectable cards.
- **ProjectDetails**: The component displaying the title, description, feature list, technology badges, and links for the currently selected featured project.
- **BlogPreviewSection**: The homepage section displaying the 2–3 most recent blog posts.
- **TechStackSection**: The homepage section displaying six technology category marquee rows (Frontend, Backend, Database, DevOps, AI/ML, Web3).
- **TechCategoryRow**: A single infinite horizontal marquee row within the TechStackSection representing one technology category.
- **CertificationsSection**: The homepage section previewing certifications.
- **CompetitiveProgrammingSection**: The homepage section previewing competitive programming profiles (LeetCode, Codeforces, CodeChef).
- **HackathonsSection**: The homepage section previewing hackathon participation.
- **EducationSection**: The homepage section previewing education history.
- **ContactSection**: The homepage section displaying contact channels and a call to action.
- **Footer**: The component rendered at the bottom of the Homepage containing navigation, social links, and copyright information.
- **ProjectsPage**: The dedicated page at route `/projects` listing all projects with search, filter, and category capabilities.
- **ProjectDetailPage**: The dedicated page at route `/projects/[slug]` displaying full detail for a single project.
- **BlogPage**: The dedicated page at route `/blog` listing all blog posts.
- **BlogArticlePage**: The dedicated page at route `/blog/[slug]` displaying a single blog post.
- **HackathonsPage**: The dedicated page at route `/hackathons` listing all hackathons.
- **CertificationsPage**: The dedicated page at route `/certifications` listing all certifications.
- **ThemeSystem**: The mechanism (built on next-themes) controlling dark/light theme selection, persistence, and application.
- **DataLayer**: The collection of typed local data files under `data/` (profile, navigation, socials, projects, featured-projects, blogs, certifications, hackathons, education, competitive-programming, technologies, site) that are the sole source of portfolio content.
- **FontLoader**: The mechanism responsible for loading and applying the Instagram Sans typeface (and its fallback stack) across the Portfolio_Application.
- **SEOMetadataSystem**: The mechanism generating per-route metadata, Open Graph tags, Twitter Card tags, canonical URLs, sitemap.xml, robots.txt, and JSON-LD structured data using the Next.js Metadata API.
- **Active_Section_Indicator**: The mechanism (based on Intersection Observer) that determines and highlights which homepage section is currently in view within the Navbar.

## Requirements

### Requirement 1: Technical Foundation

**User Story:** As a developer maintaining the portfolio, I want the project built on a modern, strictly-typed, performant stack, so that the codebase is maintainable, fast, and deployable at no cost.

#### Acceptance Criteria

1. THE Portfolio_Application SHALL be built using Next.js App Router.
2. THE Portfolio_Application SHALL be written entirely in TypeScript with `strict` mode enabled.
3. THE Portfolio_Application SHALL use TailwindCSS as the exclusive styling mechanism.
4. THE Portfolio_Application SHALL use Framer Motion as the exclusive animation library.
5. THE Portfolio_Application SHALL use shadcn/ui for overlay and interactive primitive components (dialog, tooltip, popover, accordion, dropdown, sheet, command palette, toast).
6. THE Portfolio_Application SHALL use Lucide React as the exclusive icon library.
7. THE Portfolio_Application SHALL use pnpm as the package manager.
8. THE Portfolio_Application SHALL be deployable on the Vercel free tier without requiring paid add-ons.
9. THE Portfolio_Application SHALL render Server Components by default and SHALL use Client Components only where state, effects, event handlers, browser APIs, or animation require them.
10. THE Portfolio_Application SHALL organize source code into `app/`, `components/`, `sections/`, `hooks/`, `lib/`, `types/`, `data/`, `utils/`, `styles/`, and `public/` directories.

### Requirement 2: Typography and Font Loading

**User Story:** As the portfolio owner, I want the site to use Instagram Sans as the primary typeface, so that the portfolio reflects my chosen brand identity.

#### Acceptance Criteria

1. THE Portfolio_Application SHALL render body and heading text using "Instagram Sans" as the primary font family.
2. WHERE Instagram Sans fails to load or is unavailable, THE FontLoader SHALL fall back to a system sans-serif stack (e.g., system-ui, -apple-system, sans-serif) so that text remains legible.
3. THE FontLoader SHALL self-host or otherwise directly serve the Instagram Sans font files, because Instagram Sans is not available as a standard Google font through `next/font/google`.
4. THE FontLoader SHALL apply `font-display: swap` or an equivalent strategy so that text remains visible during font load.
5. THE FontLoader SHALL expose the font family as a CSS variable/Tailwind token before any component references Instagram Sans, and no component SHALL hardcode the "Instagram Sans" font-family value directly; every reference SHALL go through the exposed token.
6. THE Portfolio_Application SHALL retain a monospace font token, separate from Instagram Sans, for code snippets and technical content.
7. THE Portfolio_Application SHALL maintain the typography scale (H1–H4, body, small, caption, code sizes) defined for the design system regardless of the font-family change.

### Requirement 3: Theme System

**User Story:** As a visitor, I want to view the portfolio in dark or light mode according to my preference, so that the experience is comfortable in any lighting condition.

#### Acceptance Criteria

1. THE ThemeSystem SHALL support a dark theme and a light theme.
2. THE ThemeSystem SHALL apply the dark theme by default on first visit.
3. WHEN a visitor selects a theme, THE ThemeSystem SHALL persist the selected theme no later than page unload or navigation away from the current page, so that the selection is available across page reloads and future visits.
4. WHEN the Portfolio_Application loads, THE ThemeSystem SHALL apply the persisted or default theme before the first paint so that no flash of an incorrect theme occurs.
5. THE Navbar SHALL provide a theme toggle control that switches between dark and light themes.
6. THE Portfolio_Application SHALL implement all colors as theme-aware CSS variables so that every component supports both themes without component-level changes.

### Requirement 4: Data-Driven Content Architecture

**User Story:** As a developer maintaining the portfolio, I want all content to originate from typed local data files, so that content updates never require touching UI code and no content is duplicated.

#### Acceptance Criteria

1. THE DataLayer SHALL store all portfolio content in typed local data files under `data/` (profile, navigation, socials, projects, featured-projects, blogs, certifications, hackathons, education, competitive-programming, technologies, site).
2. THE Portfolio_Application SHALL render homepage sections and dedicated pages exclusively from data supplied by the DataLayer.
3. THE Portfolio_Application SHALL NOT hardcode portfolio content (project names, descriptions, bios, links, technology lists) directly inside JSX.
4. THE DataLayer SHALL define a Project model containing general fields (id, slug, title, shortDescription, description, category, status), media fields (thumbnail, heroImage, gallery, youtubeVideoId), link fields (github, liveDemo, documentation), date fields (startDate, completionDate), metadata fields (featured, pinned, archived), a technologies list, content fields (features, challenges, learnings, architecture, screenshots), SEO fields (metaTitle, metaDescription), and a relatedProjects list.
5. THE DataLayer SHALL define a Featured Projects dataset that references Project ids by reference rather than duplicating Project data, SHALL support any number of featured Project references, and SHALL define the display order such that the first referenced project is the default selection.
6. THE DataLayer SHALL define a Blog model containing id, slug, title, excerpt, coverImage, content, publishedDate, readingTime, author, tags, featured, draft, and seo fields.
7. THE DataLayer SHALL define a Certification model containing id, title, issuer, issueDate, expirationDate, credentialId, credentialUrl, badgeImage, technologies, and featured fields.
8. THE DataLayer SHALL define a Hackathon model containing id, slug, name, organizer, description, date, location, achievement, teamMembers, technologies, images, demo, and github fields.
9. THE DataLayer SHALL define an Education model containing id, institution, degree, specialization, startDate, endDate, grade, achievements, coursework, and logo fields.
10. THE DataLayer SHALL define a Competitive Programming platform model containing id, platform, username, profileUrl, rating, solved, rank, badges, and logo fields, covering LeetCode, Codeforces, and CodeChef.
11. THE DataLayer SHALL define a Technology model containing id, name, category, icon, website, and optional color and proficiency fields, where category is one of Frontend, Backend, Database, DevOps, AI/ML, or Web3.
12. THE DataLayer SHALL define a Current Activity model containing source, status, title, subtitle, icon, image, and updatedAt fields, where status is one of Listening, Coding, Gaming, Idle, or Offline.
13. THE DataLayer SHALL define a Navigation model (id, label, href, sectionId, order, visible) from which the Navbar renders its links dynamically.
14. THE DataLayer SHALL define a Profile model (name, role, bio, avatar, location, resume, email, availability, and optional currentCompany and yearsExperience) and a Social model (id, platform, username, url, icon, visible).
15. THE DataLayer SHALL define a Site configuration model containing site name, tagline, description, domain, default SEO fields, theme defaults, analytics configuration, and a social preview image.
16. THE ProjectsPage, ProjectDetailPage, Homepage FeaturedProjectsSection, and BlogPage SHALL each consume the same underlying dataset for a given entity type so that no data is duplicated between homepage previews and dedicated pages.

### Requirement 5: Navbar and Scroll-Only Navigation

**User Story:** As a visitor, I want the navbar to let me jump to any part of the homepage without leaving it, so that I can browse continuously without unexpected page loads.

#### Acceptance Criteria

1. THE Navbar SHALL display links for Home, Projects, Blog, Hackathons, and Certifications.
2. WHEN a visitor activates a Navbar link, THE Navbar SHALL smoothly scroll the viewport to the corresponding Homepage section and SHALL NOT navigate to a different route.
3. THE Navbar SHALL remain visible (sticky) while the visitor scrolls the Homepage.
4. WHILE the visitor scrolls past the top of the Homepage, THE Navbar SHALL apply a background blur and elevation effect.
5. THE Active_Section_Indicator SHALL determine the currently visible Homepage section using an Intersection Observer and SHALL highlight exactly one corresponding Navbar link at a time, updating the highlighted link promptly enough that it never lags visibly behind the section the visitor is viewing during rapid scrolling.
6. WHILE the viewport width is below the tablet breakpoint, THE Navbar SHALL collapse its links into a mobile drawer menu.
7. WHEN a visitor selects a link inside the mobile drawer menu, THE Navbar SHALL close the drawer and smoothly scroll to the corresponding Homepage section.
8. THE Navbar SHALL be reachable and operable using only keyboard navigation (Tab, Shift+Tab, Enter, Space).
9. IF a visitor is on a dedicated page (e.g., `/projects`) and activates a Navbar link that targets a Homepage section, THEN THE Navbar SHALL navigate to the Homepage and scroll to the corresponding section.

### Requirement 6: Homepage Information Architecture

**User Story:** As a visitor, I want the homepage to present my complete story in a clear, ordered sequence, so that I can understand who the developer is and what they have built without hunting for information.

#### Acceptance Criteria

1. THE Homepage SHALL render sections in exactly this order: Hero, Featured Projects, Latest Blogs, Tech Stack, Certifications, Competitive Programming, Hackathons, Education, Contact, Footer.
2. THE Homepage SHALL assign each section a unique HTML id matching its navigation target (`#hero`, `#projects`, `#blog`, `#tech-stack`, `#certifications`, `#competitive-programming`, `#hackathons`, `#education`, `#contact`).
3. EVERY Homepage section other than Hero and Contact SHALL display only a preview subset of its underlying data and SHALL include an Explore_More_Button linking to the corresponding dedicated page.
4. THE Homepage SHALL NOT display the complete content set (e.g., all projects, all blog posts, all certifications) directly on the Homepage.
5. THE Homepage SHALL maintain consistent vertical spacing and heading structure across all sections.

### Requirement 7: Hero Section

**User Story:** As a visitor landing on the site, I want an immediate, clear introduction to the developer, so that I understand who they are and what they build within seconds.

#### Acceptance Criteria

1. THE HeroSection SHALL display the developer's profile photo, name, role, bio, call-to-action buttons, and social links, sourced from the Profile and Social data models.
2. THE HeroSection SHALL display a GitHub contribution graph.
3. THE HeroSection SHALL display the CurrentActivityWidget.
4. THE HeroSection SHALL render social links as active buttons targeting GitHub, LinkedIn, X, Email, and Resume where corresponding Social entries are marked visible.
5. WHERE a Social entry is marked not visible, THE HeroSection SHALL render a placeholder or disabled button in its position rather than omitting it entirely, so that visitors can see the full set of social channels that exist.
6. WHILE the viewport is at desktop width, THE HeroSection SHALL render its content in a two-column layout.
7. WHILE the viewport is at mobile width, THE HeroSection SHALL render its content in a single-column stacked layout.
8. THE HeroSection SHALL fit within the first viewport on common desktop screen sizes without requiring the visitor to scroll to see the primary introduction.

### Requirement 8: Current Activity Widget

**User Story:** As a visitor, I want to see what the developer is currently doing, so that the portfolio feels alive and personal.

#### Acceptance Criteria

1. THE CurrentActivityWidget SHALL display one of the following states: Listening, Coding, Gaming, Idle, or Offline.
2. WHERE a Discord/Lanyard data source is configured and reachable, THE CurrentActivityWidget SHALL always source its status from that data source and SHALL NOT display the static fallback status while live data remains available.
3. IF the Discord/Lanyard data source is unavailable or not configured, THEN THE CurrentActivityWidget SHALL display a static fallback status without producing a visible error to the visitor.
4. THE CurrentActivityWidget SHALL always display some status to the visitor, defaulting to an "Offline" state if neither live data nor a configured fallback status can be determined.
5. THE CurrentActivityWidget SHALL display an icon, title, and subtitle corresponding to the current status.
6. THE CurrentActivityWidget SHALL be a Client Component when it fetches live status, so that Server Component boundaries defined in Requirement 1 are preserved.

### Requirement 9: Featured Projects Section (Homepage Centerpiece)

**User Story:** As a visitor, I want to browse and preview the developer's best work directly on the homepage, so that I can evaluate their skills without navigating away.

#### Acceptance Criteria

1. THE FeaturedProjectsSection SHALL display all featured projects referenced in the Featured Projects dataset, defaulting to three when exactly three are configured, and SHALL support a different total count without requiring code changes.
2. WHILE the viewport is at desktop width, THE FeaturedProjectsSection SHALL render the VideoPlayer occupying approximately 65% of the section width on the left and the ProjectSelector occupying approximately 35% of the section width on the right.
3. THE FeaturedProjectsSection SHALL select the first featured project as the default selection on initial render.
4. THE ProjectSelector SHALL display each featured project as a card containing the project title, one-line description, GitHub link, live demo link, and an active-state indicator.
5. WHEN a visitor selects a project card in the ProjectSelector, THE FeaturedProjectsSection SHALL update the VideoPlayer source, the ProjectDetails title, description, feature list, technology badges, and links to reflect the newly selected project, updating all of these elements atomically so that visitors never observe a state where some elements reflect the previous project and others reflect the newly selected project.
6. IF any element cannot be updated to reflect the newly selected project, THEN THE FeaturedProjectsSection SHALL revert the selection to the previously selected project rather than displaying a partially updated state.
7. THE FeaturedProjectsSection SHALL only change the selected project in response to explicit visitor selection of a project card, and SHALL NOT change the selection automatically.
8. WHEN a visitor selects a project card in the ProjectSelector, THE FeaturedProjectsSection SHALL NOT trigger route navigation or a full page reload.
9. WHEN the selected featured project changes, THE FeaturedProjectsSection SHALL animate the transition between the previous and new ProjectDetails content within 300ms.
10. THE VideoPlayer SHALL lazy-load the embedded YouTube iframe so that it is not fetched before the FeaturedProjectsSection enters the viewport.
11. THE ProjectDetails SHALL display an Explore_More_Button that navigates to the ProjectsPage.
12. WHILE the viewport is at mobile width, THE FeaturedProjectsSection SHALL render its content in the order: video, horizontal project selector, project details, action buttons.
13. THE FeaturedProjectsSection SHALL preserve the current scroll position when the selected project changes.

### Requirement 10: Blog Preview Section

**User Story:** As a visitor, I want to see the developer's most recent writing on the homepage, so that I can gauge their communication and technical depth.

#### Acceptance Criteria

1. THE BlogPreviewSection SHALL display the 2 to 3 most recently published, non-draft blog posts sourced from the Blog dataset.
2. THE BlogPreviewSection SHALL display, for each post, a cover image, title, published date, reading time, and excerpt.
3. THE BlogPreviewSection SHALL display an Explore_More_Button that navigates to the BlogPage.
4. THE BlogPreviewSection SHALL treat displaying exactly 2 published posts as a normal state and SHALL NOT display a partial-state indicator in that case.
5. IF the Blog dataset contains fewer than 2 published posts, THEN THE BlogPreviewSection SHALL display an appropriate empty or partial state rather than leaving unused layout space blank.

### Requirement 11: Tech Stack Marquee Section

**User Story:** As a visitor, I want to see the developer's technology skills organized clearly by category, so that I can quickly assess their technical range.

#### Acceptance Criteria

1. THE TechStackSection SHALL render exactly six TechCategoryRow components corresponding to Frontend, Backend, Database, DevOps, AI/ML, and Web3 categories.
2. EACH TechCategoryRow SHALL render all Technology entries belonging to its category sourced from the Technology dataset.
3. EACH TechCategoryRow SHALL render its technology badges as a single horizontal row that SHALL NOT wrap to multiple lines at any supported viewport width.
4. EACH TechCategoryRow SHALL animate its badges as a continuous, seamless, infinite horizontal marquee loop.
5. THE TechStackSection SHALL alternate the marquee scroll direction between consecutive TechCategoryRow instances.
6. WHEN a visitor hovers over a TechCategoryRow, THE TechCategoryRow SHALL pause its marquee animation, and SHALL resume smoothly when the hover ends.
7. EACH technology badge SHALL display an icon and the technology name.
8. WHILE the viewport narrows across breakpoints, THE TechCategoryRow SHALL adjust marquee speed rather than wrapping badges to additional rows.

### Requirement 12: Certifications Preview Section

**User Story:** As a visitor, I want to see the developer's certifications on the homepage, so that I can verify their qualifications at a glance.

#### Acceptance Criteria

1. THE CertificationsSection SHALL display a preview subset of certifications sourced from the Certification dataset, prioritizing entries marked featured.
2. IF no certifications are marked featured, THEN THE CertificationsSection SHALL fall back to displaying a preview subset of non-featured certifications instead of displaying none.
3. THE CertificationsSection SHALL display, for each certification included in the preview, the issuer, title, issue date, and a link to the credential where available.
4. THE CertificationsSection SHALL display an Explore_More_Button that navigates to the CertificationsPage.

### Requirement 13: Competitive Programming Section

**User Story:** As a visitor, I want to see the developer's competitive programming achievements, so that I can assess their problem-solving skills.

#### Acceptance Criteria

1. THE CompetitiveProgrammingSection SHALL display a platform card for each of LeetCode, Codeforces, and CodeChef sourced from the Competitive Programming dataset.
2. EACH platform card SHALL display the platform logo, rating, number of problems solved, rank, and a link to the developer's profile on that platform.

### Requirement 14: Hackathons Preview Section

**User Story:** As a visitor, I want to see the developer's hackathon participation on the homepage, so that I can gauge their collaborative and rapid-building experience.

#### Acceptance Criteria

1. THE HackathonsSection SHALL display a preview subset of hackathons sourced from the Hackathon dataset.
2. THE HackathonsSection SHALL display, for each previewed hackathon, the name, organizer, date, and achievement.
3. THE HackathonsSection SHALL display an Explore_More_Button that navigates to the HackathonsPage.

### Requirement 15: Education Section

**User Story:** As a visitor, I want to see the developer's educational background, so that I understand their academic foundation.

#### Acceptance Criteria

1. THE EducationSection SHALL display education entries sourced from the Education dataset, including institution, degree, duration, and achievements for each entry.
2. THE EducationSection SHALL render entries in a timeline or card layout ordered by date.

### Requirement 16: Contact Section and Footer

**User Story:** As a visitor who wants to get in touch, I want clear contact information and a call to action, so that I can reach the developer easily.

#### Acceptance Criteria

1. THE ContactSection SHALL display links or buttons for email, GitHub, LinkedIn, and X/Twitter, sourced from the Social dataset.
2. THE ContactSection SHALL provide a resume download action.
3. THE ContactSection SHALL display a primary call-to-action.
4. THE Footer SHALL display navigation links, social links, and copyright text.
5. THE Footer SHALL be rendered as the final element of the Homepage.

### Requirement 17: Explore More Routing Pattern

**User Story:** As a visitor, I want a single, consistent way to move from a homepage preview to full content, so that navigation feels predictable throughout the site.

#### Acceptance Criteria

1. EVERY Homepage preview section (Featured Projects, Latest Blogs, Certifications, Hackathons) SHALL provide exactly one Explore_More_Button.
2. WHEN a visitor activates an Explore_More_Button, THE Portfolio_Application SHALL navigate to the corresponding dedicated page (`/projects`, `/blog`, `/hackathons`, or `/certifications`).
3. THE Portfolio_Application SHALL NOT provide any other homepage control that performs route navigation away from the Homepage, other than Explore_More_Buttons, project/blog links inside preview cards that lead to detail pages, and the Navbar's dedicated-page-return behavior described in Requirement 5.

### Requirement 18: Projects Listing Page

**User Story:** As a visitor interested in seeing all of a developer's work, I want a dedicated projects page with search and filtering, so that I can find relevant projects quickly.

#### Acceptance Criteria

1. THE ProjectsPage SHALL be reachable directly at the route `/projects` without requiring prior navigation through the Homepage.
2. THE ProjectsPage SHALL display all non-archived projects sourced from the Project dataset.
3. THE ProjectsPage SHALL provide a search control that filters displayed projects by title or description text.
4. THE ProjectsPage SHALL provide filter controls for project category and status.
5. WHEN a visitor selects a project card on the ProjectsPage, THE Portfolio_Application SHALL navigate to `/projects/[slug]` for the selected project.
6. IF navigation to `/projects/[slug]` fails, THEN THE ProjectsPage SHALL display an error message to the visitor rather than failing silently.
7. IF no projects match the current search or filter criteria, THEN THE ProjectsPage SHALL display an empty state message.

### Requirement 19: Project Detail Page

**User Story:** As a visitor evaluating a specific project, I want a complete breakdown of that project, so that I can understand its scope, technology, and outcome.

#### Acceptance Criteria

1. THE ProjectDetailPage SHALL be reachable directly at the route `/projects/[slug]` without requiring prior navigation through the Homepage or ProjectsPage.
2. WHEN the requested slug corresponds to an existing project, THE ProjectDetailPage SHALL display that project's hero image, demo video, screenshot gallery, long description, feature list, architecture notes, challenges, lessons learned, technology stack, GitHub link, and live demo link, sourced from the Project dataset.
3. THE ProjectDetailPage SHALL display related projects sourced from the project's relatedProjects field.
4. THE ProjectDetailPage SHALL provide a back-navigation control to the ProjectsPage.
5. IF the requested slug does not correspond to an existing project, THEN THE ProjectDetailPage SHALL display a friendly not-found state explaining the issue and SHALL attempt to display related projects, showing an appropriate empty-state message if no related or alternative projects are available.

### Requirement 20: Blog Listing and Article Pages

**User Story:** As a visitor interested in a developer's writing, I want a dedicated blog listing and individual article pages, so that I can read their full body of work.

#### Acceptance Criteria

1. THE BlogPage SHALL be reachable directly at the route `/blog` without requiring prior navigation through the Homepage.
2. THE BlogPage SHALL display all non-draft blog posts sourced from the Blog dataset.
3. WHEN a visitor selects a post on the BlogPage, THE Portfolio_Application SHALL navigate to `/blog/[slug]` for the selected post.
4. THE BlogArticlePage SHALL be reachable directly at the route `/blog/[slug]` without requiring prior navigation through the Homepage or BlogPage.
5. THE BlogArticlePage SHALL display a table of contents, reading time, tags, and previous/next article navigation.
6. IF the requested slug does not correspond to any existing blog post, OR corresponds only to a draft blog post, THEN THE BlogArticlePage SHALL display a friendly not-found state.

### Requirement 21: Hackathons and Certifications Listing Pages

**User Story:** As a visitor, I want dedicated pages listing every hackathon and certification, so that I can review the developer's full history in each area.

#### Acceptance Criteria

1. THE HackathonsPage SHALL be reachable directly at the route `/hackathons` without requiring prior navigation through the Homepage.
2. THE HackathonsPage SHALL display all hackathons sourced from the Hackathon dataset, including achievement, date, and technologies for each entry.
3. THE CertificationsPage SHALL be reachable directly at the route `/certifications` without requiring prior navigation through the Homepage.
4. THE CertificationsPage SHALL display all certifications sourced from the Certification dataset, including issuer, date, and credential link for each entry.

### Requirement 22: Browser Navigation and Deep Linking

**User Story:** As a visitor, I want normal browser navigation (back, forward, refresh, direct URL) to work correctly everywhere, so that the site behaves like any reliable web application.

#### Acceptance Criteria

1. THE Portfolio_Application SHALL support direct URL access to every dedicated page and detail route without error.
2. WHEN a visitor uses the browser back or forward button, THE Portfolio_Application SHALL restore the previous route or scroll position without producing a broken navigation state, and IF the target route no longer exists or was dynamically generated and is no longer available, THEN THE Portfolio_Application SHALL still restore some valid, navigable state rather than a broken page.
3. WHEN a visitor refreshes a dedicated page or detail route, THE Portfolio_Application SHALL render the same content as the original navigation.
4. IF a visitor requests a specific route that does not exist, THEN THE Portfolio_Application SHALL display a custom 404 page with a friendly message and a link back to the Homepage; THE Portfolio_Application SHALL NOT use the 404 page to represent server failures or other non-routing error conditions.

### Requirement 23: Responsive Design

**User Story:** As a visitor on any device, I want the portfolio to adapt cleanly to my screen size, so that the experience feels intentional rather than broken.

#### Acceptance Criteria

1. THE Portfolio_Application SHALL render correctly at mobile (<640px), tablet (768–1023px), laptop (1024–1279px), and desktop (≥1280px) breakpoints.
2. WHILE the viewport is at desktop width, sections defined with multi-column layouts (Hero, FeaturedProjectsSection) SHALL render in their multi-column configuration.
3. WHILE the viewport is at mobile width, sections defined with multi-column layouts SHALL render in a single-column stacked configuration.
4. THE Portfolio_Application SHALL provide touch targets of at least 44px for interactive elements on touch-capable viewports.
5. WHILE the viewport is at mobile width, THE FeaturedProjectsSection's ProjectSelector SHALL render as a horizontally scrollable selector rather than a vertical list.

### Requirement 24: Animation and Motion

**User Story:** As a visitor, I want smooth, purposeful animations that communicate state without distracting me, so that the portfolio feels polished and professional.

#### Acceptance Criteria

1. THE Portfolio_Application SHALL use Framer Motion as the animation engine for entrance, hover, and state-change animations.
2. THE Portfolio_Application SHALL apply timing tokens of 150ms (fast), 250ms (standard), and 350ms (slow) consistently across comparable interactions.
3. WHEN a Homepage section first enters the viewport, THE Portfolio_Application SHALL reveal it once with a fade and slight upward movement, and SHALL NOT re-trigger that reveal on subsequent scrolls into view.
4. THE Portfolio_Application SHALL animate only opacity and transform properties for scroll reveals and hover effects, and SHALL NOT animate layout-triggering properties (width, height, top, left, box-shadow) for any purpose, including responsive breakpoint changes or dynamic content sizing.
5. IF the visitor's operating system explicitly signals a `prefers-reduced-motion: reduce` preference, THEN THE Portfolio_Application SHALL disable stagger effects, marquee movement, and large transitions while preserving essential state feedback; THE Portfolio_Application SHALL NOT alter its default animation behavior for visitors who have not explicitly set a motion preference.
6. THE TechCategoryRow marquee animation SHALL loop continuously without a visible seam or jump.

### Requirement 25: SEO and Metadata

**User Story:** As the portfolio owner, I want every page to be fully discoverable and to present rich previews when shared, so that recruiters and visitors can find and trust the site.

#### Acceptance Criteria

1. EVERY route in the Portfolio_Application SHALL define metadata using the Next.js Metadata API, including title, description, canonical URL, Open Graph tags, and a Twitter Card.
2. THE SEOMetadataSystem SHALL generate a unique title and description for the Homepage, each ProjectDetailPage, each BlogArticlePage, the CertificationsPage, and the HackathonsPage.
3. THE SEOMetadataSystem SHALL NOT duplicate identical metadata between two distinct routes.
4. THE SEOMetadataSystem SHALL generate `sitemap.xml` and `robots.txt`, automatically including the Homepage, ProjectsPage, BlogPage, CertificationsPage, and HackathonsPage, and excluding draft blog content.
5. THE SEOMetadataSystem SHALL emit JSON-LD structured data using the Person schema on the Homepage, a CreativeWork or SoftwareSourceCode schema on each ProjectDetailPage, and a BlogPosting schema on each BlogArticlePage.
6. THE SEOMetadataSystem SHALL emit a BreadcrumbList JSON-LD schema on dedicated pages that are more than one level deep.
7. THE Portfolio_Application SHALL use `next/image` for all images, providing alt text, width, and height for every image, and an empty alt attribute for purely decorative images.

### Requirement 26: Accessibility

**User Story:** As a visitor using assistive technology or a keyboard, I want to fully operate and understand the portfolio, so that the site is usable regardless of ability.

#### Acceptance Criteria

1. THE Portfolio_Application SHALL support complete keyboard operation of all interactive elements using Tab, Shift+Tab, Enter, Space, and Escape (for dismissible overlays).
2. EVERY interactive element SHALL display a visible focus indicator when focused via keyboard.
3. THE Portfolio_Application SHALL use semantic HTML elements (header, nav, main, section, article, aside, footer) in place of generic containers wherever a semantic equivalent applies.
4. EVERY page SHALL contain exactly one H1 element and SHALL maintain a logical heading hierarchy.
5. EVERY interactive element that relies on an icon alone SHALL expose an accessible name via ARIA attributes or visually hidden text.
6. THE Portfolio_Application SHALL maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text in both themes.
7. THE Portfolio_Application SHALL NOT convey information using color alone; IF a future contact form or other input validation state would convey an error using color alone, THEN THE Portfolio_Application SHALL prevent submission and fail validation until a non-color indicator (icon, text, or ARIA attribute) is also present.
8. EVERY external link SHALL open with `target="_blank"` and `rel="noopener noreferrer"` and SHALL use descriptive link text rather than generic phrases such as "click here".
9. IF an asynchronous section is loading data, THEN THE Portfolio_Application SHALL expose an `aria-busy` state and a meaningful loading message rather than an unexplained spinner.

### Requirement 27: Performance

**User Story:** As a visitor, I want the portfolio to load quickly and respond instantly to my interactions, so that browsing feels effortless.

#### Acceptance Criteria

1. THE Portfolio_Application SHALL achieve a Lighthouse Performance score of at least 95 on the Homepage.
2. THE Portfolio_Application SHALL achieve a Largest Contentful Paint under 2.5 seconds, a Cumulative Layout Shift under 0.1, and an Interaction to Next Paint under 200ms on the Homepage.
3. THE VideoPlayer SHALL defer loading the YouTube iframe until the FeaturedProjectsSection is near the viewport.
4. THE Portfolio_Application SHALL apply code splitting and dynamic imports for heavy, non-critical components.
5. THE Portfolio_Application SHALL minimize the amount of Client Component JavaScript shipped to the browser, per the Server-Component-by-default rule in Requirement 1.

### Requirement 28: Error and Empty States

**User Story:** As a visitor who encounters missing content or an error, I want a clear, friendly explanation, so that I am not confused or shown a broken page.

#### Acceptance Criteria

1. IF a dedicated page has no matching content for the current filters or request, THEN THE Portfolio_Application SHALL display an empty state with a descriptive message.
2. IF an unexpected runtime error occurs while rendering a route, THEN THE Portfolio_Application SHALL display a friendly error message and SHALL NOT expose raw error details or stack traces to the visitor.
3. THE Portfolio_Application SHALL provide a working navigation path back to the Homepage from every error or not-found state.
4. IF an empty state and an error condition occur for the same view at the same time, THEN THE Portfolio_Application SHALL display a single clear message with the Homepage navigation path rather than showing multiple simultaneous error or empty-state messages.
