"use client";

import { useEffect, useRef } from "react";

import {
  resolveScrollBehavior,
  scrollToSection,
} from "@/components/navbar/Navbar";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Reproduces the Navbar's smooth-scroll behavior across a full navigation
 * (Requirement 5.9, design.md "Scroll-to-Section from Dedicated Pages").
 *
 * ## Why this exists
 *
 * A Navbar link clicked on the Homepage scrolls without a route change
 * (`NavbarLink` in `components/navbar/Navbar.tsx`), but a link clicked on a
 * dedicated page (e.g. `/projects`) pushes `/#section-id` instead — there is no
 * homepage section in the DOM yet to scroll to. That push performs a full
 * navigation to `/`, so the scroll has to happen again, this time *after* the
 * Homepage's own initial paint. This component is that second half: it reads
 * `window.location.hash` once on mount and finishes the job `NavbarLink`
 * started.
 *
 * ## Why a dedicated Client Component rather than an effect on `app/page.tsx`
 *
 * `app/page.tsx` composes the Homepage's `Section`s as a Server Component
 * (Requirement 1.9) — reading `window` and scheduling a `requestAnimationFrame`
 * both require the browser, so that logic needs its own Client boundary. This
 * component is deliberately as thin as one can be: no visual output (`null`),
 * no props, a single effect. Rendering it anywhere inside the Homepage tree is
 * sufficient; it does not need to wrap or sit near any particular section.
 *
 * ## Why `requestAnimationFrame` rather than scrolling synchronously
 *
 * The Homepage's sections (Hero, Featured Projects, ...) are still laying out
 * on the frame this component mounts, so a synchronous `scrollIntoView` call
 * could measure a target that has not settled into its final position yet.
 * Deferring one frame (matching the pattern `MobileNavDrawer` already uses for
 * its own deferred scroll) waits for that layout pass to flush first.
 * `requestAnimationFrame` is feature-detected because it is not guaranteed by
 * every test environment; the scroll still happens synchronously as a
 * fallback rather than being dropped.
 *
 * ## Reusing the Navbar's own scroll primitives
 *
 * `scrollToSection` and `resolveScrollBehavior` are the exact functions
 * `NavbarLink` uses for an on-page scroll, so "instant vs. smooth" under
 * `prefers-reduced-motion: reduce` (Requirement 24.5) and "no-op when the
 * target section does not exist" both stay defined in exactly one place rather
 * than being reimplemented here and risking drift.
 *
 * The reduced-motion preference is captured once, into a ref initialised on
 * the first render, rather than taken as a `useEffect` dependency: this effect
 * is meant to run exactly once, for the hash present at mount, and a later
 * OS-level preference change should not re-trigger a scroll to a target the
 * visitor may have already scrolled away from. The ref is only ever read
 * inside the effect/event-handler closure below, never written during render,
 * so it stays within the read-only-during-render rule `useRef` values are
 * subject to.
 */
export function HashScrollRestoration() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const prefersReducedMotionRef = useRef(prefersReducedMotion);

  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sectionId = window.location.hash.replace(/^#/, "");

    if (sectionId === "") {
      return;
    }

    const scroll = () => {
      scrollToSection(
        sectionId,
        resolveScrollBehavior(prefersReducedMotionRef.current),
      );
    };

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(scroll);

      return;
    }

    scroll();
    // Deliberately empty: this effect targets the hash present at the moment
    // of mount only (see the ref note above); `prefersReducedMotion` changing
    // later must not re-run it.
  }, []);

  return null;
}
