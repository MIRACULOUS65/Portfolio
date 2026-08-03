/**
 * The data-access layer — the only sanctioned path from UI code to `data/*.ts`.
 *
 * ## Contract
 *
 * 1. **Single entry point (Requirement 4.2).** Components, routes, and metadata
 *    builders import selectors from `@/lib/data-access`; they never import a
 *    `data/*.ts` module directly. That keeps every read of a dataset going
 *    through one place, so filtering rules (drafts, archived projects, preview
 *    caps) cannot drift between a homepage preview and its dedicated page.
 * 2. **One dataset per entity (Requirement 4.16).** Every selector for an
 *    entity reads the same underlying array, and id references are *resolved*
 *    (`getProjectById`, `getTechnologyById`) rather than duplicated. Nothing in
 *    this module embeds a copy of a referenced record.
 * 3. **Pure and deterministic (Requirement 22.3, Property 19).** Selectors are
 *    synchronous functions of their arguments over static module data: no
 *    `fetch`, no `async`, no `Date.now()`, no `Math.random()`, no result-mutating
 *    cache. Two calls with the same arguments always return deep-equal results,
 *    which is what makes a refreshed route render the same content as the
 *    original navigation.
 *
 * ## Reference vs. copy — the deliberate choice
 *
 * Two competing pulls: a caller must not be able to corrupt the shared dataset,
 * but Property 2 requires a resolved id reference to be *the same canonical
 * record*, not a divergent clone. So:
 *
 * - **Collection selectors return a fresh `readonly T[]` on every call** — a
 *   shallow copy of the underlying array. Sorting, reversing, or splicing the
 *   result cannot reach `data/`, and `readonly` makes an attempt a type error
 *   rather than a runtime surprise.
 * - **Elements are never cloned.** The objects inside that array are the
 *   canonical records from `data/`, so `getProjectById(id)` and
 *   `getAllProjects().find(...)` yield the identical object.
 * - **Single-record lookups return the canonical record itself**, or
 *   `undefined` when nothing matches — never `null`, never a throw. Callers
 *   distinguish "missing" from other outcomes (e.g. a published-vs-draft blog
 *   check) themselves.
 *
 * Consequences worth stating plainly, because tests assert on them:
 *
 * | Selector kind      | `toEqual` across calls | `toBe` across calls |
 * | ------------------ | ---------------------- | ------------------- |
 * | collection (array) | always holds           | **does not** hold — new array each call |
 * | single record      | always holds           | holds — canonical object |
 *
 * Deep equality is the determinism contract; array identity is explicitly not
 * part of it.
 *
 * ## Structure
 *
 * Sections are grouped by entity, each holding that entity's general getters
 * first and its derived/filtered selectors after, so later additions land next
 * to the data they read instead of at the end of the file.
 */

import { blogs } from "@/data/blogs";
import { certifications } from "@/data/certifications";
import { competitiveProgramming } from "@/data/competitive-programming";
import { education } from "@/data/education";
import { featuredProjects } from "@/data/featured-projects";
import { hackathons } from "@/data/hackathons";
import { navigation } from "@/data/navigation";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { socials } from "@/data/socials";
import { technologies } from "@/data/technologies";
import type {
  Blog,
  Certification,
  CompetitiveProgrammingPlatform,
  Education,
  FeaturedProjectEntry,
  Hackathon,
  NavigationItem,
  Profile,
  Project,
  SiteConfig,
  Social,
  Technology,
} from "@/types";

/* -------------------------------------------------------------------------- */
/*                                  Internals                                 */
/* -------------------------------------------------------------------------- */

/**
 * The defensive copy every collection selector goes through: a new array whose
 * elements are the canonical records. One helper so the choice is applied
 * uniformly — a selector that returned the live array would silently hand
 * callers a mutation path into `data/`.
 */
function snapshot<T>(source: readonly T[]): readonly T[] {
  return [...source];
}

/**
 * Indexes a dataset by a string key for O(1) lookup.
 *
 * Built once per module load from static data, so it is not a cache in the
 * impure sense: it can never disagree with the dataset it was derived from.
 * First occurrence wins on a duplicate key, matching `Array.prototype.find`
 * semantics — `lib/validate-data.ts` is what rejects duplicate ids and slugs.
 */
function indexBy<T>(
  source: readonly T[],
  key: (item: T) => string,
): ReadonlyMap<string, T> {
  const index = new Map<string, T>();

  for (const item of source) {
    const k = key(item);

    if (!index.has(k)) {
      index.set(k, item);
    }
  }

  return index;
}

/**
 * Normalises a caller-supplied count (a preview cap or threshold) into a
 * non-negative integer.
 *
 * Selectors in this module never throw, so a nonsense argument is coerced rather
 * than rejected: a non-finite value (`NaN`, `±Infinity`) falls back to the
 * selector's documented default, and anything else is floored and clamped to
 * `>= 0`. `Math.floor` rather than `Math.trunc` so a negative fraction lands on
 * the clamp instead of rounding toward zero — either way the result is `0`.
 */
