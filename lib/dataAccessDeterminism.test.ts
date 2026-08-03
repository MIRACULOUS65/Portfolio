import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { blogs } from "@/data/blogs";
import { certifications } from "@/data/certifications";
import { competitiveProgramming } from "@/data/competitive-programming";
import { education } from "@/data/education";
import { hackathons } from "@/data/hackathons";
import { projects } from "@/data/projects";
import { technologies } from "@/data/technologies";
import {
  getAllBlogs,
  getAllCertifications,
  getAllCompetitiveProgrammingPlatforms,
  getAllEducation,
  getAllHackathons,
  getAllProjects,
  getAllTechnologies,
  getBlogBySlug,
  getProjectById,
  getProjectBySlug,
  getTechnologyById,
} from "@/lib/data-access";

const NUM_RUNS = 100;

/**
 * Property 19 for `lib/data-access.ts`. The contract this file asserts against
 * is the one documented in that module's header, so the two do not drift:
 *
 * - Collection selectors hand back a **fresh** `readonly T[]` each call, so
 *   `toEqual` always holds across calls and `toBe` never does. Array identity is
 *   explicitly not part of determinism; deep equality is.
 * - The elements inside that array are the canonical `data/` records, so a
 *   resolved id reference is identical (`toBe`) to the collection entry.
 * - Single-record lookups return the canonical record, so both `toEqual` and
 *   `toBe` hold across repeated calls with the same key; a miss is `undefined`,
 *   never `null` and never a throw.
 *
 * Example-based coverage of the same selectors lives in `data-access.test.ts`.
 * `getFeaturedProjectsResolved` (named in the property statement) is covered by
 * its own derived-selector task once it lands.
 */

/* -------------------------------------------------------------------------- */
/*                            Selectors under test                            */
/* -------------------------------------------------------------------------- */

type CollectionSpec = {
  readonly name: string;
  readonly select: () => readonly unknown[];
  readonly dataset: readonly unknown[];
};

type LookupSpec = {
  readonly name: string;
  readonly select: (key: string) => unknown;
  readonly dataset: readonly unknown[];
  readonly validKeys: readonly string[];
};

const COLLECTION_SPECS: readonly CollectionSpec[] = [
  { name: "getAllProjects", select: getAllProjects, dataset: projects },
  {
    name: "getAllTechnologies",
    select: getAllTechnologies,
    dataset: technologies,
  },
  { name: "getAllBlogs", select: getAllBlogs, dataset: blogs },
  {
    name: "getAllCertifications",
    select: getAllCertifications,
    dataset: certifications,
  },
  { name: "getAllHackathons", select: getAllHackathons, dataset: hackathons },
  { name: "getAllEducation", select: getAllEducation, dataset: education },
  {
    name: "getAllCompetitiveProgrammingPlatforms",
    select: getAllCompetitiveProgrammingPlatforms,
    dataset: competitiveProgramming,
  },
];

const LOOKUP_SPECS: readonly LookupSpec[] = [
  {
    name: "getProjectById",
    select: getProjectById,
    dataset: projects,
    validKeys: projects.map((project) => project.id),
  },
  {
    name: "getProjectBySlug",
    select: getProjectBySlug,
    dataset: projects,
    validKeys: projects.map((project) => project.slug),
  },
  {
    name: "getTechnologyById",
    select: getTechnologyById,
    dataset: technologies,
    validKeys: technologies.map((technology) => technology.id),
  },
  {
    name: "getBlogBySlug",
    select: getBlogBySlug,
    dataset: blogs,
    validKeys: blogs.map((blog) => blog.slug),
  },
];

const COLLECTION_BY_NAME = new Map(
  COLLECTION_SPECS.map((spec) => [spec.name, spec]),
);
const LOOKUP_BY_NAME = new Map(LOOKUP_SPECS.map((spec) => [spec.name, spec]));

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/**
 * Keys no dataset contains: empty/whitespace, prototype-chain names that a
 * plain-object index would wrongly resolve, and unconstrained strings.
 */
const arbitraryJunkKey: fc.Arbitrary<string> = fc.oneof(
  fc.string(),
  fc.constantFrom(
    "",
    " ",
    "\n",
    "0",
    "null",
    "undefined",
    "__proto__",
    "constructor",
    "toString",
    "hasOwnProperty",
    "no-such-key",
    "Projects",
  ),
);

/**
 * Weighted toward keys drawn from the real datasets so the hit path is
 * exercised rather than only misses.
 */
function arbitraryKeyFor(spec: LookupSpec): fc.Arbitrary<string> {
  return fc.oneof(
    { arbitrary: fc.constantFrom(...spec.validKeys), weight: 3 },
    { arbitrary: arbitraryJunkKey, weight: 1 },
  );
}

type Invocation =
  | { readonly kind: "collection"; readonly name: string }
  | { readonly kind: "lookup"; readonly name: string; readonly key: string };

const arbitraryCollectionInvocation: fc.Arbitrary<Invocation> = fc
  .constantFrom(...COLLECTION_SPECS.map((spec) => spec.name))
  .map((name) => ({ kind: "collection" as const, name }));

