/**
 * Keeps the `portfolio-theme` storage slot holding a value `next-themes` can
 * safely use (Requirements 3.2, 3.4).
 *
 * ## Why this module exists
 *
 * `next-themes` trusts the storage slot completely. It reads it raw
 * (`localStorage.getItem(key) || defaultTheme`) and applies the result as a
 * class on `<html>` without checking it against the configured `themes` list.
 * Anything can end up in that slot — a hand-edit in devtools, a browser
 * extension, an older build of this site, another app on the same origin — and
 * two failure modes follow:
 *
 * - **A class-illegal value** such as `"dark "` or `"dark\n"` makes
 *   `classList.add` throw `InvalidCharacterError`. In the React stage that
 *   throw happens inside the provider's own effect, so the theme provider fails
 *   to mount and takes the tree with it.
 * - **A class-legal but non-theme value** such as `"system"` is added to
 *   `<html>` verbatim. `hooks/useTheme.ts` still reports `"dark"` (it passes the
 *   raw value through `resolveTheme`), so the reported theme and the applied
 *   class silently disagree and neither `.dark` nor `.light` token block in
 *   `styles/globals.css` matches.
 *
 * `resolveTheme` in `./theme.ts` already rejects junk, but it never gets a say:
 * `next-themes` reads the slot before any of our code sees it. So the fix is to
 * make the slot itself trustworthy — sanitise it *ahead of* every read
 * `next-themes` performs, at both stages that read it:
 *
 * 1. **Pre-paint.** `next-themes` injects a blocking inline script that sets the
 *    class before first paint (that is what prevents the flash, Requirement
 *    3.4). `THEME_SANITIZER_SCRIPT` below is rendered by `ThemeProvider`
 *    immediately before that script, so it runs first, in the same parse-blocking
 *    position, and converges the slot before `next-themes` ever reads it.
 * 2. **React.** `sanitizeStoredTheme()` is called during `ThemeProvider`'s own
 *    render body, which runs before React renders `NextThemesProvider` and
 *    therefore before that component's `useState` initialiser reads the slot.
 *    This is the stage that matters for client-side navigation, hydration, and
 *    tests (a script injected via `dangerouslySetInnerHTML` never executes when
 *    the tree is rendered client-side only).
 *
 * `installStoredThemeGuard()` covers the one remaining read: the `storage` event
 * `next-themes` listens for, which carries a value written by *another tab* and
 * so cannot be pre-sanitised in storage.
 *
 * ## Deliberate non-goals
 *
 * No trimming, no case folding. `"dark "` and `"DARK"` resolve to
 * `DEFAULT_THEME`, not to `"dark"`, because `./theme.ts#resolveTheme` is the one
 * shared rule used by the provider, the hook, and the tests — a provider that
 * quietly accepted near-misses would disagree with the hook that reports the
 * theme. The visible outcome for an unusable value is the mandated dark default
 * either way (Requirement 3.2).
 *
 * Browser-only, and never throws: every `localStorage` access is guarded, so a
 * blocked storage API (private mode, cookie-blocking settings) degrades to the
 * default theme instead of breaking the page. Kept out of `./theme.ts` so that
 * module stays pure and free of browser access.
 */

import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  isTheme,
  resolveTheme,
  type Theme,
} from "./theme";

/**
 * The raw contents of the storage slot, or `null` when the key was never
 * written or `localStorage` is unavailable.
 *
 * Returns the value verbatim — untrimmed, un-normalised — because callers need
 * to compare it against `resolveTheme` to decide whether it must be rewritten.
 */
