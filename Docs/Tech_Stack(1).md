# Tech Stack Specification

## Portfolio v2.0 Technology Stack

> **Purpose**
>
> This document defines every technology, library, architecture
> decision, and development convention for the portfolio. Follow this
> specification unless there is a compelling technical reason to
> deviate.

---

# 1. Core Philosophy

The stack must prioritize:

- Performance
- Developer Experience
- Scalability
- Maintainability
- Modern best practices
- Minimal dependencies
- Excellent SEO
- Great accessibility
- Free hosting
- Low operational complexity

The portfolio should be deployable entirely on **Vercel's free tier**.

---

# 2. Core Framework

## Next.js

**Version** - Latest stable (App Router)

**Reason** - Server Components - File-based routing - Image
optimization - Metadata API - Static generation - API Routes (only if
absolutely required) - Excellent Vercel integration

Use:

- App Router
- Server Components by default
- Client Components only for interactive UI

---

# 3. Language

## TypeScript

Configuration:

- strict = true
- noImplicitAny
- noUncheckedIndexedAccess
- exactOptionalPropertyTypes

Avoid JavaScript entirely.

---

# 4. Styling

## Tailwind CSS

Purpose:

- Utility-first styling
- Responsive layouts
- Design consistency

Guidelines:

- No inline CSS
- No CSS Modules unless necessary
- Keep utility classes readable
- Extract repeated UI into reusable components

---

# 5. UI Components

## shadcn/ui

Use for:

- Dialog
- Tooltip
- Popover
- Accordion
- Dropdown
- Sheet
- Command Palette
- Toast

Customize to match portfolio branding.

---

# 6. Icons

## Lucide React

Primary icon library.

Use for:

- Navigation
- Social icons
- Contact
- Buttons
- Status indicators

Avoid mixing multiple icon libraries.

---

# 7. Animation

## Framer Motion

Use for:

- Section reveal
- Scroll animations
- Hover interactions
- Project switching
- Page transitions
- Mobile menu animation

Rules:

- Keep animations subtle
- 60 FPS
- Respect prefers-reduced-motion

---

# 8. Theme System

Use:

next-themes

Requirements:

- Dark mode
- Light mode
- Persist user preference
- System theme support
- No flash of incorrect theme

---

# 9. Typography

Suggested:

Primary: - Geist

Fallback: - Inter

Use Next.js font optimization.

---

# 10. Images

Use:

next/image

Requirements:

- Lazy loading
- Responsive sizes
- Blur placeholder where applicable
- Optimized formats

---

# 11. Video

Project demos:

Use YouTube iframe embeds.

Requirements:

- Lazy load iframe
- Replace iframe source when project changes
- No page reload

---

# 12. Current Activity

Preferred stack:

Discord Rich Presence + Lanyard API

Display:

- Spotify
- Coding
- Gaming
- Idle
- Offline

Gracefully fallback if unavailable.

---

# 13. GitHub

Display:

- Contribution graph
- GitHub profile link
- Repository links

Optional:

GitHub REST API for dynamic statistics.

---

# 14. Data Management

Preferred:

Typed local data files.

Example:

```text
data/
  projects.ts
  blogs.ts
  certifications.ts
  hackathons.ts
  education.ts
```

Content-heavy pages may use MDX.

Avoid databases unless absolutely required.

---

# 15. State Management

Default:

React State

Use:

- useState
- useReducer
- Context only when necessary

Avoid Redux or Zustand unless future complexity requires them.

---

# 16. Forms

Use:

React Hook Form

Validation:

Zod

---

# 17. SEO

Use Next Metadata API.

Every page should include:

- title
- description
- Open Graph
- Twitter Card
- Canonical URL

Generate sitemap and robots.txt.

---

# 18. Performance

Goals:

- Lighthouse 95+
- LCP under 2.5s
- CLS below 0.1

Strategies:

- Static generation
- Code splitting
- Dynamic imports
- Lazy images
- Lazy iframes
- Minimize client components

---

# 19. Accessibility

Follow WCAG AA.

Requirements:

- Keyboard navigation
- Focus rings
- ARIA labels
- Semantic HTML
- Screen reader friendly

---

# 20. Folder Structure

```text
app/
components/
sections/
hooks/
lib/
types/
data/
public/
styles/
```

---

# 21. Development Tools

Package Manager: - pnpm (preferred)

Linting: - ESLint

Formatting: - Prettier

Git Hooks: - Husky (optional)

Commit Convention: - Conventional Commits

---

# 22. Deployment

Platform:

Vercel

Requirements:

- Automatic preview deployments
- Production deployment
- Environment variables (only if needed)

---

# 23. Future Integrations

Potential additions:

- Analytics (Plausible/Umami)
- Email service
- CMS
- API routes
- AI chatbot
- Guestbook
- View counter

Must not impact current architecture.

---

# 24. Technology Summary

Category Technology

---

Framework Next.js
Language TypeScript
Styling Tailwind CSS
Components shadcn/ui
Icons Lucide React
Animation Framer Motion
Theme next-themes
Forms React Hook Form
Validation Zod
Images next/image
Content MDX / Typed Data
Hosting Vercel
Package Manager pnpm
Linting ESLint
Formatting Prettier

---

# 25. Final Principle

Prefer simplicity over cleverness.

Every dependency must have a clear purpose.

The portfolio should remain lightweight, modular, maintainable, and easy
to extend over time.
