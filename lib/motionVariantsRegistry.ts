import type { Variants } from "motion/react";

import { THEME_ICON_VARIANTS } from "@/components/navbar/ThemeToggle";
import {
  REDUCED_REVEAL_VARIANTS,
  REVEAL_VARIANTS,
} from "@/components/shared/RevealOnView";

/**
 * Every Framer Motion variants object in the codebase, in one place, so
 * Property 21 (Requirement 24.4) can check all of them.
 *
 * ## Adding animation? Read this.
 *
 * When you declare a new `satisfies Variants` / `: Variants` constant anywhere
 * in `app/`, `components/`, `hooks/`, `lib/`, `sections/` or `utils/`, export it
 * and add an entry here. `lib/motionSafety.test.ts` scans the source tree and
 * fails if a declared variants object is missing from this registry (or if a
 * registry entry no longer exists), so new animation cannot quietly escape the
 * transform-safe check. It also fails on inline `variants={{ ... }}` literals,
 * which are unreachable from a test — name and export them instead.
 */
export interface RegisteredVariants {
  /** Repo-relative path, POSIX separators, e.g. `components/shared/RevealOnView.tsx`. */
  sourceFile: string;
  /** The exported identifier, matched against the source scan. */
  exportName: string;
  /** The real value, imported rather than restated so the test tracks the source. */
  variants: Variants;
}

export const MOTION_VARIANTS_REGISTRY: readonly RegisteredVariants[] = [
  {
    sourceFile: "components/shared/RevealOnView.tsx",
    exportName: "REVEAL_VARIANTS",
    variants: REVEAL_VARIANTS,
  },
  {
    sourceFile: "components/shared/RevealOnView.tsx",
    exportName: "REDUCED_REVEAL_VARIANTS",
    variants: REDUCED_REVEAL_VARIANTS,
  },
  {
    sourceFile: "components/navbar/ThemeToggle.tsx",
    exportName: "THEME_ICON_VARIANTS",
    variants: THEME_ICON_VARIANTS,
  },
];

/**
 * Identifiers that reach a `variants` prop indirectly, where the scan cannot
 * see which object is passed.
 *
 * Each entry has to name the registry exports it can resolve to, which keeps
 * the indirection honest: a future `variants={somethingElse}` is not covered by
 * these and fails the scan until it is either registered or listed here.
 */
export interface VariantsPropIndirection {
  /** The identifier as it appears in JSX, e.g. `variants={variants}`. */
  identifier: string;
  sourceFile: string;
  /** `exportName`s from the registry this identifier can hold at runtime. */
  resolvesTo: readonly string[];
}

export const VARIANTS_PROP_INDIRECTIONS: readonly VariantsPropIndirection[] = [
  {
    // `resolveRevealMotion(prefersReducedMotion).variants` — one of exactly two
    // registered objects (Property 22 pins that down).
    identifier: "variants",
    sourceFile: "components/shared/RevealOnView.tsx",
    resolvesTo: ["REVEAL_VARIANTS", "REDUCED_REVEAL_VARIANTS"],
  },
];

/** Stable `sourceFile#exportName` key used to compare registry against source. */
export function registryKey(entry: {
  sourceFile: string;
  exportName: string;
}): string {
  return `${entry.sourceFile}#${entry.exportName}`;
}
