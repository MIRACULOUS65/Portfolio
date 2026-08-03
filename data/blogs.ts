/**
 * Blog dataset.
 *
 * Requirement 4.1 — all portfolio content originates from typed local data
 * files under `data/`; Requirement 4.6 — every entry conforms to the `Blog`
 * model (id, slug, title, excerpt, coverImage, content, publishedDate,
 * readingTime, author, tags, featured, draft, seo).
 *
 * Conventions used by every `data/*.ts` module:
 * - one named export per module (`export const blogs: Blog[]`), never default
 * - ids and slugs are stable kebab-case strings; slugs are unique because they
 *   are the `/blog/[slug]` URL segment
 * - dates are `"YYYY-MM-DD"` strings (`ISODateString`) so the data stays
 *   JSON-serializable across the Server/Client Component boundary
 * - types are imported from the `@/types` barrel
 *
 * Fixture shape (deliberate, downstream selectors depend on it):
 * - six published posts, so `getRecentPublishedBlogs(2, 3)` has a real "3+"
 *   case and `/blog` has enough content to filter (Requirements 10.4, 20.2)
 * - one `draft: true` post whose `publishedDate` is the newest of the whole
 *   set, so any selector that forgets to filter drafts changes the observable
 *   ordering instead of failing silently (Requirements 10.1, 20.2)
 * - the draft's slug is a well-formed, valid-looking slug that simply is not
 *   published, which is what lets the article route distinguish "draft" from
 *   "missing" while returning the same not-found result for both
 * - all `publishedDate` values are distinct, so recency ordering (and therefore
 *   positional prev/next navigation) is total and unambiguous
 * - tags are drawn from a small shared vocabulary and overlap across posts, so
 *   the `/blog` category filter has multi-post categories to select
 *
 * `coverImage` paths point into `public/images/blog/`, which is currently empty;
 * the referenced files land with the real content pass.
 */

import type { Blog } from "@/types";

/**
 * Author display name for sample content. Replace with the Profile name when
 * real posts land; kept as a single constant so that is a one-line change.
 */
const AUTHOR = "Portfolio Author";

