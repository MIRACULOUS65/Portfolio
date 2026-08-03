import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  LAYOUT_TRIGGERING_STYLE_KEYS,
  TRANSFORM_SAFE_VARIANT_KEYS,
  assertTransformSafeVariants,
  findUnsafeVariantKeys,
  isTransformSafeStyleKey,
} from "@/lib/motionSafety";
import {
  MOTION_VARIANTS_REGISTRY,
  VARIANTS_PROP_INDIRECTIONS,
  registryKey,
} from "@/lib/motionVariantsRegistry";

const NUM_RUNS = 100;

/* -------------------------------------------------------------------------- */
/* Generators                                                                 */
/* -------------------------------------------------------------------------- */

const arbitrarySafeKey = fc.constantFrom(...TRANSFORM_SAFE_VARIANT_KEYS);
const arbitraryForbiddenKey = fc.constantFrom(...LAYOUT_TRIGGERING_STYLE_KEYS);

/** Values Framer Motion accepts for a style key. The property is about keys, not values. */
const arbitraryStyleValue = fc.oneof(
  fc.double({ min: -500, max: 500, noNaN: true }),
  fc.constantFrom("100%", "50vh", "12px", "-1rem"),
);

/** Variant names as they actually appear: reveal states, gesture states, custom labels. */
const arbitraryStateName = fc.constantFrom(
  "hidden",
  "visible",
  "initial",
  "animate",
  "exit",
  "hover",
  "tap",
  "rest",
);

const arbitrarySafeVariant = fc.dictionary(
  arbitrarySafeKey,
  arbitraryStyleValue,
  { minKeys: 1, maxKeys: 6 },
);

const arbitrarySafeVariants = fc.dictionary(
  arbitraryStateName,
  arbitrarySafeVariant,
  { minKeys: 1, maxKeys: 5 },
);

/* -------------------------------------------------------------------------- */
/* Source scan — the exhaustiveness guard behind the registry                 */
/* -------------------------------------------------------------------------- */

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");

/** Directories that can contain animated code. */
const SCANNED_DIRECTORIES = [
  "app",
  "components",
  "data",
  "hooks",
  "lib",
  "sections",
  "types",
  "utils",
];

/** `const NAME: Variants = ...` */
const ANNOTATED_VARIANTS =
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*:\s*Variants\b/g;

/**
 * `const NAME = { ... } satisfies Variants`. The `const`-blocking lookahead
 * stops the match from spanning an earlier declaration, so the captured name is
 * always the one the `satisfies` belongs to.
 */
const SATISFIES_VARIANTS =
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:(?!\b(?:const|let|var)\b)[\s\S])*?\bsatisfies\s+Variants\b/g;