function normalizeCount(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

const projectsById = indexBy(projects, (project) => project.id);
const projectsBySlug = indexBy(projects, (project) => project.slug);
const technologiesById = indexBy(technologies, (technology) => technology.id);
const blogsBySlug = indexBy(blogs, (blog) => blog.slug);

/* -------------------------------------------------------------------------- */
/*                                  Projects                                  */
/* -------------------------------------------------------------------------- */

/**
 * Every project, in dataset order — including archived ones.
 *
 * The single source the ProjectsPage, ProjectDetailPage, and the homepage
 * FeaturedProjectsSection all read from (Requirement 4.16). Callers that must
 * hide archived entries do so through the dedicated filtering selector rather
 * than by re-filtering this list ad hoc.
 */
export function getAllProjects(): readonly Project[] {
  return snapshot(projects);
}

/**
 * The project with this `id`, or `undefined` when no project has it.
 *
 * The resolver behind every `Project.id` reference (`FeaturedProjectEntry.projectId`,
 * `Project.relatedProjects[]`). Returns the canonical record, so a resolved
 * reference is identical to the entry in {@link getAllProjects} rather than a
 * copy of it (Requirement 4.16).
 */
export function getProjectById(id: string): Project | undefined {
  return projectsById.get(id);
}

/**
 * The project addressed by a `/projects/[slug]` segment, or `undefined` when
 * the slug matches nothing — which is what the route turns into a 404.
 *
 * `slug` currently equals `id` for every entry, but the lookup goes through the
 * `slug` field so the two can diverge without breaking URLs.
 */
export function getProjectBySlug(slug: string): Project | undefined {
  return projectsBySlug.get(slug);
}

/**
 * Total order over featured entries: `order` ascending, ties broken by
 * `projectId`.
 *
 * `order` values in `data/featured-projects.ts` are distinct today, so the
 * tie-break never fires — it exists so the sort stays a *total* order if the
 * data ever gains a duplicate `order`. Without it, two tied entries would fall
 * back to array position and the resolved list would silently depend on how the
 * data file happens to be written, which Property 19 (determinism) would only
 * catch if the dataset changed between runs. Plain `<`/`>` comparison rather
 * than `localeCompare` keeps the result locale-independent.
 */
function compareFeaturedEntries(
  a: FeaturedProjectEntry,
  b: FeaturedProjectEntry,
): number {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  if (a.projectId === b.projectId) {
    return 0;
  }

  return a.projectId < b.projectId ? -1 : 1;
}

/**
 * The featured projects, resolved from `data/featured-projects.ts` id
 * references and ordered by `order` ascending.
 *
 * **The first element is the default selection** (Requirement 9.3). Task 22.1's
 * `initialSelectionState` takes `getFeaturedProjectsResolved()[0]`, so the
 * ordering decided here — not array position in the data file — is what a
 * visitor sees on initial render. With the current dataset that resolves to
 * `nebula-analytics, pulse-design-system, orbital-vision, atlas-edge-cache,
 * ledger-lens`, i.e. `nebula-analytics` is the default.
 *
 * Length is whatever the dataset configures: no cap, no padding, no hardcoded
 * three (Requirement 9.1). `ProjectSelector` renders exactly this many cards
 * (Property 8), so adding or removing a featured reference is a data-only
 * change.
 *
 * Consistent with the module contract: a fresh array per call whose elements
 * are the canonical `Project` records from `getAllProjects()`, never clones
 * (Requirement 4.16, Property 2). `featuredProjects` itself is never mutated —
 * the sort runs on a copy, so repeated calls cannot reorder the dataset out
 * from under each other (Property 19).
 *
 * **Unresolvable references are skipped, not thrown on.** `lib/validate-data.ts`
 * (task 10) fails the build on a dangling `projectId`, so a miss here is
 * unreachable in a shipped build; that validator is the real guard. Given that,
 * the runtime choice is between two unreachable branches, and skipping degrades
 * to a shorter selector list while throwing would take down the whole homepage
 * — an outsized failure for one bad id. The skip stays silent rather than
 * logging because this module is pure and runs during server render.
 *
 * **Archived projects referenced as featured are included.** Being listed in
 * `data/featured-projects.ts` is explicit curation, so this selector honours it
 * rather than second-guessing the data; filtering archived entries is the job
 * of `filterProjects` on the ProjectsPage (task 9.7), where visitors browse
 * rather than being shown a hand-picked list. No featured project is currently
 * archived, so this affects nothing today — it is stated so the behaviour is
 * chosen rather than incidental.
 */
export function getFeaturedProjectsResolved(): readonly Project[] {
  // `snapshot()` is deliberately not used here: its `readonly` return type
  // blocks the in-place `sort`. This copy never escapes the function, and
  // `.map`/`.filter` below produce the fresh array the contract requires.
  return [...featuredProjects]
    .sort(compareFeaturedEntries)
    .map((entry) => getProjectById(entry.projectId))
    .filter((project): project is Project => project !== undefined);
}

/**
 * The ProjectsPage filter criteria (Requirements 18.3, 18.4). Every field is
 * optional, and an omitted — or blank — field filters nothing.
 *
 * ## Why `string` and not the `ProjectCategory` / `ProjectStatus` unions
 *
 * The only producer of these values is `app/projects/page.tsx` (task 35.3),
 * which reads them from URL `searchParams`. That boundary is untyped and
 * untrusted: a visitor can hand-edit `?category=Banana`, and a stale bookmark
 * can carry a category that no longer exists. Typing the fields as the unions
 * would push a cast or a hand-written type guard into the page — the exact
 * validation this module is better placed to own — and the cast would be a lie
 * rather than a check. So the criteria are plain strings, validated here by
 * matching against the dataset (see below), and the page can forward what it
 * read without narrowing it first.
 */
export type ProjectFilterCriteria = {
  /** Free text matched against `title` and `description`, case-insensitively. */
  readonly search?: string;
  /** A `ProjectCategory` value. Anything else matches no project. */
  readonly category?: string;
  /** A `ProjectStatus` value. Anything else matches no project. */
  readonly status?: string;
};

/**
 * Normalises one criterion into a lowercase comparison term, or `undefined`
 * when the criterion is absent.
 *
 * Trimming happens before the emptiness check, so `""`, `"   "`, and `"\n"` all
 * collapse to `undefined` — a search box the visitor cleared, or a `?search=`
 * left in the URL by a form submit, must behave exactly like no search at all
 * rather than matching every project by empty substring. Lowercasing here keeps
 * every comparison in {@link filterProjects} case-insensitive from one place.
 *
 * The `typeof` guard is defensive rather than decorative: `searchParams` values
 * are `string | string[] | undefined` at the framework boundary, so a repeated
 * query parameter can arrive as an array despite the declared type. This module
 * never throws, so a non-string is treated as absent instead of being coerced
 * with `String(...)` — `["Web", "Mobile"].toString()` would produce the
 * nonsense term `"web,mobile"`.
 */
function normalizeFilterTerm(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().toLowerCase();

  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * The ProjectsPage listing: every **non-archived** project matching all supplied
 * criteria, in dataset order (Requirements 18.2, 18.3, 18.4).
 *
 * The single selector behind `/projects` (task 35.3). `ProjectGrid` (task 35.2)
 * renders this array as-is and shows `EmptyState` when it is empty — the page
 * does no filtering of its own, so the rules below are stated in exactly one
 * place (Requirement 4.2).
 *
 * ## Archived projects are excluded unconditionally
 *
 * The `archived` flag is checked before any criterion and no argument can
 * re-admit an archived project: this is a browse-everything listing, and an
 * archived project is one the owner has retired from it. With the current
 * dataset the unfiltered result is the 7 non-archived entries in `data/`
 * order — `nebula-analytics, pulse-design-system, orbital-vision,
 * atlas-edge-cache, ledger-lens, trailhead-mobile, signal-mesh` — and
 * `beacon-status-page` is never reachable. Note it deliberately shares the terms
 * "dashboard" and "analytics" with active projects, so a search for either has
 * an *observable* exclusion to prove rather than a vacuous one.
 *
 * Exclusion keys on the `archived` boolean, **not** on `status === "Archived"`.
 * The two are separate fields, and only one of them is documented as the
 * lifecycle flag; keying on `status` would silently change the listing if a
 * project were ever marked `"Archived"` while still meant to be browsable.
 *
 * ### The `status: "Archived"` tension, and what task 35.1 should do about it
 *
 * `"Archived"` is a legal `ProjectStatus`, so `filterProjects({ status:
 * "Archived" })` type-checks — but the archived exclusion runs first, and the
 * dataset keeps `archived` and `status` mutually consistent, so with the shipped
 * data it returns `[]`. That is a correct answer, not a bug: the empty state
 * ("no projects match") is exactly what a visitor asking for retired projects
 * should see on a listing that excludes them.
 *
 * It should nevertheless be unreachable from the UI. Task 35.1's `FilterBar`
 * builds its status options from the statuses actually present in this
 * selector's unfiltered result — `In Progress`, `Completed`, `Maintained` today
 * — rather than from the full `ProjectStatus` union, so it never offers a choice
 * that can only ever yield an empty grid. Categories need no such care: all six
 * `ProjectCategory` values are represented among non-archived projects, and
 * `Web` survives `beacon-status-page`'s exclusion through `nebula-analytics`.
 *
 * ## The three criteria combine with AND
 *
 * A project must satisfy *every* supplied criterion, and an absent one
 * constrains nothing. `filterProjects()` and `filterProjects({})` are therefore
 * both "all non-archived projects", which is what the page renders before the
 * visitor touches a control (Requirement 18.2).
 *
 * - **`search`** matches `title` or `description`, case-insensitively, as a
 *   plain substring (Requirement 18.3). Not fuzzy, not tokenised, no ranking:
 *   Property 15 states the result "equals exactly the projects whose title or
 *   description contains that substring case-insensitively", and any scoring
 *   pass would turn that equality into an approximation.
 *
 *   **`shortDescription` is deliberately not searched.** Requirement 18.3 says
 *   "title or description" and Property 15 repeats the same two fields, so
 *   including a third would make the property false the moment a generated
 *   project mentioned a term only in its `shortDescription`. The practical cost
 *   is near zero — `shortDescription` is a one-line précis of `description`, so
 *   a term unique to it is unusual — and the two fields are checked separately
 *   rather than concatenated, so no match can straddle a field boundary either.
 *
 * - **`category` / `status`** must equal the project's field, compared
 *   case-insensitively after trimming (Requirement 18.4). Case-insensitive so a
 *   hand-typed `?status=completed` behaves like the canonical `Completed`,
 *   matching how `search` treats case; task 35.1 still emits the canonical
 *   values so shared URLs stay readable.
 *
 * ## Unmatched and unknown values both yield `[]` — never a fallback listing
 *
 * A criterion combination that nothing satisfies returns an empty array, and so
 * does an unknown value such as `?category=Banana`. Validation is structural
 * rather than a separate allow-list: the value is compared against each
 * project's own field, so a string outside the union simply matches nothing.
 * That is one code path for "valid but unmatched" and "not a real category",
 * which is what makes the selector total — it never throws on untrusted input
 * (Property 19) and never degrades to showing everything, which would tell the
 * visitor their filter had been applied when it had been ignored. Task 35.2
 * turns the empty array into `EmptyState` (Requirements 18.7, 28.1).
 *
 * ## Ordering: dataset order, deliberately not a recency sort
 *
 * Requirement 18.2 asks for "all non-archived projects sourced from the Project
 * dataset" without an ordering, so the convention is pinned here: the order in
 * `data/projects.ts` — featured entries first, then the rest — which is
 * editorial curation and stable across calls.
 *
 * The neighbouring selectors all chose newest-first, and that is not a
 * contradiction: they are *preview slices* where recency decides which few
 * entries win the slots. Nothing is dropped here, so recency would only
 * rearrange, and it would cost more than it bought. `completionDate` is
 * optional, so ordering by completion needs a sentinel for in-progress work and
 * the only meaningful one is "now" — the clock dependency
 * {@link compareEducationByRecency} exists to avoid (Requirement 22.3). Ordering
 * by `startDate` instead would rank `signal-mesh` (a non-featured, in-progress
 * project started most recently) above `nebula-analytics`, which inverts the
 * curation the data file expresses.
 *
 * Preserving dataset order also makes the result a **subsequence** of
 * {@link getAllProjects}, so Property 15's set-equality clauses can be checked
 * against a plain filter over the dataset with no re-sorting on either side.
 *
 * Consistent with the module contract: a fresh array per call whose elements are
 * the canonical `Project` records, never clones, and `projects` is never mutated
 * — `filter` reads it and builds a new array.
 *
 * @param criteria - Optional search/category/status criteria; defaults to no
 *   filtering at all.
 */
export function filterProjects(
  criteria: ProjectFilterCriteria = {},
): readonly Project[] {
  const search = normalizeFilterTerm(criteria.search);
  const category = normalizeFilterTerm(criteria.category);
  const status = normalizeFilterTerm(criteria.status);

  // `snapshot()` is deliberately not used here: `filter` already produces the
  // fresh array the contract requires, and copying first would be wasted work.
  return projects.filter((project) => {
    if (project.archived) {
      return false;
    }

    if (category !== undefined && project.category.toLowerCase() !== category) {
      return false;
    }

    if (status !== undefined && project.status.toLowerCase() !== status) {
      return false;
    }

    // Fields checked separately, never concatenated, so a term cannot match
    // across the title/description boundary.
    return (
      search === undefined ||
      project.title.toLowerCase().includes(search) ||
      project.description.toLowerCase().includes(search)
    );
  });
}

/**
 * The RelatedProjects list for a project detail view: the projects its
 * `relatedProjects` ids resolve to, or — when that resolves to nothing — the
 * **pinned** projects as a popular-alternatives fallback (Requirements 19.3,
 * 19.5).
 *
 * Two consumers, one selector, which is the point:
 *
 * - `components/project-detail/RelatedProjects.tsx` (task 36.2) passes the
 *   project being viewed and normally renders its curated references
 *   (Requirement 19.3).
 * - `app/projects/[slug]/not-found.tsx` (task 36.3) has no project at all — the
 *   slug matched nothing — so it calls `getRelatedOrPopularProjects()` and gets
 *   the fallback. Requirement 19.5 asks that view to "attempt to display related
 *   projects", and this is what makes the attempt meaningful rather than
 *   guaranteed-empty.
 *
 * ## The fallback engages on the *resolved* list being empty, not on `relatedProjects`
 *
 * Resolution runs first, then the branch is chosen. So a project whose
 * references are all dangling, all archived, or nothing but its own id degrades
 * to the popular fallback exactly like `ledger-lens` and `signal-mesh` (the two
 * entries with a deliberately empty `relatedProjects`), instead of rendering an
 * empty section under a "Related projects" heading. Branching on the raw
 * `relatedProjects.length` would have produced that empty section, and it would
 * have made the difference between "no curation" and "broken curation"
 * visitor-visible for no benefit.
 *
 * The branch is decided **before** the cap applies, so `cap: 0` returns `[]`
 * rather than sliding into the fallback — a cap can never change which branch
 * ran.
 *
 * ## "Popular" means `pinned`, not `featured`
 *
 * `Project` offers two curation flags and they mean different things.
 * `featured` is *homepage carousel membership* — it mirrors
 * `data/featured-projects.ts` and is already fully served by
 * {@link getFeaturedProjectsResolved}. `pinned` is the dataset's standalone
 * "keep this prominent" flag with no other consumer, which is exactly the
 * question a fallback asks: if we cannot say what is *related*, what is worth
 * showing instead? Reusing `featured` would also make the not-found page a
 * duplicate of the homepage carousel, in the same order, which reads like a
 * broken template rather than a recommendation.
 *
 * The fallback is a **single tier**: pinned or nothing. It deliberately does not
 * ladder down through `featured` and then "any non-archived project", because
 * that would make an empty result unreachable for any non-empty dataset and turn
 * Requirement 19.5's empty-state branch into dead code. Keeping `[]` reachable
 * (a dataset whose only pinned project is the one being viewed) is what keeps
 * that requirement — and Property 16's empty case — a live path.
 *
 * With the current dataset, four projects are pinned (`nebula-analytics`,
 * `pulse-design-system`, `ledger-lens`, `signal-mesh`), so the fallback always
 * has something to return: `getRelatedOrPopularProjects()` yields the first
 * three, and `ledger-lens` gets `nebula-analytics, pulse-design-system,
 * signal-mesh` — itself removed, the cap doing the rest.
 *
 * ## A project is never related to itself, structurally
 *
 * Self-exclusion is one predicate applied to every candidate on both branches,
 * not a post-filter on the result, so no future branch can forget it. It matters
 * on both paths for different reasons: `lib/validate-data.ts` (task 10) rejects
 * a project that lists its own id, so the curated path is guarded at build time,
 * but the fallback path draws from the whole dataset and *every* pinned project
 * would otherwise link to itself.
 *
 * ## Archived projects are excluded from related output — on both branches
 *
 * This is the opposite of {@link getFeaturedProjectsResolved}, which honours
 * explicit featured curation even for an archived project, and the same as
 * {@link filterProjects}, which excludes archived entries from the browse
 * listing. The deciding difference is that these are *outbound links*: task
 * 36.1's `generateStaticParams` builds `/projects/[slug]` from non-archived
 * slugs only, so a related card pointing at an archived project offers the
 * visitor a route the build never rendered. A retired project is also a poor
 * "what to read next" suggestion by definition.
 *
 * Nothing observable changes today — no `relatedProjects` array names
 * `beacon-status-page`, and it is not pinned — so this is stated as a decision
 * rather than left to be inferred. `archived` is the flag checked, not
 * `status === "Archived"`, for the reason {@link filterProjects} gives.
 *
 * ## Cap and ordering
 *
 * `cap` defaults to `3`, matching design.md's "2–3 related/alternative projects"
 * for the not-found view and the other previews in this module. It is applied
 * uniformly to both branches so the rendered row has the same bound whichever
 * one ran; on the curated branch it never binds today (the longest
 * `relatedProjects` array holds two ids). Clamping goes through
 * {@link normalizeCount}: non-finite falls back to `3`, anything else is floored
 * and clamped to `>= 0`.
 *
 * Ordering is **declaration order, never a sort**. The curated branch preserves
 * the order of `relatedProjects`, because that array is the author saying which
 * relation matters most; the fallback preserves `data/projects.ts` order, the
 * same editorial curation {@link filterProjects} keeps. A recency sort was
 * rejected for the reason spelled out there: `completionDate` is optional, and
 * the only sensible sentinel for in-progress work is "now", which would put the
 * clock inside a selector Property 19 requires to be pure.
 *
 * Duplicate ids in `relatedProjects` collapse to their first occurrence, so the
 * result never repeats a project even if the data file does.
 *
 * ## Shape: one array, which is what makes Property 16 expressible
 *
 * The selector returns a single list and never a "list plus a reason". Task
 * 36.3's view therefore branches on exactly one condition — `length === 0` →
 * `EmptyState`, otherwise the cards — so rendering both, or neither, is
 * unrepresentable rather than merely untested (Requirement 28.4, Property 16).
 * That is also why `project` is optional instead of the view having to
 * synthesise a placeholder project to ask the question.
 *
 * Consistent with the module contract: a fresh array per call whose elements are
 * the canonical `Project` records, never clones, and `projects` is never mutated
 * — `filter` and `slice` both build new arrays.
 *
 * @param project - The project being viewed, or `undefined` on the not-found
 *   path, where there is no project and the fallback is the whole answer.
 * @param cap - Hard cap on the number of projects returned.
 */
export function getRelatedOrPopularProjects(
  project?: Project,
  cap = 3,
): readonly Project[] {
  const limit = normalizeCount(cap, 3);

  // One eligibility predicate for both branches: self-exclusion and the
  // archived rule cannot be forgotten on one path and applied on the other.
  const isEligible = (candidate: Project): boolean =>
    !candidate.archived && candidate.id !== project?.id;

  const seenIds = new Set<string>();
  const related: Project[] = [];

  for (const id of project?.relatedProjects ?? []) {
    const candidate = getProjectById(id);

    if (
      candidate === undefined ||
      !isEligible(candidate) ||
      seenIds.has(candidate.id)
    ) {
      continue;
    }

    seenIds.add(candidate.id);
    related.push(candidate);
  }

  if (related.length > 0) {
    return related.slice(0, limit);
  }

  // `snapshot()` is deliberately not used here: `filter` already produces the
  // fresh array the contract requires.
  return projects
    .filter((candidate) => candidate.pinned && isEligible(candidate))
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/*                                Technologies                                */
/* -------------------------------------------------------------------------- */

/**
 * Every technology, in dataset order (grouped by category in `data/`).
 *
 * Feeds the TechStack marquee and is the resolution target for the
 * `Technology.id` lists on projects, hackathons, and certifications.
 */
export function getAllTechnologies(): readonly Technology[] {
  return snapshot(technologies);
}

/**
 * The technology with this `id`, or `undefined` when unknown.
 *
 * Used to turn a `technologies: string[]` id list into displayable records
 * without any dataset embedding copies of technology data (Requirement 4.16).
 * An unresolvable id yields `undefined` here; `lib/validate-data.ts` is what
 * makes that a build failure instead of a silent gap.
 */
export function getTechnologyById(id: string): Technology | undefined {
  return technologiesById.get(id);
}

/* -------------------------------------------------------------------------- */
/*                                    Blogs                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every blog post, in dataset order — **drafts included**.
 *
 * Deliberately unfiltered: this is the raw dataset. Anything visitor-facing
 * (the `/blog` listing, the preview section, the sitemap) goes through a
 * published-only selector, so "shows drafts" is never the default.
 */
export function getAllBlogs(): readonly Blog[] {
  return snapshot(blogs);
}

/**
 * The post addressed by a `/blog/[slug]` segment, or `undefined` when no post
 * has that slug.
 *
 * Looks across all posts, drafts included, so callers can tell a *missing*
 * slug (`undefined`) from a *draft* one (a record with `draft: true`) — both
 * render as not-found, but only one of them is a broken reference.
 */
export function getBlogBySlug(slug: string): Blog | undefined {
  return blogsBySlug.get(slug);
}

/**
 * Total order over posts: `publishedDate` descending (newest first), ties broken
 * by `slug` ascending.
 *
 * `publishedDate` is an `ISODateString` (`"YYYY-MM-DD"`), so plain string
 * comparison is already chronological — no `Date` parsing, which keeps the
 * comparator free of timezone interpretation. Comparison is `<`/`>` rather than
 * `localeCompare` so the result is locale-independent.
 *
 * **Recency is measured between posts, never against "now".** Nothing here
 * reads the current date, so the ordering is a pure function of the dataset
 * (Requirement 22.3, Property 19). A selector that compared `publishedDate` to
 * `new Date()` would return different results on different days and break that.
 * A consequence worth stating: a future-dated post is not held back, it simply
 * sorts first — publishing is controlled by the `draft` flag, not by the clock.
 *
 * The `slug` tie-break mirrors the reasoning behind {@link compareFeaturedEntries}:
 * all `publishedDate` values in `data/blogs.ts` are distinct today, so it never
 * fires, but without it two same-day posts would fall back to array position and
 * the published ordering — and therefore prev/next navigation (Property 18) —
 * would silently depend on how the data file happens to be written.
 */
function compareBlogsByRecency(a: Blog, b: Blog): number {
  if (a.publishedDate !== b.publishedDate) {
    return a.publishedDate < b.publishedDate ? 1 : -1;
  }

  if (a.slug === b.slug) {
    return 0;
  }

  return a.slug < b.slug ? -1 : 1;
}

/**
 * Every non-draft post, most-recent-first by `publishedDate`.
 *
 * The canonical published ordering for the whole app (Requirement 20.2). The
 * `/blog` listing (task 38.2), the sitemap (task 42.4), prev/next article
 * navigation (Property 18), and the homepage preview below all read this same
 * order, so "newest first" is decided once instead of per consumer.
 *
 * With the current dataset that resolves to `server-components-data-flow,
 * type-safe-data-layer, property-based-testing-react, theme-tokens-with-tailwind,
 * image-and-font-budgets, accessible-motion` — six of the seven entries. The
 * excluded one is `edge-runtime-experiments`, deliberately the *newest* date in
 * the file, so forgetting the draft filter changes the observable first element
 * rather than failing silently (Requirement 10.1).
 *
 * Consistent with the module contract: a fresh array per call whose elements are
 * the canonical `Blog` records from {@link getAllBlogs}, never clones. `blogs`
 * is never mutated — the sort runs on a copy.
 */
export function getAllPublishedBlogs(): readonly Blog[] {
  // `snapshot()` is deliberately not used here: its `readonly` return type
  // blocks the in-place `sort`. This copy never escapes the function — `.sort`
  // returns the same array, which is already the fresh one the contract wants.
  return [...blogs].filter((blog) => !blog.draft).sort(compareBlogsByRecency);
}

/**
 * The homepage BlogPreviewSection slice: the newest published posts, capped at
 * `max` (Requirement 10.1).
 *
 * Always a prefix of {@link getAllPublishedBlogs}, so the preview and the
 * `/blog` listing can never disagree about what is newest or what is published
 * (Requirement 4.16). Property 4 (strict subset) holds whenever the published
 * count exceeds `max`: 6 > 3 today.
 *
 * ## Fewer than `min` published posts: return the short list
 *
 * The selector returns however many published posts exist, even when that is
 * below `min` — it never returns `[]` to signal "not enough". `min` therefore
 * does not filter anything; it declares the threshold the *component* enforces.
 * Task 25.2's contract, stated unambiguously:
 *
 * - `result.length >= min` → render `BlogCard[]` plus one `ExploreMoreButton`.
 *   Exactly `min` is a normal state, with no partial-state indicator
 *   (Requirement 10.4).
 * - `result.length < min` (including `0`) → render `EmptyState` instead of the
 *   cards, so the slot is never blank (Requirement 10.5).
 *
 * Two reasons for pushing the decision to the component rather than emptying the
 * array here. First, an empty result would be ambiguous — "no published posts"
 * and "one published post, below the threshold" would look identical, and
 * Requirement 10.5 wants the section to describe the *partial* state. Second, it
 * keeps both properties cleanly expressible: Property 10 bounds the length
 * between `min(min, available)` and `max` (a lower bound an empty-on-shortfall
 * selector would violate), and Property 4 compares a preview against the full
 * listing, which only works while the preview stays a genuine prefix of it.
 *
 * ## Argument clamping
 *
 * Both bounds are counts, so nonsense inputs are normalised rather than thrown
 * on (the module never throws):
 *
 * 1. A non-finite value (`NaN`, `±Infinity`) falls back to that parameter's
 *    default — `2` for `min`, `3` for `max`.
 * 2. Otherwise the value is floored and clamped to `>= 0`, so `2.7` behaves as
 *    `2` and any negative behaves as `0`. `max === 0` returns `[]`, which is a
 *    coherent answer to "give me no posts".
 * 3. `min > max` is read as the effective threshold being `Math.min(min, max)` —
 *    clamped *down*, never widening the window. `max` stays the hard cap, so
 *    "at most `max`" holds for every input. Because `min` does not select
 *    anything, this cannot produce a nonsense result either way: the output is
 *    still the newest published posts, still capped, still ordered.
 *
 * @param min - The component's render threshold, not a filter. Documented above;
 *   deliberately not applied to the slice, because applying it would break
 *   Property 10's lower bound. Kept in the signature so a call site reads like
 *   Requirement 10.1's "2 to 3" and the threshold travels with the selector
 *   rather than being re-invented in the component.
 * @param max - Hard cap on the number of posts returned.
 */
export function getRecentPublishedBlogs(min = 2, max = 3): readonly Blog[] {
  // `min` is declarative on purpose — the shortfall decision belongs to the
  // component (see the doc comment). Slicing at `min` would make a one-post
  // dataset return `[]` and violate Property 10's lower bound.
  void min;

  return getAllPublishedBlogs().slice(0, normalizeCount(max, 3));
}

/**
 * The two neighbours of a published post in {@link getAllPublishedBlogs} order.
 *
 * Both keys are always present, `undefined` at the ends of the list, rather than
 * optional properties. A uniform shape means `PrevNextNav` destructures once
 * without an optional-property dance, and the returned record is structurally
 * identical for every input — including the misses — which keeps the
 * determinism assertions plain deep-equality checks.
 */
export type BlogNeighbours = {
  /**
   * The post one position **earlier** in the published listing, i.e. the
   * *newer* post. `undefined` for the newest post.
   */
  readonly previous: Blog | undefined;
  /**
   * The post one position **later** in the published listing, i.e. the *older*
   * post. `undefined` for the oldest post.
   */
  readonly next: Blog | undefined;
};

/**
 * Previous/next article navigation for `/blog/[slug]` (Requirement 20.5).
 *
 * Neighbours are read **positionally out of {@link getAllPublishedBlogs}**, the
 * one canonical published ordering, so prev/next can never disagree with the
 * `/blog` listing a visitor just came from: walking the listing top to bottom
 * and walking it via "next" visit the same posts in the same order
 * (Requirement 4.16).
 *
 * ## Direction: `previous` is positional, and positional means *newer*
 *
 * The published list is newest-first, so "previous article" is genuinely
 * ambiguous in prose — it could mean the one above in the listing or the one
 * published earlier in time. Property 18 settles it positionally: for the post at
 * index *i*, previous is the post at *i - 1* and next is the post at *i + 1*. So
 * in this module:
 *
 * - **`previous` = index `i - 1` = earlier in the listing = the newer post.**
 *   `undefined` for the first element (`server-components-data-flow` today).
 * - **`next` = index `i + 1` = later in the listing = the older post.**
 *   `undefined` for the last element (`accessible-motion` today).
 *
 * Task 38.3's `PrevNextNav` should label these **"Newer article" / "Older
 * article"** rather than "Previous"/"Next": the field names describe list
 * position, and only a temporal label is unambiguous to a reader who cannot see
 * the index.
 *
 * ## A draft slug and a missing slug both return no neighbours
 *
 * The search runs over the *published* list, so `edge-runtime-experiments` (the
 * draft, and the newest date in the dataset) and `no-such-post` both yield
 * `{ previous: undefined, next: undefined }`. A draft has no position in the
 * published sequence, and giving it one would leak it into navigation from a
 * neighbouring article — the exact leak {@link getAllPublishedBlogs} exists to
 * prevent (Requirement 20.6).
 *
 * That the two cases look identical here does **not** conflate them for
 * Property 17: distinguishing missing from draft is {@link getBlogBySlug}'s job
 * (it searches drafts too, returning the record with `draft: true`), and task
 * 38.5's page calls that first. By the time this selector runs, the page has
 * already decided the slug is a published post; the empty result is simply the
 * honest answer for anything else, and never a throw (Property 19).
 *
 * ## Why a linear scan rather than the `blogsBySlug` index
 *
 * What is needed is a *position* in the published list, and `blogsBySlug` maps
 * slugs to records — including drafts, which would resolve a draft slug to a
 * record that has no position at all. A second index from slug to published
 * position could be built at module load, but it would be a derived structure
 * able to disagree with the ordering it was derived from, over six entries. The
 * scan reads the ordering itself, so agreement is structural.
 *
 * A fresh record per call, holding the canonical `Blog` records (never clones),
 * and nothing is mutated.
 *
 * @param slug - The requested `/blog/[slug]` segment. Unknown, draft, and
 *   malformed values are all answered with no neighbours.
 */
export function getPrevNextBlog(slug: string): BlogNeighbours {
  const published = getAllPublishedBlogs();
  const index = published.findIndex((blog) => blog.slug === slug);

  if (index === -1) {
    return { previous: undefined, next: undefined };
  }

  return {
    // Explicit bounds checks rather than `Array.prototype.at`: `at(-1)` wraps
    // to the last element, which would make the newest post's "previous" the
    // oldest one.
    previous: index > 0 ? published[index - 1] : undefined,
    next: index < published.length - 1 ? published[index + 1] : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*                               Certifications                               */
/* -------------------------------------------------------------------------- */

/**
 * Every certification, in dataset order.
 *
 * The full list the CertificationsPage renders; the homepage preview reads the
 * same dataset through its own capped selector (Requirement 4.16). Deliberately
 * **uncapped and unfiltered** — `/certifications` must list *all* certifications
 * regardless of the `featured` flag (Requirement 21.4), so the page renders
 * exactly `getAllCertifications().length` cards, which is Property 14's
 * "full-listing count equals dataset size" clause. Truncation and curation live
 * in {@link getFeaturedCertifications} alone.
 */
export function getAllCertifications(): readonly Certification[] {
  return snapshot(certifications);
}

/**
 * Total order over certifications: `issueDate` descending (newest first), ties
 * broken by `id` ascending.
 *
 * Newest-first mirrors {@link compareBlogsByRecency} — a credential earned this
 * year says more about current skills than one from four years ago, and the
 * homepage preview only shows a handful, so the most recent ones should win the
 * slots. `issueDate` is an `ISODateString` (`"YYYY-MM-DD"`), so plain string
 * comparison is already chronological: no `Date` parsing, no timezone
 * interpretation, and nothing compared against "now" (Requirement 22.3,
 * Property 19).
 *
 * The `id` tie-break carries the same reasoning as
 * {@link compareFeaturedEntries}: every `issueDate` in `data/certifications.ts`
 * is distinct today, so it never fires, but without it two same-day credentials
 * would fall back to array position and the preview selection would silently
 * depend on how the data file happens to be written. `<`/`>` rather than
 * `localeCompare` keeps the result locale-independent.
 */
function compareCertificationsByRecency(
  a: Certification,
  b: Certification,
): number {
  if (a.issueDate !== b.issueDate) {
    return a.issueDate < b.issueDate ? 1 : -1;
  }

  if (a.id === b.id) {
    return 0;
  }

  return a.id < b.id ? -1 : 1;
}

/**
 * The homepage CertificationsSection slice: the newest featured certifications,
 * capped at `cap` — or the newest non-featured ones when *nothing* is featured
 * (Requirements 12.1, 12.2).
 *
 * ## The fallback rule, exactly as the design states it
 *
 * design.md's CertificationsSection rule and Requirement 12.2 both gate the
 * fallback on the featured group being **empty**, not on it being *smaller than
 * `cap`*:
 *
 * - at least one `featured: true` entry → the result is drawn **entirely** from
 *   the featured group, even when that yields fewer than `cap` entries;
 * - zero featured entries → the result is drawn entirely from the non-featured
 *   group, so a dataset with no curation still previews something rather than
 *   rendering an empty section (design.md's error-handling table: "only empty if
 *   the whole dataset is empty");
 * - empty dataset → `[]`.
 *
 * This is one group or the other, never a mix. Topping a short featured group up
 * from the non-featured one is deliberately *not* implemented: Property 13
 * (task 9.13) asserts that whenever a featured entry exists the selection
 * "consists entirely of featured entries", which a top-up would violate the
 * moment the featured count dropped below `cap`. Selecting from a single group
 * also makes the no-duplicates guarantee structural rather than something to
 * de-duplicate after the fact — the two groups are disjoint by construction
 * (`featured` is a boolean partition), and each group is a filter over a dataset
 * whose ids are unique, so no entry can appear twice.
 *
 * With the current dataset (3 entries, all featured) this returns all three
 * real credentials, newest `issueDate` first:
 * `udemy-complete-web-development-course`, `100xdevs-cohort-3`,
 * `udemy-python-bootcamp`.
 *
 * ## `cap` and the strict-subset guarantee
 *
 * `cap` defaults to `3`, matching {@link getRecentPublishedBlogs}'s `max` so
 * every homepage preview shows the same number of cards. With only 3 real
 * entries today the preview is not a *strict* subset of `/certifications` —
 * both render all three — which stays consistent with Requirement 21.4
 * (`/certifications` renders the full, uncapped list) even though it is no
 * longer smaller than the preview cap.
 *
 * Clamping goes through {@link normalizeCount} so a nonsense argument is coerced
 * rather than thrown on (the module never throws): non-finite falls back to `3`,
 * anything else is floored and clamped to `>= 0`. `cap === 0` returns `[]`, a
 * coherent answer to "give me no certifications". A `cap` above the group size
 * returns the whole group — never padded, never duplicated.
 *
 * Consistent with the module contract: a fresh array per call whose elements are
 * the canonical `Certification` records from {@link getAllCertifications}, never
 * clones. `certifications` is never mutated — the sort runs on a copy.
 *
 * @param cap - Hard cap on the number of certifications returned.
 */
export function getFeaturedCertifications(cap = 3): readonly Certification[] {
  const featured = certifications.filter(
    (certification) => certification.featured,
  );
  // One group or the other: the fallback engages only when nothing is curated,
  // which is what keeps the result free of duplicates without a de-dupe pass.
  const group =
    featured.length > 0
      ? featured
      : certifications.filter((certification) => !certification.featured);

  // `snapshot()` is deliberately not used here: its `readonly` return type
  // blocks the in-place `sort`. `filter` above already produced a fresh array,
  // and `slice` below returns another, so the dataset is never touched.
  return group
    .sort(compareCertificationsByRecency)
    .slice(0, normalizeCount(cap, 3));
}

/* -------------------------------------------------------------------------- */
/*                                 Hackathons                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every hackathon, in dataset order.
 *
 * Shared by the HackathonsPage and the homepage preview slice. Deliberately
 * **uncapped and unfiltered**: `/hackathons` must list *all* hackathons
 * (Requirement 21.2), so this selector applies no slice, no recency window, and
 * no `achievement`-present filter — the page renders exactly
 * `getAllHackathons().length` cards, which is what Property 14's
 * "full-listing count equals dataset size" clause asserts. The homepage's
 * truncation lives in {@link getHackathonsPreview} alone, which is what keeps
 * the preview a strict subset of this list rather than a second opinion about
 * it.
 */
export function getAllHackathons(): readonly Hackathon[] {
  return snapshot(hackathons);
}

/**
 * Total order over hackathons: `date` descending (most recent first), ties
 * broken by `id` ascending.
 *
 * Same shape and same reasoning as {@link compareBlogsByRecency} and
 * {@link compareCertificationsByRecency}, so the three previews on the homepage
 * all mean the same thing by "recent". `date` is an `ISODateString`
 * (`"YYYY-MM-DD"`), so plain string comparison is already chronological: no
 * `Date` parsing, no timezone interpretation, and nothing compared against
 * "now" — recency is measured *between* entries, which is what keeps the
 * selector a pure function of the dataset (Requirement 22.3, Property 19).
 *
 * The `id` tie-break carries the reasoning from {@link compareFeaturedEntries}:
 * every `date` in `data/hackathons.ts` is distinct today, so it never fires, but
 * without it two same-day events would fall back to array position and the
 * preview selection would silently depend on how the data file happens to be
 * written. Ids are unique, so this is a *total* order and the sort has exactly
 * one possible result. `<`/`>` rather than `localeCompare` keeps it
 * locale-independent.
 */
function compareHackathonsByRecency(a: Hackathon, b: Hackathon): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }

  if (a.id === b.id) {
    return 0;
  }

  return a.id < b.id ? -1 : 1;
}

/**
 * The homepage HackathonsSection slice: the most recent hackathons, capped at
 * `cap` (Requirement 14.1).
 *
 * ## Ordering: most recent first
 *
 * design.md's section rule only calls for "a preview slice of hackathons per
 * Requirement 14" and Property 14 constrains the *count*, not the direction, so
 * the direction is chosen here: `date` descending via
 * {@link compareHackathonsByRecency}. Recent events say more about current
 * collaborative work than old ones, and it matches the two neighbouring
 * previews ({@link getAllPublishedBlogs}, {@link getFeaturedCertifications}),
 * so a visitor scrolling the homepage reads every preview the same way.
 *
 * With the current dataset the default cap returns
 * `openbench-ml-marathon-2025`, `orbit-ai-jam-2024`, `nova-global-hack-2024`.
 * Source order in `data/hackathons.ts` is authoring order, which puts
 * `nova-global-hack-2024` first, so a forgotten sort changes the observable
 * first element rather than failing silently.
 *
 * **No `achievement` filter.** Requirement 14.2 asks the card to *display* the
 * achievement, not for the preview to only contain entries that placed. Two
 * entries (`terminal-velocity-devfest-2022`, `pixelpush-game-jam-2021`) ship no
 * `achievement`; they are eligible for the preview on recency alone, and task
 * 30.1's `HackathonCard` handles the absent field. Filtering them out here
 * would make the preview a curated list masquerading as a recency slice, and
 * would break Property 4's "prefix of the full listing" reading.
 *
 * ## `cap` and the strict-subset guarantee
 *
 * `cap` defaults to `3`, matching {@link getFeaturedCertifications}'s `cap` and
 * {@link getRecentPublishedBlogs}'s `max` so every homepage preview shows the
 * same card count. `data/hackathons.ts` holds 8 entries, so `3 < 8`: the cap —
 * not the dataset size — is what binds, and the preview is a **strict** subset
 * of {@link getAllHackathons} with an Explore More button covering the
 * remainder (Requirements 21.2, 14.3, Property 4).
 *
 * Clamping goes through {@link normalizeCount} so a nonsense argument is coerced
 * rather than thrown on (the module never throws): non-finite falls back to `3`,
 * anything else is floored and clamped to `>= 0`. `cap === 0` returns `[]`, a
 * coherent answer to "give me no hackathons". A `cap` above the dataset size
 * returns every entry — never padded, never duplicated — which is Property 14's
 * "never exceeds the dataset size" clause.
 *
 * Consistent with the module contract: a fresh array per call whose elements are
 * the canonical `Hackathon` records from {@link getAllHackathons}, never clones.
 * `hackathons` is never mutated — the sort runs on a copy.
 *
 * @param cap - Hard cap on the number of hackathons returned.
 */
export function getHackathonsPreview(cap = 3): readonly Hackathon[] {
  // `snapshot()` is deliberately not used here: its `readonly` return type
  // blocks the in-place `sort`. This copy never escapes the function, and
  // `slice` below returns the fresh array the contract requires.
  return [...hackathons]
    .sort(compareHackathonsByRecency)
    .slice(0, normalizeCount(cap, 3));
}

/* -------------------------------------------------------------------------- */
/*                                  Education                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every education entry, in dataset order.
 *
 * Dataset order is not a display guarantee — chronological presentation is the
 * job of the date-ordering selector, which sorts a copy from here rather than
 * relying on how the file happens to be written.
 */
export function getAllEducation(): readonly Education[] {
  return snapshot(education);
}

/**
 * Total order over education entries: `startDate` descending (most recent
 * first), ties broken by `id` ascending.
 *
 * ## Only `startDate` is compared — `endDate` is never read
 *
 * `endDate` is optional (absent = ongoing), so any comparator that consulted it
 * would need a sentinel for the missing case, and the only meaningful sentinel
 * for "ongoing" is *today* — which would make the ordering a function of the
 * clock and break Property 19. Sorting on `startDate` alone sidesteps that
 * entirely: it is present on every entry, it is an `ISODateString`
 * (`"YYYY-MM-DD"`) so plain string comparison is already chronological, and the
 * result depends on nothing but the dataset (Requirement 22.3).
 *
 * The consequence, stated so it is a decision rather than an accident:
 * **ongoing entries are not pinned to the top.** An entry with no `endDate`
 * sorts purely by when it started, exactly like a completed one. With the
 * current dataset the ongoing M.Sc. does land first, but because
 * `2023-09-01` is the newest `startDate` — not because it is ongoing.
 *
 * The `id` tie-break follows {@link compareFeaturedEntries}: every `startDate`
 * in `data/education.ts` is distinct today, so it never fires, but without it
 * two entries starting the same month would fall back to array position — and
 * that array is deliberately unsorted, so the rendered timeline would depend on
 * authoring order. Ids are unique, so this is a *total* order with exactly one
 * possible sorted result. `<`/`>` rather than `localeCompare` keeps it
 * locale-independent.
 */
function compareEducationByRecency(a: Education, b: Education): number {
  if (a.startDate !== b.startDate) {
    return a.startDate < b.startDate ? 1 : -1;
  }

  if (a.id === b.id) {
    return 0;
  }

  return a.id < b.id ? -1 : 1;
}

/**
 * The EducationSection's list: **every** education entry, ordered by
 * `startDate` descending — most recent first (Requirements 15.1, 15.2).
 *
 * ## Direction: reverse-chronological, and why it is stated this plainly
 *
 * Requirement 15.2 says "ordered by date" and Property 14 accepts either
 * direction ("non-decreasing (or non-increasing, per the chosen convention) by
 * `startDate`"), so the convention is pinned here rather than left to the
 * component: **descending**. Two reasons. A timeline of study reads like a
 * résumé, where the newest qualification is the one a visitor is looking for —
 * the in-progress M.Sc., not the secondary-school diploma. And it matches every
 * other date-ordered selector in this module
 * ({@link getAllPublishedBlogs}, {@link getHackathonsPreview},
 * {@link getFeaturedCertifications}), so "newest first" is a single convention
 * across the homepage instead of a per-section coin flip. Task 31.2's
 * `EducationSection` renders this array in order and adds no sorting of its own,
 * so the direction is decided in exactly one place.
 *
 * With the current dataset that resolves to
 * `lakeside-university-msc-software-engineering` (2023-09-01, ongoing),
 * `northfield-institute-bsc-computer-science` (2019-08-01),
 * `westbrook-secondary-school-diploma` (2017-06-01).
 * `data/education.ts` is deliberately **not** stored in this order — the B.Sc.
 * is written first — so the sort genuinely reorders and a forgotten sort changes
 * the observable output rather than failing silently.
 *
 * **Nothing is capped or filtered.** Education has no dedicated page and no
 * Explore More button, so the homepage section is the full list: the result
 * length always equals `getAllEducation().length`. Ongoing entries are included
 * on the same terms as completed ones; see {@link compareEducationByRecency} for
 * how a missing `endDate` is handled (it is never read).
 *
 * Consistent with the module contract: a fresh array per call whose elements are
 * the canonical `Education` records from {@link getAllEducation}, never clones.
 * `education` is never mutated — the sort runs on a copy.
 */
export function getEducationSortedByDate(): readonly Education[] {
  // `snapshot()` is deliberately not used here: its `readonly` return type
  // blocks the in-place `sort`. This copy is the fresh array the contract
  // requires, and `.sort` returns that same array.
  return [...education].sort(compareEducationByRecency);
}

/* -------------------------------------------------------------------------- */
/*                           Competitive programming                          */
/* -------------------------------------------------------------------------- */

/**
 * Every competitive-programming platform profile (LeetCode, Codeforces,
 * CodeChef), in dataset order.
 */
export function getAllCompetitiveProgrammingPlatforms(): readonly CompetitiveProgrammingPlatform[] {
  return snapshot(competitiveProgramming);
}

/* -------------------------------------------------------------------------- */
/*                                 Navigation                                 */
/* -------------------------------------------------------------------------- */

/**
 * Total order over Navbar links: `order` ascending, ties broken by `id`
 * ascending.
 *
 * Same reasoning as {@link compareFeaturedEntries}: `order` values in
 * `data/navigation.ts` are distinct today, so the tie-break never fires, but
 * without it two links sharing an `order` would fall back to array position and
 * the rendered link order would silently depend on how the data file happens to
 * be written. Ids are unique (`lib/validate-data.ts` enforces that), so this is
 * a *total* order and the sort has exactly one possible result — which is what
 * makes the selector deterministic (Property 19). Plain `<`/`>` rather than
 * `localeCompare` keeps it locale-independent.
 */
function compareNavigationItems(a: NavigationItem, b: NavigationItem): number {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  if (a.id === b.id) {
    return 0;
  }

  return a.id < b.id ? -1 : 1;
}

/**
 * The Navbar's link set: the `visible` entries of `data/navigation.ts`, ordered
 * by `order` ascending (Requirements 4.13, 5.1).
 *
 * `components/navbar/Navbar.tsx` renders exactly this array — it never hardcodes
 * anchors in JSX and never imports `data/navigation.ts` itself
 * (Requirement 4.2), so adding, reordering, or hiding a link is a data-only
 * change. With the current dataset that resolves to `Home (#hero)`,
 * `Projects (#projects)`, `Blog (#blog)`, `Certifications (#certifications)`,
 * `Hackathons (#hackathons)` — the five links Requirement 5.1 mandates. The
 * other four entries (`tech-stack`, `competitive-programming`, `education`,
 * `contact`) ship `visible: false` and are omitted here; flipping one on is all
 * it takes to add it to the Navbar.
 *
 * **Hidden items are filtered out, not merely unrendered.** The Navbar's active
 * link is resolved from the items it is handed
 * (`useActiveNavigationItemId(items)`), and that resolver only considers
 * `visible` items anyway, so filtering here means the Navbar and the highlight
 * agree by construction rather than by both remembering to check the flag.
 *
 * Consistent with the module contract: a fresh `readonly NavigationItem[]` per
 * call whose elements are the canonical records from `data/navigation.ts`, never
 * clones. `navigation` itself is never mutated — the filter produces the array
 * the sort runs on.
 */
export function getNavigationItems(): readonly NavigationItem[] {
  return snapshot(navigation)
    .filter((item) => item.visible)
    .sort(compareNavigationItems);
}

/* -------------------------------------------------------------------------- */
/*                                   Profile                                  */
/* -------------------------------------------------------------------------- */

/**
 * The developer's personal information: photo, name, role, bio, and the rest
 * of the fields `HeroSection`, `ContactSection`, and `Footer` read
 * (Requirements 4.1, 4.14).
 *
 * A single record, so per the module contract it returns the canonical object
 * from `data/profile.ts` rather than a copy — the same choice
 * {@link getSiteConfig} makes for the same reason.
 */
export function getProfile(): Profile {
  return profile;
}

/* -------------------------------------------------------------------------- */
/*                                   Socials                                  */
/* -------------------------------------------------------------------------- */

/**
 * Every social channel, one entry per known {@link SocialPlatform}
 * (Requirements 4.1, 4.14). `SocialLinks` renders one button per entry
 * regardless of `visible`, mapping `visible: false` to a disabled placeholder
 * rather than omitting the channel (Requirement 7.5, design.md Property 5).
 *
 * Consistent with the module contract: a fresh `readonly Social[]` on every
 * call whose elements are the canonical records from `data/socials.ts`, never
 * clones.
 */
export function getSocials(): readonly Social[] {
  return snapshot(socials);
}

/**
 * The canonical {@link Social} entry for a given platform, or `undefined` if
 * the dataset has none — never `null`, never a throw, matching every other
 * single-record selector in this module.
 *
 * `GitHubContributionCard` uses this to resolve the GitHub username without
 * importing `data/socials.ts` directly (Requirement 4.2).
 */
export function getSocialByPlatform(
  platform: Social["platform"],
): Social | undefined {
  return socials.find((social) => social.platform === platform);
}

/* -------------------------------------------------------------------------- */
/*                                    Site                                    */
/* -------------------------------------------------------------------------- */

/**
 * Global site configuration: identity, default SEO, theme defaults, analytics,
 * and the social preview image (Requirements 4.2, 4.15).
 *
 * Exists so `app/layout.tsx`'s `metadata`, and later `lib/seo.ts#buildMetadata`
 * plus `app/sitemap.ts` / `app/robots.ts`, read site fields through this module
 * instead of importing `data/site.ts` directly — the same single-entry-point
 * rule every other entity follows.
 *
 * A single record, so per the module contract it returns the canonical object
 * from `data/site.ts` rather than a copy. `SiteConfig` is a plain interface with
 * no `readonly` markers, so a caller *could* mutate it; that is unchanged from
 * importing the dataset directly, and the type is left as-is because
 * `types/site.ts` is the place to tighten it if that ever matters.
 */
export function getSiteConfig(): SiteConfig {
  return site;
}
