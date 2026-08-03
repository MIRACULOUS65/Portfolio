# Routing Architecture

## Portfolio v2.0

> **Purpose**
>
> This document defines the routing strategy, navigation flow, URL
> structure, scroll behavior, and page responsibilities for the
> portfolio. The objective is to keep the homepage as the primary
> experience while using dedicated routes only for deeper exploration.

---

# 1. Routing Philosophy

The homepage (`/`) is the central hub of the application.

It is intentionally long and contains preview sections for all major
content.

Dedicated pages exist only for expanded browsing and documentation.

Users should never feel forced to leave the homepage.

---

# 2. Navigation Rules

## Navbar

Items:

- Home
- Projects
- Blog
- Certifications
- Hackathons

### Behavior

Navbar links DO NOT navigate to another route.

They perform smooth scrolling to their corresponding homepage sections.

Example:

- Home → Hero
- Projects → Featured Projects
- Blog → Latest Blogs
- Certifications → Certifications Preview
- Hackathons → Hackathons Preview

---

# 3. Explore More Pattern

Every preview section ends with an **Explore More** button.

Only this button performs routing.

Example:

Homepage Preview

↓

Explore More

↓

Dedicated Page

This pattern must remain consistent across the entire application.

---

# 4. Route Tree

```text
/
├── Hero
├── Featured Projects
├── Latest Blogs
├── Tech Stack
├── Certifications
├── Competitive Programming
├── Hackathons
├── Education
├── Contact
└── Footer

/projects
/projects/[slug]

/blog
/blog/[slug]

/hackathons
/hackathons/[slug] (future)

/certifications
```

---

# 5. Homepage Sections

Every section has:

- Unique HTML id
- Navigation target
- Heading
- Preview content
- Explore More button (except Hero, Contact)

Example ids:

```text
#hero
#projects
#blog
#tech-stack
#certifications
#competitive-programming
#hackathons
#education
#contact
```

---

# 6. Scroll Behavior

Requirements:

- Smooth scrolling
- Correct offset for sticky navbar
- URL hash updates are optional but recommended
- Active navigation item updates while scrolling
- Preserve browser performance

Do not use scroll-jacking.

---

# 7. Active Navigation

Determine active section using Intersection Observer.

Rules:

- Highlight current section.
- Only one active item at a time.
- Update as user scrolls.
- Works on desktop and mobile.

---

# 8. Homepage Responsibilities

The homepage is responsible for:

- Introducing the developer
- Highlighting best projects
- Showing recent blogs
- Displaying tech stack
- Previewing certifications
- Previewing hackathons
- Showing education
- Contact information

It is NOT responsible for showing every project or article.

---

# 9. Projects Routing

## Homepage

Displays only the top three featured projects.

Interactive behavior:

- Default project selected
- Clicking project changes embedded YouTube demo
- Updates title, description, features, technologies, and links
- No route change

Explore More

↓

/projects

---

## /projects

Responsibilities:

- Display all projects
- Search
- Filter
- Categories
- Status
- Pagination (future)

Selecting a project

↓

/projects/\[slug\]

---

## /projects/\[slug\]

Contains:

- Hero
- Demo video
- Gallery
- Long description
- Features
- Architecture
- Challenges
- Lessons learned
- Tech stack
- GitHub
- Live Demo
- Related projects
- Back navigation

---

# 10. Blog Routing

Homepage

↓

Latest 2--3 blogs

↓

Explore More

↓

/blog

↓

Select article

↓

/blog/\[slug\]

Article page includes:

- TOC
- Reading time
- Tags
- Previous/Next navigation

---

# 11. Certifications Routing

Homepage Preview

↓

Explore More

↓

/certifications

Dedicated page lists all certifications.

---

# 12. Hackathons Routing

Homepage Preview

↓

Explore More

↓

/hackathons

Future:

/hackathons/\[slug\]

---

# 13. Deep Linking

The application should support:

- Visiting `/projects`
- Visiting `/projects/[slug]`
- Visiting `/blog/[slug]`

without requiring prior navigation through the homepage.

---

# 14. Browser Behavior

Support:

- Back button
- Forward button
- Refresh
- Direct URL access

No broken navigation states.

---

# 15. Mobile Navigation

Navbar collapses into a drawer.

Selecting an item:

- Close drawer
- Smooth scroll
- Preserve current route

Explore More buttons still navigate normally.

---

# 16. SEO Routing

Each dedicated page has:

- Unique metadata
- Canonical URL
- Open Graph
- Twitter Card
- Structured data (where applicable)

Homepage metadata focuses on overall portfolio.

---

# 17. Error Routes

Provide:

- Custom 404 page
- Friendly empty states
- Missing project fallback
- Missing blog fallback

---

# 18. Future Expansion

Architecture should support:

```text
/experience
/opensource
/talks
/gallery
/uses
/now
```

without changing existing routing conventions.

---

# 19. Navigation Flow

```text
Visitor
   │
   ▼
Homepage (/)
   │
   ├── Scroll to Hero
   ├── Scroll to Projects
   ├── Scroll to Blog
   ├── Scroll to Certifications
   ├── Scroll to Hackathons
   └── Scroll to Contact
          │
          ▼
   Explore More
          │
          ▼
Dedicated Page
          │
          ▼
Specific Content
          │
          ▼
Back/Home Navigation
```

---

# 20. Acceptance Criteria

- Navbar always scrolls within the homepage.
- No navbar item changes routes.
- Every preview section contains an Explore More button.
- Dedicated pages are reachable directly by URL.
- Scroll behavior is smooth and accurate.
- Active navigation updates correctly.
- Browser history works naturally.
- Routing remains intuitive on desktop, tablet, and mobile.