export function readStoredTheme(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Rewrites the storage slot to a supported theme when it holds anything else,
 * and returns the theme now in effect.
 *
 * - An absent key is left absent: "no explicit selection yet" is a valid state
 *   that must keep resolving to `DEFAULT_THEME` on its own (Requirement 3.2),
 *   and writing a value there would fake a selection the visitor never made.
 * - A stored `"dark"`/`"light"` is left exactly as it is, so an explicit
 *   selection survives reloads untouched (Requirement 3.3).
 * - Anything else is replaced by `resolveTheme`'s answer, so the slot converges
 *   to a value that is both class-legal and one of `THEMES`.
 *
 * Idempotent: a second call changes nothing, which is what makes it safe to call
 * from a render body that React may replay.
 */
export function sanitizeStoredTheme(): Theme {
  const raw = readStoredTheme();

  if (raw === null) return DEFAULT_THEME;

  const resolved = resolveTheme(raw);

  if (raw !== resolved) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, resolved);
    } catch {
      // Storage is readable but not writable (quota, private mode). The value
      // stays corrupted, so `next-themes` may still see it — the `value` map on
      // `ThemeProvider` is the backstop that keeps that from throwing.
    }
  }

  return resolved;
}

/**
 * Source of the blocking inline script that sanitises the slot before first
 * paint (Requirement 3.4).
 *
 * Built from the shared constants rather than hardcoded literals so the script
 * cannot drift from `THEMES` / `DEFAULT_THEME` / `THEME_STORAGE_KEY`. Kept to
 * one expression, with its own `try`/`catch`, because it runs while the parser
 * is blocked: it must never throw and never take measurable time.
 *
 * It intentionally mirrors `sanitizeStoredTheme()` and nothing more — it does
 * not apply a class. Applying the class stays with `next-themes`' own script,
 * which runs immediately after this one and now reads a trustworthy value.
 */
export const THEME_SANITIZER_SCRIPT = `(function(){try{var s=window.localStorage,k=${JSON.stringify(
  THEME_STORAGE_KEY,
)},t=${JSON.stringify(THEMES)},v=s.getItem(k);if(v!==null&&t.indexOf(v)===-1){s.setItem(k,${JSON.stringify(
  DEFAULT_THEME,
)})}}catch(e){}})();`;

let guardInstalled = false;

/**
 * Intercepts a corrupted value written to the slot by another tab.
 *
 * `next-themes` listens for `storage` events and feeds `event.newValue` straight
 * into its theme state, so a foreign tab writing `"dark "` reaches
 * `classList.add` even though storage is sanitised on read. The event carries
 * its own snapshot of the value, so this listener stops the corrupted event
 * before `next-themes` sees it, converges storage, and re-dispatches the event
 * with the resolved value so `next-themes` still updates — just to a theme that
 * exists.
 */
function handleForeignThemeWrite(event: StorageEvent): void {
  if (event.key !== THEME_STORAGE_KEY) return;

  const raw = event.newValue;

  // `null` means another tab cleared the key; `next-themes` handles that by
  // falling back to `defaultTheme`, which is already the required behaviour.
  if (raw === null || isTheme(raw)) return;

  // Registered before `next-themes`' own listener (see `installStoredThemeGuard`),
  // so this prevents that listener from ever seeing the corrupted value.
  event.stopImmediatePropagation();

  const resolved = resolveTheme(raw);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, resolved);
  } catch {
    // See `sanitizeStoredTheme`: the re-dispatch below still corrects the
    // in-memory theme even when the write is refused.
  }

  // Terminates: the replacement value is a valid theme, so this listener returns
  // early when it receives its own event.
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: THEME_STORAGE_KEY,
      oldValue: event.oldValue,
      newValue: resolved,
      storageArea: event.storageArea,
      url: event.url,
    }),
  );
}

/**
 * Installs the cross-tab guard. Idempotent, and a no-op on the server.
 *
 * Must be called from `ThemeProvider`'s render body, not an effect: listeners
 * fire in registration order, and a child's effects run before its parent's, so
 * an effect here would register *after* `next-themes`' listener and lose the
 * race. Never uninstalled in the app — it is a document-lifetime guard with no
 * per-mount state.
 */
export function installStoredThemeGuard(): void {
  if (guardInstalled || typeof window === "undefined") return;

  guardInstalled = true;
  window.addEventListener("storage", handleForeignThemeWrite);
}

/** Removes the cross-tab guard. Exists for test isolation. */
export function uninstallStoredThemeGuard(): void {
  if (!guardInstalled || typeof window === "undefined") return;

  guardInstalled = false;
  window.removeEventListener("storage", handleForeignThemeWrite);
}