export const blogs: Blog[] = [
  {
    id: "edge-runtime-experiments",
    slug: "edge-runtime-experiments",
    title: "Experiments With the Edge Runtime",
    excerpt:
      "Notes-in-progress on moving parts of a Next.js app to the edge, and the constraints that come with it.",
    coverImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    content: `Draft notes. Numbers here are from a single machine and are not
trustworthy yet.

## Why the edge at all

Latency is the only reason worth the trouble. Everything else about the edge
runtime is a downgrade from Node.

## What breaks

### Missing Node built-ins

Anything reaching for the filesystem or native crypto has to go.

### Cold start behaviour

Small bundles matter far more than they do on Node, which changes how you think
about dependencies.

## Where this is going

Next up: measuring against a plain Node deployment on the same routes before
drawing any conclusions.`,
    publishedDate: "2026-01-05",
    readingTime: 5,
    author: AUTHOR,
    tags: ["Next.js", "Performance"],
    featured: false,
    draft: true,
  },
  {
    id: "server-components-data-flow",
    slug: "server-components-data-flow",
    title: "Data Flow in a Server-First React App",
    excerpt:
      "How to keep a Next.js App Router project mostly server-rendered, and where a Client Component actually earns its place.",
    coverImage:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
    content: `Server Components changed the default answer to "where does this
data come from?" The answer is now "the server, unless you can prove otherwise."

## The default: render on the server

A Server Component reads from the data layer directly. There is no fetch
waterfall, no loading state, and no serialized cache shipped to the browser.

### What crosses the boundary

Only props, and only serializable ones. That single rule is why dates in this
project are stored as strings rather than \`Date\` instances.

## When a Client Component is justified

Three cases, in practice:

### Browser-only APIs

Intersection observers, media queries, and local storage have no server
equivalent.

### User interaction state

Selection, open/closed, and typed input all live in the browser by definition.

### Third-party client libraries

Anything that touches the DOM on mount.

## Keeping the boundary small

Push the client boundary as far down the tree as it will go. A single
interactive control should not force its whole page to hydrate.

## Takeaway

Treat every \`"use client"\` as a cost you agreed to pay, and the architecture
stays legible.`,
    publishedDate: "2025-11-18",
    readingTime: 9,
    author: AUTHOR,
    tags: ["Next.js", "React", "Architecture"],
    featured: true,
    draft: false,
    seo: {
      metaTitle: "Data Flow in a Server-First React App",
      metaDescription:
        "A practical guide to Server Component data flow in the Next.js App Router, and how to keep client boundaries small.",
    },
  },
  {
    id: "type-safe-data-layer",
    slug: "type-safe-data-layer",
    title: "A Type-Safe Data Layer Without a Database",
    excerpt:
      "Typed local data files plus a thin selector module get you most of the benefits of a CMS with none of the operational cost.",
    coverImage:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
    content: `A portfolio does not need a database. It needs a single source of
truth that the compiler can check.

## The shape of the thing

Two layers, and no more: entity types, then data modules that satisfy them.

### Types first

Declaring the entity types before the data means the data files are checked
against a contract rather than defining one by accident.

### Data modules second

One module per entity, one named export each. No default exports, so every
import site names what it pulled in.

## Selectors are the only public API

Components never import data modules directly. They call selectors, which own
filtering, sorting, and reference resolution.

### References, not copies

An id reference between entities is cheap to keep correct. A duplicated object
is not.

## What you give up

Non-technical editing. That is the trade, and for a personal site it is a good
one.

## Takeaway

Static typed data scales further than people expect. Reach for a CMS when a
second author appears, not before.`,
    publishedDate: "2025-10-02",
    readingTime: 7,
    author: AUTHOR,
    tags: ["TypeScript", "Architecture"],
    featured: true,
    draft: false,
  },
  {
    id: "property-based-testing-react",
    slug: "property-based-testing-react",
    title: "Property-Based Testing for UI Logic",
    excerpt:
      "Example-based tests check the cases you thought of. Property tests check the ones you did not.",
    coverImage:
      "https://images.unsplash.com/photo-1550439062-609e1531270e?w=1200&q=80",
    content: `Most UI bugs are not in the markup. They are in the small pure
functions that decide what the markup should be.

## Extract the decision, then test it

A reducer, a sort comparator, or a "which section is active" resolver can all be
tested without rendering anything.

### Writing a useful generator

A generator that produces mostly invalid input finds nothing. Constrain it to
the real input space and let it explore inside those bounds.

### Reading a counterexample

The shrunk case is the whole value of the technique. It is usually small enough
to paste straight into a unit test.

## Properties that pay off

### Invariants

Something that must always hold: exactly one active item, no duplicate ids.

### Round-trips

Encode then decode, serialize then parse, filter then count.

## What not to do

Do not restate the implementation as a property. If the test and the code share
a mistake, the test proves nothing.

## Takeaway

Keep both kinds of test. Examples document intent; properties hunt for the
inputs you never considered.`,
    publishedDate: "2025-08-21",
    readingTime: 8,
    author: AUTHOR,
    tags: ["Testing", "TypeScript", "React"],
    featured: false,
    draft: false,
  },
  {
    id: "theme-tokens-with-tailwind",
    slug: "theme-tokens-with-tailwind",
    title: "Theme Tokens That Survive a Redesign",
    excerpt:
      "Theme-aware CSS variables let dark mode land without touching a single component.",
    coverImage:
      "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=1200&q=80",
    content: `If a component knows what colour it is, the theme is already
broken.

## Semantic names beat literal ones

A token called \`surface\` survives a palette change. A token called \`gray-100\`
becomes a lie the moment the palette moves.

### Defining the scale

Pick a small set of roles — surface, foreground, muted, accent, border — and
resist adding more until something genuinely does not fit.

### Switching themes

One attribute on the document element swaps the variable values. Components read
the same token names in both themes.

## Avoiding the flash

Theme has to be resolved before first paint, which means a tiny inline script
rather than a React effect.

## Testing it

Assert that both themes define every token. A missing variable fails as an
invisible element, which is easy to miss by eye.

## Takeaway

Components consume roles, not colours. Everything else follows from that.`,
    publishedDate: "2025-06-09",
    readingTime: 6,
    author: AUTHOR,
    tags: ["CSS", "Architecture", "Testing"],
    featured: false,
    draft: false,
  },
  {
    id: "image-and-font-budgets",
    slug: "image-and-font-budgets",
    title: "Image and Font Budgets on a Static Site",
    excerpt:
      "The cheapest performance win is still not shipping bytes you do not need.",
    coverImage:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80",
    content: `A statically generated site can still feel slow. Almost always it
is media, not JavaScript.

## Images

### Size hints matter more than format

An oversized image served as a modern format is still oversized. Correct
\`sizes\` values do more than any codec choice.

### Priority is a budget

Exactly one above-the-fold image should be eager. Marking several defeats the
point.

## Fonts

### Subset aggressively

Latin plus the punctuation you actually use covers a technical blog.

### Avoid layout shift

A metric-compatible fallback keeps the swap from moving text around.

## Measuring

Compare a throttled profile before and after. Local numbers on a fast machine
will tell you everything is fine.

## Takeaway

Set a byte budget per page and treat it as a real constraint, not a
suggestion.`,
    publishedDate: "2025-04-14",
    readingTime: 6,
    author: AUTHOR,
    tags: ["Performance", "Next.js"],
    featured: false,
    draft: false,
  },
  {
    id: "accessible-motion",
    slug: "accessible-motion",
    title: "Motion That Respects the Visitor",
    excerpt:
      "Reveal animations are fine until they are not skippable, not reduced, and not survivable on a slow device.",
    coverImage:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80",
    content: `Animation is a progressive enhancement. If the content depends on
it, the content is broken.

## Reduced motion is not optional

### Honour the media query

When a visitor asks for reduced motion, transforms and long transitions go away.
The layout must not.

### Never gate content on animation

An element that starts at zero opacity and waits for an observer is invisible
content if the observer never fires.

## Reveal once, then stop

Re-animating on every scroll pass is noise. A one-way state machine — hidden,
then revealed, permanently — is easier to reason about and to test.

## Cheap properties only

Opacity and transform. Anything that triggers layout will show up as jank on a
mid-range phone.

## Takeaway

Design the still version first. Motion is what you add once that version already
works.`,
    publishedDate: "2025-02-27",
    readingTime: 5,
    author: AUTHOR,
    tags: ["CSS", "React"],
    featured: false,
    draft: false,
    seo: {
      metaDescription:
        "How to add reveal animations without breaking reduced-motion preferences or hiding content behind an observer.",
    },
  },
];
