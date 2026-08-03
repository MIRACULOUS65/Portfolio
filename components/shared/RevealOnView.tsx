"use client";

import { useEffect, useReducer, useRef, type ReactNode } from "react";
import { motion, useInView } from "motion/react";
import type { Transition, UseInViewOptions, Variants } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DURATION, EASING } from "@/lib/motion";

/**
 * The two states of a scroll reveal. There is no "leaving" state on purpose:
 * a reveal happens once and is never undone (Requirement 24.3).
 */
export type RevealState = "hidden" | "visible";

/** Where every reveal starts, on the server and on the client. */
export const INITIAL_REVEAL_STATE: RevealState = "hidden";

/**
 * The reveal state machine, as a pure function of `(state, isIntersecting)`.
 *
 * Exported and kept free of React so the "reveals exactly once" guarantee can
 * be exercised against arbitrary enter/exit/re-enter sequences without a real
 * `IntersectionObserver` (Property 20). Two rules, both intentional:
 *
 * - `visible` is absorbing — once revealed, no later event (including an exit)
 *   can return the element to `hidden`.
 * - from `hidden`, only an intersecting event reveals; a non-intersecting event
 *   is a no-op.
 *
 * The signature matches `useReducer`'s `(state, action)` contract, so the
 * component below drives its animation through this exact function rather than
 * a parallel copy of the logic.
 */
export function nextRevealState(
  state: RevealState,
  isIntersecting: boolean,
): RevealState {
  if (state === "visible") {
    return "visible";
  }

  return isIntersecting ? "visible" : "hidden";
}

/**
 * Viewport options for the underlying `IntersectionObserver`.
 *
 * `once: true` makes Framer Motion detach the observer after the first
 * intersection (Requirement 24.3 — the reveal must not re-trigger); `amount`
 * requires ~20% of the element to be visible so tall sections do not reveal
 * while still mostly off-screen.
 */
export const REVEAL_VIEWPORT = {
  once: true,
  amount: 0.2,
} as const satisfies UseInViewOptions;

/**
 * The default reveal: fade in with a slight upward movement
 * (Requirement 24.3, Animation_Guidelines §7).
 *
 * Only `opacity` and `y` (a `transform`) appear here. No layout-triggering key
 * (`width`, `height`, `top`, `left`, `boxShadow`, margin, padding) is animated
 * anywhere in this file — Requirement 24.4, statically checked by Property 21,
 * which is why this object is exported.
 */
export const REVEAL_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
} satisfies Variants;

/**
 * The reduced-motion reveal: the same two states with the translation removed,
 * so nothing moves (Requirement 24.5).
 */
export const REDUCED_REVEAL_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} satisfies Variants;

/** Entrance timing from the shared tokens, never inline numbers (Requirement 24.2). */
export const REVEAL_TRANSITION: Transition = {
  duration: DURATION.slow,
  ease: EASING.out,
};

/** `duration: 0` — the reduced-motion reveal is an instant opacity change. */
export const REDUCED_REVEAL_TRANSITION: Transition = { duration: 0 };

/** A complete, self-consistent reveal animation configuration. */
export type RevealMotionConfig = {
  variants: Variants;
  transition: Transition;
};

/** Full-motion configuration: fade + 16px rise over `DURATION.slow`. */
export const DEFAULT_REVEAL_MOTION: RevealMotionConfig = {
  variants: REVEAL_VARIANTS,
  transition: REVEAL_TRANSITION,
};

/** Reduced-motion configuration: opacity only, no duration. */
export const REDUCED_REVEAL_MOTION: RevealMotionConfig = {
  variants: REDUCED_REVEAL_VARIANTS,
  transition: REDUCED_REVEAL_TRANSITION,
};

/**
 * Maps the binary reduced-motion signal onto one of exactly two predefined
 * configurations (Requirement 24.5, Property 22).
 *
 * Deliberately returns whole config objects instead of merging or overriding
 * individual fields, so a partially-reduced third configuration cannot exist.
 */
export function resolveRevealMotion(
  prefersReducedMotion: boolean,
): RevealMotionConfig {
  return prefersReducedMotion ? REDUCED_REVEAL_MOTION : DEFAULT_REVEAL_MOTION;
}

export interface RevealOnViewProps {
  children: ReactNode;
  /** Utilities applied to the wrapper. It carries no classes of its own. */
  className?: string;
  /** Anchor target id, for wrappers that sit directly inside a linked section. */
  id?: string;
}

/**
 * Reveals its children once, the first time they scroll into view
 * (Requirement 24.3, Animation_Guidelines §7).
 *
 * Client Component — it owns an `IntersectionObserver` (through Framer Motion's
 * `useInView`) and reads the visitor's motion preference, both of which need the
 * browser. It stays deliberately thin: a wrapper `div` plus animation props, so
 * the sections it wraps can remain Server Components (Requirement 27.5).
 *
 * ## Why `useInView` + `animate` instead of `whileInView`
 *
 * `whileInView` would reach the same visual result, but the reveal decision
 * would live inside Framer Motion where it cannot be tested. Here the raw
 * intersection boolean is fed into `nextRevealState`, a pure exported reducer,
 * and the animation target is whatever that reducer returns. The "exactly once"
 * guarantee is therefore enforced twice over: `REVEAL_VIEWPORT.once` stops
 * observing after the first intersection, and `visible` is an absorbing state,
 * so even a stray `false` from another environment cannot un-reveal the
 * element.
 *
 * Under `prefers-reduced-motion: reduce` the whole configuration is swapped for
 * the reduced one — opacity only, `duration: 0` — so the content appears
 * instantly with no movement (Requirement 24.5). Visitors without an explicit
 * preference keep the default reveal untouched.
 *
 * Renders a plain `div`; semantic elements (`section`, `article`) belong to the
 * callers that compose it, which keeps the animated node free of meaning.
 */
export function RevealOnView({ children, className, id }: RevealOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isIntersecting = useInView(ref, REVEAL_VIEWPORT);
  const [state, observeIntersection] = useReducer(
    nextRevealState,
    INITIAL_REVEAL_STATE,
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const { variants, transition } = resolveRevealMotion(prefersReducedMotion);

  useEffect(() => {
    observeIntersection(isIntersecting);
  }, [isIntersecting]);

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      data-slot="reveal-on-view"
      data-reveal-state={state}
      initial={INITIAL_REVEAL_STATE}
      animate={state}
      variants={variants}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
