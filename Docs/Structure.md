# Portfolio Structure Specification (Structure.md)

> **Purpose**
>
> This document is the implementation specification for the portfolio.
> Build exactly as described. Prefer reusable components, clean
> architecture, responsive design, and smooth UX.

# 1. Vision

This portfolio is **not** a resume website.

It should feel like a **developer operating system/dashboard** that
is: - Minimal - Fast - Premium - Interactive - Recruiter-friendly

The homepage is intentionally **long** and acts as the primary landing
page.

Dedicated pages exist for complete browsing, but the homepage contains
featured previews.

---

# 2. Tech Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- Framer Motion
- shadcn/ui where appropriate
- Vercel deployment

Dark and Light mode.

---

# 3. Navigation Behavior

Navbar:

- Home
- Projects
- Blog
- Hackathon
- Certifications

**IMPORTANT**

Navbar DOES NOT navigate to another page.

Each navbar item scrolls smoothly to the corresponding section on the
homepage.

Example:

Home → Hero

Projects → Featured Projects section

Blog → Blog preview section

Hackathon → Hackathon preview section

Certificates → Certificates preview section

Every preview section contains an **Explore More** button.

Only Explore More navigates to:

/projects

/blog

/hackathons

/certifications

Home therefore acts as an index.

---

# 4. Homepage Order

1 Hero 2 Featured Projects 3 Latest Blogs 4 Tech Stack 5 Certifications
6 Competitive Programming 7 Hackathons 8 Education 9 Contact 10 Footer

---

# 5. Hero Section

Contains:

Profile image

Name

Role

Short introduction

Social icons

GitHub contribution graph

Current Activity widget

Current Activity should support:

Spotify

VS Code

Gaming

Idle

Offline

If possible use Discord/Lanyard.

Gracefully fallback if unavailable.

---

# 6. Featured Projects (MOST IMPORTANT)

This is NOT a grid.

Layout:

Left: Large showcase screen.

Use embedded YouTube iframe.

Only ONE video visible.

Right:

Vertical list of Top 3 featured projects.

Each card contains:

- Name
- Short description
- GitHub button
- Demo button
- Active indicator

Default selected project = first project.

When another project card is clicked:

- iframe video changes
- description below updates
- tech stack below updates
- buttons update

NO PAGE RELOAD.

Below iframe:

Project title

Description

Feature bullets

Technology badges

GitHub

Live Demo

Explore More button

Explore More routes to /projects.

---

# 7. Projects Page

Grid/list of every project.

Selecting opens:

/projects/\[slug\]

Project detail page contains:

Hero

Video

Images

Description

Features

Architecture

Tech stack

Challenges

GitHub

Demo

Related projects

---

# 8. Blog Preview

Homepage shows latest 2-3 blogs.

Explore More → /blog

Blog page contains all articles.

Individual page:

/blog/\[slug\]

---

# 9. Tech Stack

DO NOT display wrapped badges.

Each category occupies ONE horizontal row.

Categories:

Frontend

Backend

Database

DevOps

AI/ML

Web3

Every row behaves like an infinite marquee.

Example:

React Next Tailwind Vue Angular ...

continuous loop.

Alternate directions.

Row1 left→right

Row2 right→left

Row3 left→right

etc.

Hover pauses animation.

Badges clickable.

Never wrap.

---

# 10. Certifications

Homepage preview.

Explore More.

Dedicated page.

---

# 11. Competitive Programming

Cards:

LeetCode

Codeforces

CodeChef

Stats, ratings, links.

---

# 12. Hackathons

Preview.

Gallery.

Explore More.

Dedicated page.

---

# 13. Education

Timeline/cards.

---

# 14. Contact

Modern contact panel.

Email

GitHub

LinkedIn

Twitter/X

Resume download.

---

# 15. Theme

Dark default.

Light supported.

Persist theme.

---

# 16. Animations

Smooth fade.

Section reveal.

Card hover.

Project switch transitions.

Marquee continuous.

No excessive motion.

---

# 17. Responsiveness

Desktop first.

Tablet optimized.

Mobile stacked.

Project selector becomes horizontal carousel.

---

# 18. Performance

Lazy load iframe.

Lazy load images.

Dynamic imports where appropriate.

Fast first paint.

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
sections/
data/
public/
```

---

# 20. Data

Store projects/blogs/certifications in typed local data files or MDX.

No hardcoded JSX duplication.

---

# 21. Code Principles

Reusable components.

No repeated UI.

Strict TypeScript.

Accessibility.

SEO.

---

# 22. Final Goal

The homepage should feel like an interactive dashboard while dedicated
pages provide deep documentation.

Every section previews content.

Explore More reveals the complete content.

The project showcase is the visual centerpiece of the homepage.
