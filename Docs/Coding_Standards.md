# Coding Standards

## Portfolio v2.0

> **Purpose**
>
> This document defines the coding conventions, architecture rules,
> naming standards, development workflow, and quality expectations for
> the portfolio. Every contribution should follow these standards to
> ensure the codebase remains clean, scalable, and maintainable.

---

# 1. Core Principles

- Readability over cleverness
- Simplicity over unnecessary abstraction
- Composition over inheritance
- Reusability over duplication
- Type safety everywhere
- Accessibility by default
- Performance first
- Consistency across the codebase

---

# 2. General Rules

- Use TypeScript only.
- Enable `strict` mode.
- Never use `any` unless absolutely unavoidable.
- Prefer immutable patterns.
- Keep functions small and focused.
- Delete dead code immediately.
- Do not leave commented-out code in commits.

---

# 3. Project Structure

```text
app/
components/
sections/
hooks/
lib/
types/
data/
utils/
styles/
public/
```

Feature-related code should stay close together. Shared logic belongs in
`lib`, `hooks`, or `utils`.

---

# 4. Naming Conventions

## Files

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Data files: `kebab-case.ts`
- Types: `types.ts` or feature-specific type files

## Variables

- `camelCase`
- Use descriptive names.

Avoid:

- data
- temp
- obj
- value

Prefer:

- featuredProjects
- currentProject
- visibleBlogs

---

# 5. Components

Guidelines:

- One responsibility per component.
- Extract reusable UI early.
- Keep JSX shallow.
- Avoid prop drilling where Context is appropriate.

Each component should define:

- Purpose
- Props
- Internal state
- Events
- Accessibility considerations

---

# 6. Props & Types

Always define interfaces.

Example:

```ts
interface ProjectCardProps {
  project: Project;
  selected: boolean;
  onSelect: (id: string) => void;
}
```

Avoid inline object types for exported APIs.

---

# 7. State Management

Prefer:

1.  useState
2.  useReducer
3.  Context (only when shared state is required)

Do not introduce external state libraries without a clear need.

---

# 8. Hooks

Custom hooks must:

- Start with `use`
- Contain reusable logic only
- Avoid UI rendering
- Return typed values

Examples:

- useActiveSection
- useTheme
- useCurrentActivity

---

# 9. Styling

- Tailwind CSS only.
- Avoid inline styles.
- Use reusable utility patterns.
- Keep class lists readable.
- Extract repeated styles into components or utility functions.

---

# 10. Server vs Client Components

Server Components by default.

Use Client Components only for:

- State
- Effects
- Event handlers
- Browser APIs
- Animations

Minimize client-side JavaScript.

---

# 11. Data Fetching

Prefer:

- Static imports
- Server Components
- Build-time generation

Client fetching only for live activity or other dynamic data.

---

# 12. Error Handling

Never silently ignore errors.

Provide:

- Fallback UI
- Helpful logging (development)
- Friendly user-facing messages

---

# 13. Accessibility

Every interactive element must support:

- Keyboard navigation
- Visible focus
- Screen readers
- Semantic HTML

Accessibility is a requirement, not an enhancement.

---

# 14. Performance

- Lazy load heavy components.
- Use `next/image`.
- Lazy load YouTube iframes.
- Memoize expensive computations when beneficial.
- Avoid unnecessary re-renders.

---

# 15. Imports

Recommended order:

1.  React / Next
2.  Third-party libraries
3.  Internal aliases
4.  Relative imports
5.  Styles

Group imports logically with a blank line between groups.

---

# 16. Comments

Comment **why**, not **what**.

Avoid obvious comments.

Use JSDoc for reusable utilities, hooks, and exported functions where
helpful.

---

# 17. Git Workflow

Branch names:

```text
feature/navbar
feature/projects
fix/theme-toggle
refactor/project-card
docs/prd
```

Commit format:

```text
feat: add featured project selector
fix: correct marquee overflow
refactor: extract project details component
docs: update routing architecture
style: improve button spacing
```

---

# 18. Linting & Formatting

Use:

- ESLint
- Prettier

Code should pass linting before every commit.

Do not disable lint rules without documenting the reason.

---

# 19. Testing Checklist

Before merging:

- Builds successfully
- No TypeScript errors
- No ESLint errors
- Responsive on desktop/tablet/mobile
- Theme works
- Keyboard navigation verified
- Lighthouse targets maintained

---

# 20. Pull Request Checklist

- Purpose explained
- Screenshots (if UI changes)
- No duplicated logic
- Types updated
- Documentation updated when necessary
- Self-reviewed

---

# 21. Anti-Patterns

Avoid:

- Massive components (\>300--400 lines without justification)
- Deeply nested JSX
- Magic strings
- Hardcoded content
- Duplicate layouts
- Global mutable state
- Excessive `useEffect`
- Unused dependencies

---

# 22. Definition of Done

A feature is complete only when:

- Code is typed
- Lint passes
- Responsive behavior verified
- Accessibility considered
- Animations polished
- Performance unaffected
- Documentation updated (if architecture changed)

---

# 23. Final Engineering Philosophy

Write code that another developer can understand quickly.

Optimize for long-term maintainability rather than short-term speed.

The portfolio should feel like a production-ready application with a
codebase that is modular, predictable, and enjoyable to work on.