const arbitraryLookupInvocation: fc.Arbitrary<Invocation> = fc
  .constantFrom(...LOOKUP_SPECS)
  .chain((spec) =>
    arbitraryKeyFor(spec).map((key) => ({
      kind: "lookup" as const,
      name: spec.name,
      key,
    })),
  );

const arbitraryInvocation: fc.Arbitrary<Invocation> = fc.oneof(
  arbitraryCollectionInvocation,
  arbitraryLookupInvocation,
);

function run(invocation: Invocation): unknown {
  if (invocation.kind === "collection") {
    return COLLECTION_BY_NAME.get(invocation.name)!.select();
  }

  return LOOKUP_BY_NAME.get(invocation.name)!.select(invocation.key);
}

function isThenable(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Property 19                                */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 19: Data selectors are deterministic
// (pure)
//
// For any fixed dataset and any repeated calls to a data-access selector
// (`getProjectBySlug`, `getBlogBySlug`, `getFeaturedProjectsResolved`, etc.)
// with the same input, all calls return deep-equal results.
//
// **Validates: Requirements 22.3**
describe("Property 19: data selectors are deterministic (pure)", () => {
  it("returns deep-equal collections on repeated calls, with canonical elements", () => {
    fc.assert(
      fc.property(arbitraryCollectionInvocation, (invocation) => {
        const spec = COLLECTION_BY_NAME.get(invocation.name)!;

        const first = spec.select();
        const second = spec.select();

        // Deep equality is the determinism contract...
        expect(first).toEqual(second);
        expect(first).toEqual(spec.dataset);

        // ...array identity explicitly is not: a fresh copy every call.
        expect(first).not.toBe(second);
        expect(first).not.toBe(spec.dataset);

        // Elements are the canonical records, never clones.
        for (const [index, element] of first.entries()) {
          expect(element).toBe(second[index]);
          expect(element).toBe(spec.dataset[index]);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns the identical record on repeated lookups with the same key", () => {
    fc.assert(
      fc.property(arbitraryLookupInvocation, (invocation) => {
        const spec = LOOKUP_BY_NAME.get(invocation.name)!;
        const key = invocation.kind === "lookup" ? invocation.key : "";

        const first = spec.select(key);
        const second = spec.select(key);

        expect(first).toEqual(second);
        expect(first).toBe(second);

        // A hit is the canonical dataset record, so a resolved reference and a
        // collection entry are the same object.
        if (first !== undefined) {
          expect(spec.dataset).toContain(first);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("does not depend on call order or on what was called before", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ invocation: arbitraryInvocation, order: fc.integer() }),
          { minLength: 1, maxLength: 12 },
        ),
        (steps) => {
          const firstPass = steps.map((step) => run(step.invocation));
          const secondPass = steps.map((step) => run(step.invocation));

          // Same sequence, same results.
          for (const [index, result] of firstPass.entries()) {
            expect(result).toEqual(secondPass[index]);
          }

          // Same multiset of calls in a different order, same per-call results.
          const shuffled = steps
            .map((step, index) => ({ step, index }))
            .sort((left, right) => left.step.order - right.step.order);
          const shuffledResults: unknown[] = new Array(steps.length);

          for (const { step, index } of shuffled) {
            shuffledResults[index] = run(step.invocation);
          }

          for (const [index, result] of firstPass.entries()) {
            expect(result).toEqual(shuffledResults[index]);

            if (steps[index]!.invocation.kind === "lookup") {
              expect(result).toBe(shuffledResults[index]);
            }
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("is unaffected by a caller mutating a previously returned collection", () => {
    const mutations: readonly {
      readonly name: string;
      readonly apply: (array: unknown[]) => void;
    }[] = [
      { name: "sort", apply: (array) => void array.sort() },
      { name: "reverse", apply: (array) => void array.reverse() },
      { name: "splice", apply: (array) => void array.splice(0, 1) },
      {
        name: "length = 0",
        apply: (array) => {
          array.length = 0;
        },
      },
      { name: "push", apply: (array) => void array.push({ injected: true }) },
      {
        name: "index assignment",
        apply: (array) => {
          array[0] = { injected: true };
        },
      },
    ];

    fc.assert(
      fc.property(
        arbitraryCollectionInvocation,
        fc.constantFrom(...mutations),
        (invocation, mutation) => {
          const spec = COLLECTION_BY_NAME.get(invocation.name)!;
          const baseline = [...spec.select()];

          mutation.apply(spec.select() as unknown[]);

          // Neither the next call nor the underlying dataset noticed.
          expect(spec.select()).toEqual(baseline);
          expect(spec.dataset).toEqual(baseline);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("is synchronous — no selector returns a Promise or thenable", () => {
    fc.assert(
      fc.property(arbitraryInvocation, (invocation) => {
        const result = run(invocation);

        expect(result).not.toBeInstanceOf(Promise);
        expect(isThenable(result)).toBe(false);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("is total — an arbitrary key yields undefined instead of throwing", () => {
    fc.assert(
      fc.property(arbitraryJunkKey, (key) => {
        for (const spec of LOOKUP_SPECS) {
          const result = spec.select(key);

          expect(() => spec.select(key)).not.toThrow();
          expect(result).not.toBeNull();

          if (result !== undefined) {
            // Only a genuine dataset key may resolve to a record.
            expect(spec.validKeys).toContain(key);
            expect(spec.dataset).toContain(result);
          }
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
