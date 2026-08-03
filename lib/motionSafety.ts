import type { Variants } from "motion/react";

/**
 * The executable form of Requirement 24.4 for Framer Motion variants
 * (Animation_Guidelines §3): animate `opacity` and `transform` only, never a
 * layout- or paint-triggering property.
 *
 * Lives beside the motion tokens in `lib/motion.ts` because it belongs to the
 * same concern — how this project is allowed to animate — and so any later
 * animated component (theme-toggle crossfade, video overlay, project-detail
 * cross-fade) can reuse it instead of restating the rule.
 */

/**
 * Keys Framer Motion compiles into a single `transform`. Animating these never
 * invalidates layout: the compositor moves an already-painted layer.
 *
 * A superset of the `{x, y, scale}` named in Property 21 — the axis- and
 * origin-specific forms are the same compositor-only work, so they are allowed
 * rather than forcing a rewrite into the shorthand.
 */
export const TRANSFORM_STYLE_KEYS = [
  "x",
  "y",
  "z",
  "translateX",
  "translateY",
  "translateZ",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skew",
  "skewX",
  "skewY",
  "transformPerspective",
  "originX",
  "originY",
  "originZ",
] as const;

/**
 * The one non-transform style key that is still compositor-only: `opacity`
 * animates a layer's alpha without layout or repaint.
 */
export const COMPOSITED_STYLE_KEYS = ["opacity"] as const;

/**
 * Keys a variant may carry that are not styles at all. Framer Motion reads
 * `transition` out of a variant to time that state's animation, so it must be
 * tolerated even though it is not a transform.
 */
export const VARIANT_CONFIG_KEYS = ["transition"] as const;

/** Everything a variant is allowed to contain. */
export const TRANSFORM_SAFE_VARIANT_KEYS = [
  ...TRANSFORM_STYLE_KEYS,
  ...COMPOSITED_STYLE_KEYS,
  ...VARIANT_CONFIG_KEYS,
] as const;

/**
 * Style keys whose animation forces layout or a full repaint on every frame —
 * the properties Requirement 24.4 forbids outright (`width`, `height`, `top`,
 * `left`, `box-shadow`) plus the rest of the box-model family that fails for
 * the same reason.
 *
 * Kept disjoint from the safe list on purpose: the allow-list already rejects
 * anything unlisted, and this pool is what the property test draws from to
 * prove the rejection actually happens.
 */
export const LAYOUT_TRIGGERING_STYLE_KEYS = [
  "width",
  "height",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
  "top",
  "left",
  "right",
  "bottom",
  "inset",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "boxShadow",
  "borderWidth",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRadius",
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "flex",
  "flexBasis",
  "flexGrow",
  "gap",
  "rowGap",
  "columnGap",
  "gridTemplateColumns",
  "gridTemplateRows",
  "position",
  "display",
] as const;

export type TransformSafeVariantKey =
  (typeof TRANSFORM_SAFE_VARIANT_KEYS)[number];
export type LayoutTriggeringStyleKey =
  (typeof LAYOUT_TRIGGERING_STYLE_KEYS)[number];

const safeKeys: ReadonlySet<string> = new Set(TRANSFORM_SAFE_VARIANT_KEYS);
const layoutTriggeringKeys: ReadonlySet<string> = new Set(
  LAYOUT_TRIGGERING_STYLE_KEYS,
);

/** `true` only for keys a variant is allowed to contain (allow-list, not deny-list). */
export function isTransformSafeStyleKey(key: string): boolean {
  return safeKeys.has(key);
}

/** `true` for the layout/paint-expensive keys Requirement 24.4 names. */
export function isLayoutTriggeringStyleKey(key: string): boolean {
  return layoutTriggeringKeys.has(key);
}

/** One offending `(state, key)` pair inside a variants object. */
export interface UnsafeVariantKey {
  /** The variant name, e.g. `"hidden"`. */
  state: string;
  /** The rejected key, or a marker for a state that cannot be checked. */
  key: string;
  reason:
    "layout-triggering" | "not-transform-safe" | "not-statically-checkable";
}

/**
 * Every key in `variants` that is not transform-safe.
 *
 * Dynamic variants (a state defined as a resolver function) are reported as
 * `not-statically-checkable` rather than silently passing: a function's return
 * value cannot be inspected here, so it would be a hole in the guarantee.
 */
export function findUnsafeVariantKeys(
  variants: Variants,
): readonly UnsafeVariantKey[] {
  const violations: UnsafeVariantKey[] = [];

  for (const [state, definition] of Object.entries(variants)) {
    if (typeof definition === "function") {
      violations.push({
        state,
        key: "(dynamic variant function)",
        reason: "not-statically-checkable",
      });
      continue;
    }

    if (definition === undefined || definition === null) {
      continue;
    }

    for (const key of Object.keys(definition)) {
      if (isTransformSafeStyleKey(key)) {
        continue;
      }

      violations.push({
        state,
        key,
        reason: isLayoutTriggeringStyleKey(key)
          ? "layout-triggering"
          : "not-transform-safe",
      });
    }
  }

  return violations;
}

/** Throws a readable error listing every offending key. `label` names the source. */
export function assertTransformSafeVariants(
  variants: Variants,
  label = "variants",
): void {
  const violations = findUnsafeVariantKeys(variants);

  if (violations.length === 0) {
    return;
  }

  const details = violations
    .map(({ state, key, reason }) => `${state}.${key} (${reason})`)
    .join(", ");

  throw new Error(
    `${label} animates keys that are not transform-safe (Requirement 24.4): ${details}`,
  );
}
