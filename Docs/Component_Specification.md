# Component Specification

## Portfolio v2.0

> **Purpose**
>
> This document defines every major UI component, its responsibilities,
> data requirements, interactions, states, responsiveness,
> accessibility, and implementation expectations. Components should be
> reusable, composable, and data-driven.

---

# 1. Component Design Principles

## Objectives

- Single Responsibility Principle
- Reusable over duplicated
- Data-driven rendering
- Responsive by design
- Accessible
- Theme-aware
- Animation-ready

Rules:

- Never hardcode repeated UI.
- Prefer composition over inheritance.
- Keep business logic outside presentation where possible.
- Client Components only when interaction requires them.

---

# 2. High-Level Component Tree

```text
RootLayout
├── Navbar
├── HomePage
│   ├── HeroSection
│   ├── FeaturedProjectsSection
│   ├── BlogPreviewSection
│   ├── TechStackSection
│   ├── CertificationsSection
│   ├── CompetitiveProgrammingSection
│   ├── HackathonsSection
│   ├── EducationSection
│   ├── ContactSection
│   └── Footer
├── ProjectsPage
├── BlogPage
├── CertificationsPage
└── HackathonsPage
```

---

# 3. Shared Components

## Container

Purpose: Maintain consistent max width and horizontal padding.

Responsibilities: - Responsive width - Horizontal spacing - Section
alignment

Props: - children - className

---

## Section

Purpose: Wrap every homepage section.

Responsibilities: - id - spacing - heading - optional description

Props:

- id
- title
- subtitle
- children

---

## Button

Variants:

- Primary
- Secondary
- Outline
- Ghost
- Link

States:

- Default
- Hover
- Active
- Focus
- Disabled
- Loading

---

## Card

Reusable across:

- Projects
- Blogs
- Certifications
- Hackathons

Variants:

- Elevated
- Flat
- Interactive

Hover:

- Border highlight
- Shadow increase
- Slight translateY

---

## Badge

Purpose:

Technology tags.

Props:

- icon
- label
- color

Hover:

Slight lift.

---

## SectionHeading

Contains:

- Title
- Description
- Decorative divider (optional)

---

# 4. Navbar

Purpose:

Primary navigation.

Responsibilities:

- Sticky
- Active section
- Theme toggle
- Mobile drawer
- Smooth scroll

State:

- Active section
- Drawer open
- Theme

Desktop:

Horizontal.

Mobile:

Hamburger.

Accessibility:

Keyboard support.

---

# 5. HeroSection

Purpose:

Introduce the developer.

Children:

- Avatar
- Name
- Role
- Bio
- CTA
- SocialLinks
- GitHubContributionCard
- CurrentActivityCard

Data:

- profile
- socials
- github
- activity

Responsive:

Desktop: 2-column.

Mobile: Single column.

---

## Avatar

Circular image.

Optimized with next/image.

---

## SocialLinks

Buttons:

GitHub

LinkedIn

X

Email

Resume

---

## CurrentActivityCard

Purpose:

Display live activity.

States:

Listening

Coding

Gaming

Idle

Offline

Fallback:

Static status.

Refresh:

Configurable interval if using live data.

---

# 6. FeaturedProjectsSection

Purpose:

Homepage centerpiece.

Layout:

Desktop

Left: VideoPlayer

Right: ProjectSelector

Bottom: ProjectDetails

---

## VideoPlayer

Source:

YouTube iframe.

Props:

videoId

title

Behavior:

- Lazy load
- Replace source on selection
- No page reload

---

## ProjectSelector

Displays exactly three featured projects.

Card contains:

- Name
- Short description
- GitHub
- Demo
- Active indicator

State:

selectedProject

Interaction:

Click updates selected project.

---

## ProjectDetails

Displays:

- Title
- Long description
- Features
- Tech stack
- GitHub
- Demo
- Explore More

Animation:

Fade between project changes.

---

# 7. BlogPreviewSection

Purpose:

Show recent articles.

Contains:

BlogCard list.

Explore More.

---

## BlogCard

Fields:

- Cover
- Title
- Date
- Reading time
- Excerpt

Hover:

Lift + shadow.

---

# 8. TechStackSection

Contains six marquee rows.

Children:

TechCategoryRow

---

## TechCategoryRow

Props:

category

technologies

direction

Behavior:

Infinite marquee.

Pause on hover.

No wrapping.

---

## TechBadge

Contains:

Icon

Name

Hover tooltip (optional).

---

# 9. CertificationsSection

Children:

CertificationCard

Explore More

---

## CertificationCard

Displays:

Issuer

Title

Date

Credential link

Status

---

# 10. CompetitiveProgrammingSection

Children:

PlatformCard

Platforms:

LeetCode

Codeforces

CodeChef

---

## PlatformCard

Displays:

Logo

Rating

Solved

Rank

Profile

CTA

---

# 11. HackathonsSection

Children:

HackathonCard

Timeline (future)

Gallery preview

---

## HackathonCard

Displays:

Name

Organizer

Date

Achievement

Description

---

# 12. EducationSection

Children:

EducationCard

TimelineItem

---

## EducationCard

Fields:

Institution

Degree

Duration

Achievements

Relevant coursework

---

# 13. ContactSection

Children:

ContactCard

ContactForm (future)

SocialButtons

---

## ContactCard

Displays:

Email

GitHub

LinkedIn

X

Resume

Primary CTA.

---

# 14. Footer

Contains:

Navigation

Socials

Copyright

Theme acknowledgement (optional)

---

# 15. Dedicated Page Components

ProjectsPage:

- SearchBar
- FilterBar
- ProjectGrid
- Pagination (future)

ProjectDetailPage:

- HeroBanner
- VideoPlayer
- ScreenshotGallery
- FeatureList
- ArchitectureSection
- ChallengeSection
- RelatedProjects

BlogPage:

- BlogGrid
- CategoryFilter
- Search

BlogArticle:

- TOC
- ReadingProgress
- ShareButtons
- PrevNext

---

# 16. Common Component States

Every interactive component should define:

- Loading
- Empty
- Error
- Disabled
- Hover
- Focus
- Active

Never render blank content.

---

# 17. Accessibility

All components must support:

- Keyboard navigation
- Visible focus
- Semantic HTML
- Screen readers
- Reduced motion

---

# 18. Animation Rules

Shared timing:

150--250ms

Shared easing.

No inconsistent motion.

Animations communicate state changes.

---

# 19. Data Flow

```text
Typed Data
      │
      ▼
Section Component
      │
      ▼
Reusable Child Components
      │
      ▼
UI Rendering
```

No component should fetch unrelated data.

---

# 20. Acceptance Criteria

- Components are reusable.
- No duplicated layouts.
- Props are typed.
- Theme support is universal.
- Responsive behavior is consistent.
- Shared components power multiple sections.
- New sections can be added without architectural changes.
