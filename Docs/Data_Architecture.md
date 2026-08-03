# Data Architecture

## Portfolio v2.0

> **Purpose**
>
> This document defines the complete data architecture for the
> portfolio. All content should be data-driven and separated from UI
> components. Components should never hardcode portfolio content.

---

# 1. Data Philosophy

Goals:

- Single source of truth
- Strict typing
- Easy to maintain
- Easy to extend
- Reusable across pages
- SEO-friendly

Rules:

- No duplicated data
- No hardcoded JSX
- Keep UI independent of content
- Prefer static typed data over databases for v1

---

# 2. Folder Structure

```text
data/
├── profile.ts
├── navigation.ts
├── socials.ts
├── projects.ts
├── featured-projects.ts
├── blogs.ts
├── certifications.ts
├── hackathons.ts
├── education.ts
├── competitive-programming.ts
├── technologies.ts
├── experience.ts (future)
├── timeline.ts (future)
└── site.ts
```

---

# 3. Shared Types

Every model must include a unique identifier.

Example:

```ts
id: string
createdAt?: string
updatedAt?: string
```

Avoid numeric IDs.

Use slugs for routing.

---

# 4. Site Configuration

Stores global application metadata.

Fields:

- Site name
- Tagline
- Description
- Domain
- Default SEO
- Theme defaults
- Analytics configuration
- Social preview image

---

# 5. Navigation Model

Fields:

- id
- label
- href
- sectionId
- order
- visible

Behavior:

Navbar renders dynamically from this dataset.

---

# 6. Profile Model

Stores personal information.

Fields:

- name
- role
- bio
- avatar
- location
- resume
- email
- availability
- currentCompany (optional)
- yearsExperience (optional)

---

# 7. Social Model

Fields:

- id
- platform
- username
- url
- icon
- visible

Platforms:

GitHub

LinkedIn

X

Email

Discord

Portfolio

---

# 8. Project Model (Core Entity)

Every project should contain:

General

- id
- slug
- title
- shortDescription
- description
- category
- status

Media

- thumbnail
- heroImage
- gallery\[\]
- youtubeVideoId

Links

- github
- liveDemo
- documentation

Dates

- startDate
- completionDate

Metadata

- featured
- pinned
- archived

Technology

- technologies\[\]

Content

- features\[\]
- challenges\[\]
- learnings\[\]
- architecture\[\]
- screenshots\[\]

SEO

- metaTitle
- metaDescription

Related

- relatedProjects\[\]

Future

- downloads\[\]
- changelog\[\]

---

# 9. Featured Projects

Contains references to three project IDs.

Rules:

- Order controls homepage display.
- First project selected by default.
- No duplicated project data.

---

# 10. Blog Model

Fields:

- id
- slug
- title
- excerpt
- coverImage
- content
- publishedDate
- readingTime
- author
- tags\[\]
- featured
- draft
- seo

Recommended:

MDX content with frontmatter.

---

# 11. Certification Model

Fields:

- id
- title
- issuer
- issueDate
- expirationDate
- credentialId
- credentialUrl
- badgeImage
- technologies\[\]
- featured

---

# 12. Hackathon Model

Fields:

- id
- slug
- name
- organizer
- description
- date
- location
- achievement
- teamMembers\[\]
- technologies\[\]
- images\[\]
- demo
- github

---

# 13. Education Model

Fields:

- id
- institution
- degree
- specialization
- startDate
- endDate
- grade
- achievements\[\]
- coursework\[\]
- logo

---

# 14. Competitive Programming Model

Platform object:

- id
- platform
- username
- profileUrl
- rating
- solved
- rank
- badges\[\]
- logo

Platforms:

LeetCode

Codeforces

CodeChef

---

# 15. Technology Model

Each technology:

- id
- name
- category
- icon
- website
- color (optional)
- proficiency (optional)

Categories:

- Frontend
- Backend
- Database
- DevOps
- AI/ML
- Web3

Homepage marquee should render directly from this data.

---

# 16. Current Activity Model

Fields:

- source
- status
- title
- subtitle
- icon
- image
- updatedAt

Possible states:

- Listening
- Coding
- Gaming
- Idle
- Offline

---

# 17. Relationships

```text
Projects
   │
   ├── Technologies
   ├── Related Projects
   ├── GitHub
   └── Demo

Blog
   ├── Tags
   └── Author

Hackathon
   ├── Technologies
   └── Team Members

Certification
   └── Technologies
```

---

# 18. Data Flow

```text
Typed Data Files
        │
        ▼
Server Component
        │
        ▼
Section Component
        │
        ▼
Reusable UI Components
        │
        ▼
Rendered UI
```

No component should own permanent content.

---

# 19. Future Data Sources

Architecture should support:

- MDX
- Content Collections
- Headless CMS
- GitHub API
- Discord/Lanyard API
- RSS feeds
- REST APIs

without changing UI components.

---

# 20. Validation

Recommended:

- TypeScript interfaces
- Zod schemas
- Build-time validation

Prevent missing fields before deployment.

---

# 21. Naming Conventions

Files:

kebab-case

Interfaces:

PascalCase

Fields:

camelCase

Enums:

PascalCase

Slugs:

lowercase-with-hyphens

---

# 22. Acceptance Criteria

- All content originates from typed data.
- UI contains no duplicated portfolio information.
- Homepage and dedicated pages consume the same datasets.
- Featured projects reference project IDs rather than duplicate
  objects.
- Data models are extensible without breaking components.
- Every entity supports future SEO metadata and expansion.
