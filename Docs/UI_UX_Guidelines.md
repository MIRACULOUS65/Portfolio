# UI / UX Guidelines

## Portfolio v2.0

> Purpose: This document defines the visual language, user experience
> principles, interaction patterns, responsive behavior, and design
> rules for the entire portfolio. Any implementation should follow these
> guidelines to maintain consistency.

---

# 1. Design Philosophy

The portfolio should feel like a premium developer product rather than a
résumé.

Keywords:

- Minimal
- Elegant
- Intentional
- Modern
- Calm
- Fast
- Content-first

Avoid visual clutter.

Every element must have a purpose.

---

# 2. User Goals

## Recruiters

Should immediately understand:

- Who you are
- What you build
- Your strongest projects
- How to contact you

Target time: under 30 seconds.

## Developers

Should be able to explore projects in depth.

## General Visitors

Should enjoy the interactions without needing instructions.

---

# 3. Visual Hierarchy

Priority:

1.  Hero
2.  Featured Projects
3.  Latest Blogs
4.  Tech Stack
5.  Certifications
6.  Competitive Programming
7.  Hackathons
8.  Education
9.  Contact

Every section must clearly stand apart while maintaining visual
continuity.

---

# 4. Layout System

Use a centered container.

Maximum content width: 1280--1440px.

Generous whitespace.

Consistent vertical rhythm.

Suggested spacing:

- Section padding: 96--128px
- Component gap: 24--32px
- Card padding: 20--28px

---

# 5. Navigation

Sticky navbar.

Background blur after scrolling.

Smooth scrolling only.

Navbar links scroll to homepage sections.

Never navigate away from homepage.

Only "Explore More" buttons perform routing.

Active section should be highlighted.

Mobile:

- Drawer menu
- Large tap targets
- Auto close after navigation

---

# 6. Hero Experience

First screen must answer:

- Who am I?
- What do I build?
- Why should someone continue scrolling?

Include:

- Professional profile photo
- Name
- Role
- Short bio
- CTA buttons
- Social links
- GitHub contribution graph
- Current Activity widget

The hero should fit comfortably within the first viewport on desktop.

---

# 7. Featured Projects

This is the visual centerpiece.

Desktop layout:

Left: Large embedded YouTube player.

Right: Three featured project cards.

Interaction:

- First project selected by default.
- Clicking another card updates the video and details without
  navigation.
- Animate transitions smoothly.
- Maintain scroll position.

Below the video:

- Project title
- Description
- Feature list
- Tech stack badges
- GitHub button
- Live demo button
- Explore More button

---

# 8. Blog Preview

Show only the newest 2--3 articles.

Cards should prioritize readability.

Include:

- Cover image
- Title
- Reading time
- Published date
- Short excerpt

Explore More opens the full blog page.

---

# 9. Tech Stack Marquee

Categories:

Frontend

Backend

Database

DevOps

AI/ML

Web3

Each category uses exactly one horizontal marquee.

Rules:

- Never wrap
- Infinite loop
- Alternate direction between rows
- Pause on hover
- Consistent speed
- Equal spacing between badges

Badges:

- Icon
- Name
- Rounded corners
- Hover elevation

---

# 10. Cards

All cards should share:

- Same corner radius
- Same shadow scale
- Same hover animation
- Same transition duration

Hover:

- Slight lift
- Slight border emphasis
- Smooth shadow increase

Avoid dramatic scaling.

---

# 11. Buttons

Primary:

Filled.

Secondary:

Outline.

Ghost:

Minimal.

Every button must include visible hover and keyboard focus states.

---

# 12. Typography

Hierarchy:

H1

H2

H3

Body

Caption

Code

Readable line length.

Never use oversized paragraphs.

---

# 13. Color Usage

Support:

Dark mode

Light mode

Accent color used sparingly.

Status colors:

Success

Warning

Error

Info

Maintain WCAG AA contrast.

---

# 14. Motion Principles

Animations should communicate state, never distract.

Use:

- Fade
- Slide
- Scale
- Opacity
- Blur (sparingly)

Avoid:

- Bounce
- Excessive rotation
- Long animations

Recommended duration:

150--300ms.

---

# 15. Scroll Experience

Every section should reveal naturally.

Maintain consistent spacing.

Scrolling should feel uninterrupted.

Avoid scroll jacking.

---

# 16. Responsive Behavior

Desktop:

Multi-column layouts.

Tablet:

Reduce spacing.

Collapse grids where appropriate.

Mobile:

Single-column.

Featured projects:

Video

↓

Horizontal selector

↓

Details

↓

Buttons

---

# 17. Empty & Loading States

Every dynamic section should have:

- Loading skeleton
- Empty message
- Error fallback

Never leave blank areas.

---

# 18. Accessibility

Keyboard navigation.

Visible focus indicators.

Semantic HTML.

Descriptive labels.

Reduced motion support.

Touch targets ≥44px.

---

# 19. Microinteractions

Hover:

Cards

Buttons

Badges

Links

Project selector

Theme toggle

All interactions should provide subtle feedback.

---

# 20. Performance UX

Lazy load:

- Images
- YouTube iframe
- Heavy components

Prevent layout shift.

Keep interactions responsive.

---

# 21. Consistency Rules

Every section should:

- Begin with a title
- Include a concise description if helpful
- Maintain identical spacing
- Use shared component patterns
- Follow the same animation language

Do not introduce unique visual styles for individual sections.

---

# 22. Success Criteria

A visitor should be able to:

1.  Understand who you are within seconds.
2.  Watch project demos without leaving the homepage.
3.  Navigate smoothly to any section.
4.  Explore dedicated pages only when interested.
5.  Experience consistent visuals on every screen size.
6.  Leave with the impression of a polished, thoughtfully engineered
    product.

The interface should feel refined, calm, and intentional from the first
interaction to the footer.
