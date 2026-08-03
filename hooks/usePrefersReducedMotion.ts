"use client";

import { useSyncExternalStore } from "react";

/** The media query that signals an explicit OS-level reduced-motion preference. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Collapses a raw media-query signal into a strictly binary preference.
 *
 * Requirement 24.5 only allows two outcomes: the visitor has explicitly asked
 * for reduced motion (`true`), or default animation behavior applies (`false`).
 * Anything else a host environment might hand back (`null`, `undefined`, a
 * missing `matchMedia`) resolves to `false` so visitors without an explicit
 * preference keep the default experience.
 */
export function resolvePrefersReducedMotion(
  signal: boolean | null | undefined,
): boolean {
  return signal === true;
}

function subscribe(onStoreChange: () => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", onStoreChange);

  return () => {
    mediaQueryList.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return resolvePrefersReducedMotion(undefined);
  }

  return resolvePrefersReducedMotion(
    window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );
}

function getServerSnapshot(): boolean {
  return resolvePrefersReducedMotion(undefined);
}

/**
 * Reads the visitor's `prefers-reduced-motion: reduce` preference.
 *
 * Backed by `useSyncExternalStore` rather than `useState` + `useEffect`: it
 * gives an explicit server snapshot (SSR-safe, no `window` access during server
 * render), reads the live value during hydration instead of flashing a default
 * for one paint, and handles subscription/cleanup for runtime preference
 * changes in one place. Always returns a plain boolean (Requirement 24.5).
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