/** `variants={{ ... }}` — an object literal no test can reach. */
const INLINE_VARIANTS_PROP = /\bvariants=\{\{/g;

/** `variants={identifier}` */
const VARIANTS_PROP_IDENTIFIER = /\bvariants=\{([A-Za-z_$][\w$]*)\}/g;

interface SourceFile {
  /** Repo-relative, POSIX separators. */
  relativePath: string;
  /** Comments removed — the scan is about code, and doc comments in this file
   * and in the registry legitimately quote the patterns being searched for. */
  contents: string;
}

/** Drops block and line comments. `(?<!:)` keeps `https://` URLs intact. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(?<!:)\/\/.*$/gm, "");
}

function collectSourceFiles(): readonly SourceFile[] {
  const files: SourceFile[] = [];

  for (const directory of SCANNED_DIRECTORIES) {
    const absoluteDirectory = path.join(PROJECT_ROOT, directory);
    let entries: string[];

    try {
      entries = readdirSync(absoluteDirectory, { recursive: true }) as string[];
    } catch {
      continue; // Directory not created yet.
    }

    for (const entry of entries) {
      const relativePath = path
        .join(directory, entry)
        .split(path.sep)
        .join("/");

      if (!/\.tsx?$/.test(relativePath) || /\.test\.tsx?$/.test(relativePath)) {
        continue;
      }

      files.push({
        relativePath,
        contents: stripComments(
          readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8"),
        ),
      });
    }
  }

  return files;
}

const sourceFiles = collectSourceFiles();

function matchAll(pattern: RegExp, contents: string): string[] {
  return [...contents.matchAll(new RegExp(pattern.source, pattern.flags))].map(
    (match) => match[1],
  );
}

/** Every variants object declared in the source tree, as `file#exportName`. */
function scanDeclaredVariants(): readonly string[] {
  return sourceFiles.flatMap(({ relativePath, contents }) =>
    [
      ...matchAll(ANNOTATED_VARIANTS, contents),
      ...matchAll(SATISFIES_VARIANTS, contents),
    ].map((exportName) =>
      registryKey({ sourceFile: relativePath, exportName }),
    ),
  );
}

function scanInlineVariantsProps(): readonly string[] {
  return sourceFiles
    .filter(({ contents }) =>
      new RegExp(INLINE_VARIANTS_PROP.source).test(contents),
    )
    .map(({ relativePath }) => relativePath);
}

function scanVariantsPropIdentifiers(): readonly {
  relativePath: string;
  identifier: string;
}[] {
  return sourceFiles.flatMap(({ relativePath, contents }) =>
    matchAll(VARIANTS_PROP_IDENTIFIER, contents).map((identifier) => ({
      relativePath,
      identifier,
    })),
  );
}

// Feature: developer-portfolio, Property 21: Animation variants touch only
// transform-safe properties
//
// For any Framer Motion variant object used across the animated components in
// this design (reveal, hover, Featured Projects cross-fade), the set of style
// keys present in the variant is a subset of `{opacity, x, y, scale}` and never
// includes a layout-triggering property (`width`, `height`, `top`, `left`,
// `boxShadow`).
//
// **Validates: Requirements 24.4**
describe("Property 21: animation variants touch only transform-safe properties", () => {
  describe("the validator", () => {
    it("accepts every transform-safe key", () => {
      fc.assert(
        fc.property(arbitrarySafeKey, (key) => {
          expect(isTransformSafeStyleKey(key)).toBe(true);
        }),
        { numRuns: NUM_RUNS },
      );
    });

    it("rejects every layout-triggering key", () => {
      fc.assert(
        fc.property(arbitraryForbiddenKey, (key) => {
          expect(isTransformSafeStyleKey(key)).toBe(false);
        }),
        { numRuns: NUM_RUNS },
      );
    });

    it("reports no violations for variants built only from safe keys", () => {
      fc.assert(
        fc.property(arbitrarySafeVariants, (variants) => {
          expect(findUnsafeVariantKeys(variants)).toEqual([]);
        }),
        { numRuns: NUM_RUNS },
      );
    });

    it("reports the offending state and key when a forbidden key is injected", () => {
      fc.assert(
        fc.property(
          arbitrarySafeVariants,
          arbitraryStateName,
          arbitraryForbiddenKey,
          arbitraryStyleValue,
          (variants, state, forbiddenKey, value) => {
            const polluted = {
              ...variants,
              [state]: { ...variants[state], [forbiddenKey]: value },
            };

            expect(findUnsafeVariantKeys(polluted)).toEqual([
              { state, key: forbiddenKey, reason: "layout-triggering" },
            ]);
            expect(() => assertTransformSafeVariants(polluted)).toThrow(
              forbiddenKey,
            );
          },
        ),
        { numRuns: NUM_RUNS },
      );
    });

    it("draws its safe and forbidden pools from disjoint sets", () => {
      const overlap = LAYOUT_TRIGGERING_STYLE_KEYS.filter((key) =>
        (TRANSFORM_SAFE_VARIANT_KEYS as readonly string[]).includes(key),
      );

      expect(overlap).toEqual([]);
    });
  });

  describe("every variants object in the codebase", () => {
    it("has at least one registered variants object to check", () => {
      expect(MOTION_VARIANTS_REGISTRY.length).toBeGreaterThan(0);
    });

    it.each(
      MOTION_VARIANTS_REGISTRY.map((entry) => [registryKey(entry), entry]),
    )("%s animates only transform-safe keys", (_label, entry) => {
      const registered = entry as (typeof MOTION_VARIANTS_REGISTRY)[number];

      expect(findUnsafeVariantKeys(registered.variants)).toEqual([]);
      expect(() =>
        assertTransformSafeVariants(
          registered.variants,
          registryKey(registered),
        ),
      ).not.toThrow();
    });

    it("never animates a layout-triggering property", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MOTION_VARIANTS_REGISTRY),
          fc.constantFrom(...LAYOUT_TRIGGERING_STYLE_KEYS),
          (entry, forbiddenKey) => {
            for (const definition of Object.values(entry.variants)) {
              expect(Object.keys(definition ?? {})).not.toContain(forbiddenKey);
            }
          },
        ),
        { numRuns: NUM_RUNS },
      );
    });
  });

  describe("the registry is exhaustive against the source tree", () => {
    it("scans a non-empty set of source files", () => {
      expect(sourceFiles.length).toBeGreaterThan(0);
    });

    it("covers every variants object declared in the source tree", () => {
      const declared = [...new Set(scanDeclaredVariants())].sort();
      const registered = [
        ...new Set(MOTION_VARIANTS_REGISTRY.map(registryKey)),
      ].sort();

      // Left over: declared but unregistered — add it to
      // `lib/motionVariantsRegistry.ts`. Right over: registered but gone —
      // remove the stale entry.
      expect(declared).toEqual(registered);
    });

    it("has no inline variants={{ ... }} literals, which a test cannot reach", () => {
      expect(scanInlineVariantsProps()).toEqual([]);
    });

    it("passes only registered or documented identifiers to a variants prop", () => {
      const known = new Set([
        ...MOTION_VARIANTS_REGISTRY.map((entry) => entry.exportName),
        ...VARIANTS_PROP_INDIRECTIONS.map((entry) => entry.identifier),
      ]);

      const unknown = scanVariantsPropIdentifiers().filter(
        ({ identifier }) => !known.has(identifier),
      );

      expect(unknown).toEqual([]);
    });

    it("resolves every documented indirection to registered variants", () => {
      const registered = new Set(
        MOTION_VARIANTS_REGISTRY.map((entry) => entry.exportName),
      );

      for (const indirection of VARIANTS_PROP_INDIRECTIONS) {
        expect(indirection.resolvesTo.length).toBeGreaterThan(0);

        for (const exportName of indirection.resolvesTo) {
          expect(registered.has(exportName)).toBe(true);
        }
      }
    });
  });
});
