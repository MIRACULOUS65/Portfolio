# Design System

## Portfolio v2.0

> **Purpose**
>
> This document is the single source of truth for the visual language of
> the portfolio. Every component, page, and interaction must follow
> these design tokens and guidelines to ensure a consistent, scalable,
> and maintainable user experience.

---

# 1. Design Philosophy

The interface should feel like a modern developer product inspired by
products such as Vercel, Linear and GitHub.

Core attributes:

- Minimal
- Elegant
- Functional
- Content-first
- Premium
- Fast
- Calm

Every visual decision should support usability before decoration.

---

# 2. Design Principles

- Consistency over creativity
- Predictability over surprise
- White space is a feature
- Motion communicates state
- Typography carries hierarchy
- Color emphasizes, not decorates
- Every component should feel like part of one system

---

# 3. Grid System

Container:

- Max Width: 1280px (recommended)
- Large Desktop: 1440px
- Auto centered

Responsive breakpoints:

- Mobile: \<640px
- Small Tablet: 640--767px
- Tablet: 768--1023px
- Laptop: 1024--1279px
- Desktop: 1280--1535px
- Large Desktop: ≥1536px

---

# 4. Spacing System

Use an 8px base grid.

Token Scale:

- 4px
- 8px
- 12px
- 16px
- 24px
- 32px
- 48px
- 64px
- 80px
- 96px
- 128px

Section spacing:

96--128px vertical.

Component spacing:

24--32px.

Card padding:

20--28px.

---

# 5. Typography

Primary Font:

Geist

Fallback:

Inter

Monospace:

Geist Mono / JetBrains Mono

Hierarchy:

H1 48--64px

H2 36--48px

H3 28--32px

H4 24px

Body 16--18px

Small 14px

Caption 12px

Code 14--15px

Rules:

- Line height 1.5--1.7 for body.
- Avoid paragraphs wider than \~75 characters.
- One H1 per page.

---

# 6. Color System

Support:

- Dark Theme
- Light Theme

Semantic colors:

Primary

Secondary

Accent

Success

Warning

Error

Info

Muted

Surface

Border

Focus Ring

All colors should be implemented as CSS variables.

Avoid hardcoded hex values in components.

---

# 7. Theme Tokens

Suggested variables:

```text
--background
--foreground
--card
--card-foreground
--muted
--muted-foreground
--border
--primary
--secondary
--accent
--ring
--shadow
```

Theme switching should update variables only.

---

# 8. Elevation

Levels:

Level 0: Flat

Level 1: Cards

Level 2: Hover

Level 3: Dialogs

Increase shadow gradually.

Avoid heavy shadows.

---

# 9. Border Radius

Small: 6px

Medium: 10px

Large: 16px

Pill: 9999px

Maintain consistent radius across components.

---

# 10. Buttons

Variants:

- Primary
- Secondary
- Outline
- Ghost
- Link

States:

Default

Hover

Pressed

Focused

Disabled

Loading

Transitions:

150--200ms.

---

# 11. Cards

Used for:

Projects

Blogs

Certifications

Hackathons

Common anatomy:

- Header
- Content
- Footer (optional)

Hover:

- Slight lift
- Border emphasis
- Shadow increase

---

# 12. Badges

Technology badges:

Icon + Label

Rounded.

Consistent height.

Hover:

Small elevation only.

---

# 13. Icons

Primary library:

Lucide React

Sizes:

16px

20px

24px

32px

Use consistent stroke widths.

---

# 14. Motion System

Library:

Framer Motion

Timing:

Fast: 150ms

Normal: 250ms

Slow: 350ms

Easing:

Ease Out for entrances.

Ease In Out for interactions.

Animations:

Fade

Slide

Opacity

Scale

Avoid:

Bounce

Flash

Long rotations

---

# 15. Section Layout

Every homepage section contains:

- Heading
- Optional description
- Primary content
- Explore More button (where applicable)

Maintain identical vertical rhythm.

---

# 16. Featured Projects Design

Desktop:

65% video showcase

35% project selector

Project details below player.

First project selected by default.

Smooth animated transitions.

---

# 17. Tech Stack Marquee

Six independent rows.

Alternate directions.

Infinite loop.

Pause on hover.

Equal badge spacing.

Never wrap.

---

# 18. Forms

Future-proof tokens:

Input

Textarea

Select

Checkbox

Switch

Error

Success

Disabled

Focus

---

# 19. Focus States

Every interactive component must show:

- Visible outline
- Focus ring
- Keyboard-friendly indication

Never remove focus styles.

---

# 20. Z-Index Scale

Suggested:

0 Base

10 Cards

20 Sticky Navbar

30 Dropdowns

40 Drawers

50 Dialogs

100 Toasts

Avoid arbitrary z-index values.

---

# 21. Responsive Rules

Desktop:

Multi-column.

Tablet:

Reduced spacing.

Mobile:

Single column.

Touch targets ≥44px.

---

# 22. Loading Patterns

Skeletons preferred.

Reserve layout space to prevent CLS.

Lazy-load heavy assets.

---

# 23. Component Consistency

All reusable components must share:

- Typography
- Radius
- Shadow
- Hover language
- Focus behavior
- Transition timing

---

# 24. Design Tokens

Centralize all tokens in Tailwind configuration and CSS variables.

Never duplicate values across components.

---

# 25. Acceptance Criteria

The design system is successful when:

- Every page feels visually cohesive.
- Components are interchangeable without redesign.
- Dark and light themes require no component changes.
- Designers and developers reference one source of truth.
- Future features can reuse existing tokens without introducing
  inconsistencies.
