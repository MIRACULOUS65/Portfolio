/**
 * Pure helpers backing `EmptyState` and `ErrorState`.
 *
 * These live in their own dependency-free module so the two invariants below
 * are decided by data, not by JSX, and can be exercised directly by the
 * property test for Property 26 (Requirements 28.2, 28.3).
 *
 * INVARIANT A — exactly one Homepage link (Requirement 28.3):
 *   `resolveStateLinks` always returns exactly one entry with `isHome: true`,
 *   for every possible input, and the components render one anchor per returned
 *   entry. Callers cannot add a second Homepage link because `action` is
 *   structured data (`{ href, label }`), never a `ReactNode`, and any action
 *   whose href resolves to the Homepage is dropped.
 *
 * INVARIANT B — no raw error leakage (Requirement 28.2):
 *   `resolveErrorCopy` ignores its argument entirely and returns fixed friendly
 *   copy, so no error message, cause, or stack text can reach the DOM through
 *   it.
 */

/** Route of the Homepage. Single source of truth for the fallback link. */
export const HOME_HREF = "/";

/** Descriptive link text (never "click here" — Requirement 26 wording rules). */
export const HOME_LINK_LABEL = "Back to Homepage";

/** Optional secondary call to action offered alongside the Homepage link. */
export interface StateAction {
  /** Destination route. Homepage targets are ignored (see INVARIANT A). */
  href: string;
  /** Descriptive, self-explanatory link text. */
  label: string;
}

/** A link the state component should render, in render order. */
export interface StateLink {
  href: string;
  label: string;
  /** True for the single guaranteed Homepage link. */
  isHome: boolean;
}

/** Fixed, visitor-safe error copy. Never derived from a thrown value. */
export const ERROR_FALLBACK_COPY = {
  title: "Something went wrong",
  message:
    "This section could not be displayed. Nothing is broken on your end — you can head back to the Homepage and keep browsing.",
} as const;

/**
 * Normalizes an href down to its path, dropping the query string, the fragment
 * and any trailing slashes, so `/`, `/#top`, `//`, and `/?q=1` all collapse to
 * the empty string.
 */
function normalizePath(href: string): string {
  const [pathOnly = ""] = href.trim().split(/[?#]/);
  return pathOnly.replace(/\/+$/, "");
}

/**
 * True when `href` points at the Homepage (or at nothing but a fragment of the
 * current document, which is never a useful escape hatch in a fallback view).
 *
 * Deliberately conservative: anything that might be the Homepage counts as the
 * Homepage, so the "exactly one Homepage link" invariant can never be broken by
 * an ambiguous caller href.
 */
export function isHomeHref(href: string): boolean {
  if (typeof href !== "string") return false;
  const path = normalizePath(href);
  if (path === "") return true;
  return path === HOME_HREF;
}

/**
 * Decides the full set of links an empty/error state renders.
 *
 * Returns the optional caller action first (primary emphasis) and the Homepage
 * link last. Exactly one `isHome: true` entry is present in every result, and
 * an action that would duplicate it is discarded.
 */
export function resolveStateLinks(action?: StateAction): StateLink[] {
  const homeLink: StateLink = {
    href: HOME_HREF,
    label: HOME_LINK_LABEL,
    isHome: true,
  };

  if (!action) return [homeLink];

  const href = typeof action.href === "string" ? action.href.trim() : "";
  const label = typeof action.label === "string" ? action.label.trim() : "";

  if (href === "" || label === "" || isHomeHref(href)) return [homeLink];

  return [{ href, label, isHome: false }, homeLink];
}

/**
 * Maps any thrown value to the fixed friendly copy shown to visitors.
 *
 * The parameter exists purely so `error.tsx` boundaries read naturally; its
 * value is never inspected, so raw messages and stack traces cannot leak into
 * the render (Requirement 28.2). Boundaries that want the details should log
 * them with `console.error` instead.
 */
export function resolveErrorCopy(
  // The unused parameter is the point: accepting the thrown value while never
  // reading it is what makes leakage impossible at the type level.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _error?: unknown,
): { title: string; message: string } {
  return {
    title: ERROR_FALLBACK_COPY.title,
    message: ERROR_FALLBACK_COPY.message,
  };
}
