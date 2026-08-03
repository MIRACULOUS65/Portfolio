# SEO & Accessibility Specification

## Portfolio v2.0

> **Purpose**
>
> This document defines the Search Engine Optimization (SEO) and
> Accessibility (A11y) standards for the portfolio. Every page,
> component, and interaction must comply with these requirements to
> maximize discoverability, usability, and inclusivity.

---

# 1. Objectives

## SEO Goals

- Lighthouse SEO ≥ 95
- Fast indexing
- Rich social previews
- Semantic structure
- Strong Core Web Vitals

## Accessibility Goals

- Lighthouse Accessibility ≥ 95
- WCAG 2.2 AA compliance
- Full keyboard navigation
- Screen reader compatibility
- Reduced motion support

---

# 2. Metadata Strategy

Every route must define metadata using the Next.js Metadata API.

Required fields:

- title
- description
- keywords
- authors
- creator
- robots
- alternates
- openGraph
- twitter

Titles should be unique.

Descriptions should be 140--160 characters.

Never duplicate metadata between pages.

---

# 3. Route Metadata

## Homepage

Focus:

- Name
- Role
- Portfolio
- Full Stack Developer

## Project Page

Use project-specific metadata:

- Project title
- Technologies
- Description
- Hero image

## Blog Page

Use article-specific metadata.

Include publish date.

## Certification & Hackathon Pages

Unique metadata for each page.

---

# 4. Open Graph

Every page should include:

- og:title
- og:description
- og:image
- og:url
- og:type

Use high-quality preview images (1200×630).

---

# 5. Twitter Cards

Use:

summary_large_image

Include:

- title
- description
- image

---

# 6. Canonical URLs

Every page must define a canonical URL.

Avoid duplicate indexing.

---

# 7. Robots & Sitemap

Generate:

robots.txt

sitemap.xml

Automatically include:

- Homepage
- Projects
- Blog
- Certifications
- Hackathons

Exclude draft content.

---

# 8. Structured Data

Use JSON-LD where appropriate.

Homepage:

- Person

Projects:

- CreativeWork or SoftwareSourceCode

Blog:

- BlogPosting

Breadcrumbs:

- BreadcrumbList

---

# 9. Semantic HTML

Use proper elements:

```{=html}
<header>
```

```{=html}
<nav>
```

```{=html}
<main>
```

```{=html}
<section>
```

```{=html}
<article>
```

```{=html}
<aside>
```

```{=html}
<footer>
```

Avoid generic divs where semantic tags apply.

One H1 per page.

Maintain heading hierarchy.

---

# 10. Images

Every image must include:

- alt text
- width
- height

Decorative images:

alt=""

Use next/image.

---

# 11. Links

External links:

- target="\_blank"
- rel="noopener noreferrer"

Buttons should not masquerade as links.

Links should have descriptive text.

Avoid "Click here".

---

# 12. Keyboard Accessibility

Everything interactive must support:

- Tab
- Shift+Tab
- Enter
- Space
- Escape (dialogs)
- Arrow keys where appropriate

Visible focus indicators are mandatory.

---

# 13. Screen Readers

Every interactive element requires:

- Accessible name
- ARIA labels where needed
- Proper role only when semantic HTML is insufficient

Never rely solely on icons.

---

# 14. Color & Contrast

Meet WCAG AA.

Minimum contrast:

- Normal text: 4.5:1
- Large text: 3:1

Never convey meaning through color alone.

---

# 15. Motion Accessibility

Respect:

prefers-reduced-motion

Disable or simplify:

- Marquee speed
- Reveal animations
- Transitions

Ensure usability without animation.

---

# 16. Forms

Future contact forms must include:

- Labels
- Helper text
- Error messages
- Required indicators
- Validation feedback

Errors must be announced to screen readers.

---

# 17. Loading States

Use:

- Skeletons
- aria-busy
- Meaningful loading text

Never display infinite spinners without context.

---

# 18. Error States

404:

Friendly message

Navigation back home

Project not found:

Explain the issue

Provide related projects

Never expose raw errors.

---

# 19. Performance & SEO

Optimize:

- next/image
- Font loading
- Lazy YouTube iframe
- Dynamic imports
- Static generation where possible

Target Core Web Vitals:

- LCP \< 2.5s
- CLS \< 0.1
- INP \< 200ms

---

# 20. Accessibility Checklist

Every page must satisfy:

- One H1
- Logical heading order
- Keyboard navigation
- Visible focus
- Alt text
- Semantic HTML
- Accessible forms
- Reduced motion support
- Sufficient contrast
- Descriptive links

---

# 21. SEO Checklist

Every page must include:

- Unique title
- Unique description
- Canonical URL
- Open Graph
- Twitter Card
- JSON-LD (when applicable)
- Sitemap entry
- Proper heading hierarchy

---

# 22. Testing Tools

Validate with:

- Lighthouse
- axe DevTools
- WAVE
- NVDA or VoiceOver
- Google Rich Results Test
- PageSpeed Insights

Fix all Critical and Serious issues before release.

---

# 23. Acceptance Criteria

The project is complete when:

- Lighthouse SEO ≥95
- Lighthouse Accessibility ≥95
- WCAG AA requirements are met
- Pages are fully indexable
- Social previews render correctly
- Keyboard-only users can use the site
- Screen readers announce meaningful content
- Core Web Vitals meet Google's recommended thresholds
