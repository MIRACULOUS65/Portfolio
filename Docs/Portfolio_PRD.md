# Product Requirements Document (PRD)

## Personal Portfolio v2.0

**Audience:** Claude Opus (Kiro), frontend engineers

---

# 1. Product Vision

Build a premium developer portfolio that feels like an interactive
product instead of a static resume.

Core principles:

- Minimal
- Extremely fast
- Interactive
- Recruiter-friendly
- Mobile-first responsive
- Modern animations
- Maintainable architecture
- Data-driven components

The homepage is the primary experience. Dedicated pages exist only for
expanded browsing.

---

# 2. Technical Constraints

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Framer Motion
- shadcn/ui
- Lucide Icons
- MDX/content collections for content
- Deploy on Vercel

## Requirements

- SEO friendly
- Server Components by default
- Client Components only when interaction requires
- Strict TypeScript
- Lazy loading
- Image optimization
- Accessible

---

# 3. Navigation

Navbar items:

- Home
- Projects
- Blog
- Hackathons
- Certifications

## Behaviour

Navbar NEVER changes route.

It smoothly scrolls to sections on the homepage.

Each homepage section contains an Explore More button.

Only Explore More navigates to:

- /projects
- /blog
- /hackathons
- /certifications

---

# 4. Homepage Information Architecture

1.  Hero
2.  Featured Projects
3.  Latest Blogs
4.  Tech Stack
5.  Certifications
6.  Competitive Programming
7.  Hackathons
8.  Education
9.  Contact
10. Footer

Every section previews content only.

---

# 5. Hero

Contains:

- Profile photo
- Name
- Role
- Bio
- CTA buttons
- Social links
- GitHub contribution graph
- Current Activity widget

## Current Activity

Preferred source: Discord + Lanyard.

Display:

- Listening to Spotify
- Coding
- Gaming
- Idle
- Offline

Gracefully fallback when unavailable.

---

# 6. Featured Projects (Hero Feature)

Desktop layout:

Left (≈65%)

Embedded YouTube player.

Only one project demo visible.

Right (≈35%)

Top three featured projects.

Each project card:

- Title
- One-line description
- GitHub
- Live Demo
- Active badge

Default selection = first project.

Selecting another project updates WITHOUT navigation:

- YouTube iframe
- Description
- Feature list
- Tech stack
- Buttons

Below player:

- Project title
- Paragraph
- Bullet features
- Technology badges
- GitHub
- Demo
- Explore More

This is the visual centerpiece.

---

# 7. Projects

## /projects

Search, filters, categories.

Cards:

- Cover
- Stack
- Short description
- Status

Click:

/projects/\[slug\]

## Detail Page

- Hero
- Video
- Screenshots
- Architecture
- Features
- Challenges
- Lessons
- Timeline
- Tech stack
- GitHub
- Demo
- Related projects

---

# 8. Blog

Homepage:

Latest 2-3 posts.

Explore More → /blog

Article page:

- TOC
- Reading time
- Tags
- Previous/Next
- Share links

---

# 9. Tech Stack

Categories:

Frontend Backend Database DevOps AI/ML Web3

Each category occupies exactly ONE row.

Never wrap.

Infinite marquee animation.

Alternate directions by row.

Hover pauses.

Badges:

Icon + Name.

Responsive by changing speed, not wrapping.

---

# 10. Certifications

Homepage preview.

Explore More.

Dedicated page.

Cards include issuer, date, credential link.

---

# 11. Competitive Programming

Cards:

LeetCode Codeforces CodeChef

Include:

Rating Solved Profile link

---

# 12. Hackathons

Homepage preview.

Gallery.

Timeline.

Dedicated page.

---

# 13. Education

Timeline with institution, degree, achievements.

---

# 14. Contact

Modern card.

Email

GitHub

LinkedIn

Twitter/X

Resume

CTA.

---

# 15. Theme

Dark default.

Light optional.

Persist in local storage.

---

# 16. Motion

Framer Motion.

Section reveal.

Project transitions.

Hover states.

Avoid excessive animation.

---

# 17. Responsive Rules

Desktop: Split layouts.

Tablet: Condensed.

Mobile: Stack vertically.

Project selector becomes horizontal scroll.

---

# 18. Data Layer

Store data in typed objects or MDX.

Suggested:

data/projects.ts data/blogs.ts data/certs.ts data/hackathons.ts

Avoid duplicated JSX.

---

# 19. Folder Structure

```text
app/
  page.tsx
  projects/
    page.tsx
    [slug]/page.tsx
  blog/
    page.tsx
    [slug]/page.tsx
  hackathons/
  certifications/

components/
  navbar/
  hero/
  projects/
  blog/
  tech/
  cp/
  education/
  contact/
  footer/

lib/
hooks/
types/
data/
public/
```

---

# 20. Performance

- Lazy iframe
- next/image
- Dynamic imports
- Minimal client JS
- Lighthouse target \>95

---

# 21. Accessibility

Keyboard navigation.

Visible focus.

ARIA labels.

Semantic HTML.

Contrast AA minimum.

---

# 22. Non-functional Requirements

- Maintainable
- Modular
- Reusable
- Typed
- Documented

---

# 23. Implementation Notes for Claude

Build reusable section components.

Never hardcode repeated markup.

Prefer data-driven rendering.

Keep homepage visually balanced.

The Featured Projects component is the primary interaction.

Navbar scrolls only.

Explore More performs routing.

The homepage should feel like a polished product landing page rather
than a résumé.
