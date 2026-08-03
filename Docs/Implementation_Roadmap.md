# Implementation Roadmap

## Portfolio v2.0

> **Purpose**
>
> This roadmap defines the exact implementation order for the portfolio.
> Each phase should produce a stable, testable milestone before moving
> to the next. Do not skip phases unless dependencies are already
> satisfied.

---

# 1. Development Principles

## Objectives

- Build incrementally.
- Keep the application deployable at every phase.
- Avoid technical debt.
- Prefer reusable components over one-off implementations.
- Complete functionality before adding visual polish.

## Rules

- Every feature must be responsive.
- Every component must support both themes.
- No duplicated UI logic.
- Every commit should leave the project in a working state.

---

# 2. Phase Overview

Phase Goal Estimated Priority

---

0 Project Initialization Critical
1 Foundation & Design System Critical
2 Layout & Navigation Critical
3 Hero Section Critical
4 Featured Projects Critical
5 Blog Preview High
6 Tech Stack Marquee High
7 Certifications Medium
8 Competitive Programming Medium
9 Hackathons Medium
10 Education Medium
11 Contact & Footer High
12 Dedicated Pages Critical
13 SEO & Accessibility Critical
14 Performance Optimization Critical
15 Testing & Final Polish Critical
16 Deployment Critical

---

# Phase 0 --- Project Initialization

## Goal

Create a clean, scalable foundation.

## Tasks

- Initialize Next.js (App Router)
- Configure TypeScript
- Configure Tailwind CSS
- Install shadcn/ui
- Configure ESLint
- Configure Prettier
- Configure absolute imports
- Create folder structure
- Initialize Git repository
- Configure Vercel

## Deliverable

A running blank application with proper tooling.

---

# Phase 1 --- Foundation & Design System

## Build

- Theme provider
- Typography system
- Color tokens
- Container component
- Button component
- Card component
- Badge component
- Section wrapper
- Layout wrapper
- Responsive utilities

## Deliverable

A reusable design system that every future section uses.

---

# Phase 2 --- Layout & Navigation

## Build

Navbar

Requirements:

- Sticky
- Blur background
- Theme toggle
- Mobile menu
- Smooth scrolling
- Active section indicator

Footer placeholder

Global layout

Scroll progress (optional)

## Testing

- Mobile navigation
- Desktop navigation
- Theme persistence
- Scroll accuracy

---

# Phase 3 --- Hero Section

## Build

- Profile image
- Name
- Tagline
- Bio
- Social links
- CTA buttons
- GitHub contribution graph
- Current Activity widget

## Current Activity

Integrate Discord/Lanyard if feasible.

Provide graceful fallback.

## Deliverable

Fully functional landing hero.

---

# Phase 4 --- Featured Projects (Highest Priority)

## Build Layout

Desktop

Left: Embedded YouTube player

Right: Top three project selector

Below:

Project details

Feature list

Technology badges

Buttons

Explore More

## Functionality

Default first project

On click:

- Update iframe
- Update title
- Update description
- Update features
- Update technologies
- Update buttons

No route change.

Smooth transition.

## Mobile

Video first

Horizontal project selector

Details below

## Deliverable

Interactive showcase fully operational.

---

# Phase 5 --- Blog Preview

Homepage:

Display latest 2--3 posts.

Buttons:

Read More

Explore More

Routing:

/blog

/blog/\[slug\]

Deliverable:

Working preview + routing.

---

# Phase 6 --- Tech Stack Marquee

Categories:

- Frontend
- Backend
- Database
- DevOps
- AI/ML
- Web3

Rules:

One row per category.

Infinite marquee.

Alternate direction.

Pause on hover.

No wrapping.

Deliverable:

Smooth performant marquee.

---

# Phase 7 --- Certifications

Homepage preview.

Dedicated page.

Credential links.

Filters (future ready).

---

# Phase 8 --- Competitive Programming

Cards:

- LeetCode
- Codeforces
- CodeChef

Display:

Rating

Solved

Profile

Achievements

---

# Phase 9 --- Hackathons

Homepage preview.

Dedicated page.

Timeline.

Gallery.

Awards.

---

# Phase 10 --- Education

Timeline layout.

Institution

Degree

Duration

Achievements

Relevant coursework

---

# Phase 11 --- Contact

Contact card

Email

GitHub

LinkedIn

Twitter/X

Resume download

Call-to-action

Footer

---

# Phase 12 --- Dedicated Pages

## Projects

Search

Filters

Categories

Project detail

## Blog

Listing

Article page

TOC

Tags

Navigation

## Hackathons

Listing

Details

## Certifications

Listing

Filters

---

# Phase 13 --- SEO & Accessibility

Checklist

- Metadata
- Open Graph
- Twitter Card
- Sitemap
- robots.txt
- Semantic HTML
- Keyboard navigation
- Focus states
- ARIA labels
- Color contrast

Acceptance:

Lighthouse Accessibility ≥95

---

# Phase 14 --- Performance

Optimize

- next/image
- Dynamic imports
- Lazy YouTube iframe
- Lazy animations
- Bundle analysis
- Font optimization
- Image compression

Acceptance:

Performance ≥95

---

# Phase 15 --- Testing & Polish

## Manual Testing

Desktop

Tablet

Mobile

Dark mode

Light mode

Keyboard

Touch

Cross-browser

## UX Review

Spacing

Typography

Animation timing

Scroll behavior

Loading states

Hover states

Empty states

---

# Phase 16 --- Deployment

Deploy to Vercel.

Verify:

- Routing
- Metadata
- Theme
- Performance
- Responsive layouts
- Social previews
- Analytics (optional)

---

# Future Milestones (Post v1)

## Version 1.1

- Guestbook
- View counter
- Project search improvements
- Reading progress
- Better animations

## Version 1.2

- AI assistant
- Resume generator
- Project filtering
- API-backed activity

## Version 2.0

- CMS integration
- Analytics dashboard
- Admin panel
- Localization

---

# Definition of Done

The project is complete when:

- Homepage is fully interactive.
- Dedicated pages are functional.
- Navigation is intuitive.
- All sections are responsive.
- Dark and light themes are polished.
- Lighthouse scores exceed 95.
- Accessibility meets WCAG AA.
- Codebase is modular, documented, and maintainable.
- The portfolio feels like a polished software product rather than a
  traditional résumé website.
