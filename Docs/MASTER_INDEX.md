# MASTER_INDEX

# Portfolio v2.0 Documentation Hub

> **Purpose**
>
> This document is the entry point for the entire documentation suite.
> It explains the purpose of each document, the recommended reading
> order, how they relate to one another, and how an AI engineer (Claude
> Opus in Kiro) should use them during implementation.

---

# Documentation Philosophy

This documentation suite is designed to remove ambiguity.

Instead of asking an AI model to "build a portfolio", this project
provides a complete software specification covering:

- Product requirements
- UI/UX
- Design system
- Component architecture
- Routing
- Data architecture
- Coding conventions
- Animation
- SEO
- Accessibility
- Implementation roadmap

The goal is to make implementation deterministic rather than
interpretive.

---

# Documentation Reading Order

The recommended reading sequence is:

```text
MASTER_INDEX.md
        │
        ▼
01. PRD
        │
        ▼
02. Tech Stack
        │
        ▼
03. UI/UX Guidelines
        │
        ▼
04. Design System
        │
        ▼
05. Routing Architecture
        │
        ▼
06. Data Architecture
        │
        ▼
07. Component Specification
        │
        ▼
08. Animation Guidelines
        │
        ▼
09. Coding Standards
        │
        ▼
10. SEO & Accessibility
        │
        ▼
11. Implementation Roadmap
```

Read documents in this order before generating code.

---

# Document Index

## PRD.md

Purpose

Defines the product vision.

Contains

- Goals
- Features
- Homepage architecture
- User experience
- Functional requirements

Read first.

---

## Tech_Stack.md

Purpose

Defines every technology decision.

Contains

- Frameworks
- Libraries
- Hosting
- Tooling
- Development conventions

Use before installing dependencies.

---

## UI_UX_Guidelines.md

Purpose

Defines the user experience.

Contains

- Layout rules
- Visual hierarchy
- Responsive behaviour
- Navigation behaviour
- Interaction philosophy

Reference while building layouts.

---

## Design_System.md

Purpose

Defines reusable visual tokens.

Contains

- Typography
- Spacing
- Radius
- Colors
- Shadows
- Motion tokens
- Buttons
- Cards
- Badges

This is the visual source of truth.

---

## Routing_Architecture.md

Purpose

Defines application navigation.

Contains

- Route tree
- Scroll behaviour
- Explore More routing
- Dedicated pages
- Navigation logic

Reference before implementing routing.

---

## Data_Architecture.md

Purpose

Defines application data.

Contains

- Project model
- Blog model
- Technology model
- Certification model
- Hackathon model
- Relationships
- Folder structure

Reference before writing data files.

---

## Component_Specification.md

Purpose

Defines reusable UI components.

Contains

- Component hierarchy
- Responsibilities
- Shared components
- Homepage sections
- Dedicated page components

Reference throughout implementation.

---

## Animation_Guidelines.md

Purpose

Defines motion.

Contains

- Entrance animations
- Hover behaviour
- Timing
- Easing
- Motion rules
- Accessibility

Reference while adding Framer Motion.

---

## Coding_Standards.md

Purpose

Defines engineering conventions.

Contains

- Naming
- Folder organization
- TypeScript rules
- Git workflow
- Code quality
- Anti-patterns

Follow throughout development.

---

## SEO_Accessibility.md

Purpose

Defines discoverability and accessibility.

Contains

- Metadata
- Open Graph
- JSON-LD
- Lighthouse targets
- WCAG rules

Apply before production deployment.

---

## Implementation_Roadmap.md

Purpose

Defines build order.

Contains

- Development phases
- Milestones
- Deliverables
- Definition of Done

Use as the execution checklist.

---

# Cross Reference Matrix

Need Primary Document

---

Product vision PRD
Dependencies Tech Stack
Layout UI/UX Guidelines
Colors & Typography Design System
Components Component Specification
Routes Routing Architecture
Data Data Architecture
Motion Animation Guidelines
Code quality Coding Standards
SEO SEO & Accessibility
Build order Implementation Roadmap

---

# Recommended Implementation Workflow

Phase 1

- Read PRD
- Read Tech Stack

Phase 2

- Configure project
- Implement Design System

Phase 3

- Build shared components

Phase 4

- Build homepage sections

Phase 5

- Implement routing

Phase 6

- Build dedicated pages

Phase 7

- Add animations

Phase 8

- Optimize SEO

Phase 9

- Accessibility audit

Phase 10

- Performance optimization

Phase 11

- Final deployment

---

# Folder Structure

```text
docs/
├── MASTER_INDEX.md
├── PRD.md
├── Tech_Stack.md
├── UI_UX_Guidelines.md
├── Design_System.md
├── Routing_Architecture.md
├── Data_Architecture.md
├── Component_Specification.md
├── Animation_Guidelines.md
├── Coding_Standards.md
├── SEO_Accessibility.md
└── Implementation_Roadmap.md
```

---

# AI Implementation Instructions

For Claude Opus:

1.  Read **MASTER_INDEX.md** first.
2.  Read every document in the recommended order.
3.  Do not invent architecture that contradicts these specifications.
4.  Reuse components wherever possible.
5.  Prefer typed, data-driven implementations.
6.  Keep the homepage as the primary experience.
7.  Preserve routing and interaction behavior exactly as specified.
8.  Follow the design system rather than creating new visual patterns.
9.  If two documents overlap, the more specialized document takes
    precedence (e.g., Design System overrides generic UI wording;
    Component Specification overrides generic PRD statements).

---

# Priority Hierarchy

If conflicts occur, resolve them using this order:

1.  PRD
2.  Design System
3.  Component Specification
4.  Routing Architecture
5.  Data Architecture
6.  UI/UX Guidelines
7.  Animation Guidelines
8.  Coding Standards
9.  SEO & Accessibility
10. Tech Stack
11. Implementation Roadmap

---

# Current Documentation Status

Document Status

---

PRD ✅
Tech Stack ✅
UI/UX Guidelines ✅
Design System ✅
Routing Architecture ✅
Data Architecture ✅
Component Specification ✅
Animation Guidelines ✅
Coding Standards ✅
SEO & Accessibility ✅
Implementation Roadmap ✅

---

# Future Documentation

Recommended future additions:

- Performance_Guidelines.md
- Testing_Strategy.md
- Deployment_Guide.md
- API_Architecture.md
- Content_Management.md
- Design_Decisions_Log.md

---

# Final Objective

This documentation suite should enable a capable engineer---or an AI
coding agent---to build the portfolio with minimal ambiguity, consistent
architecture, and a cohesive user experience from the first commit
through production deployment.
