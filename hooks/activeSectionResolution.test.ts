import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  resolveActiveSection,
  resolveActiveSectionFromEntries,
  type ActiveSectionCandidate,
  type ActiveSectionEntryLike,
} from "@/hooks/useActiveSection";

const NUM_RUNS = 100;

/* -------------------------------------------------------------------------- */
/* Reference helpers                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The spec-level reading of "visibility ratio": a fraction in `[0, 1]`.
 *
 * Restated here rather than imported so the property judges the resolver
 * against the requirement instead of against the resolver's own arithmetic.
 */
function ratioOf(candidate: ActiveSectionCandidate): number {
  if (!Number.isFinite(candidate.intersectionRatio)) {
    return 0;
  }

  return Math.min(1, Math.max(0, candidate.intersectionRatio));
}

/** "Qualifying visibility": inside the band, and actually occupying some of it. */
function qualifies(candidate: ActiveSectionCandidate): boolean {
  return candidate.isIntersecting && ratioOf(candidate) > 0;
}

/* -------------------------------------------------------------------------- */
/* Generators                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Ids skewed towards the real homepage sections, with `""`, `"a"`/`"A"` (case
 * matters to a lexicographic tie-break) and free-form strings mixed in. Drawing
 * from a small pool is deliberate: it makes duplicate ids likely, which is the
 * hostile shape that breaks a comparator that is not a total order.
 */
const arbitrarySectionId: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom(
    "hero",
    "featured-projects",
    "tech-stack",
    "blog",
    "certifications",
    "hackathons",
    "education",
    "contact",
    "a",
    "A",
    "",
  ),
  fc.string({ maxLength: 6 }),
);

/**
 * Well-formed ratios plus every out-of-contract value an observer shim, a JSON
 * round-trip, or a generator could produce: `NaN` (which loses every comparison
 * in both directions), the infinities, negatives, and values above 1.
 */
const arbitraryRatio: fc.Arbitrary<number> = fc.oneof(
  fc.double({ min: 0, max: 1, noNaN: true }),
  fc.constantFrom(
    0,
    -0,
    1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -0.5,
    1.5,
    42,
  ),
);

/** A narrow band of orders, so duplicate `documentOrder` values are common. */
const arbitraryDocumentOrder: fc.Arbitrary<number> = fc.oneof(
  fc.integer({ min: 0, max: 4 }),
  fc.integer({ min: -3, max: 12 }),
);

const arbitraryCandidate: fc.Arbitrary<ActiveSectionCandidate> = fc.record({
  sectionId: arbitrarySectionId,
  intersectionRatio: arbitraryRatio,
  isIntersecting: fc.boolean(),
  documentOrder: arbitraryDocumentOrder,
});

/** One entry per observed section; never empty (that case is tested on its own). */
const arbitraryCandidates: fc.Arbitrary<ActiveSectionCandidate[]> = fc.array(
  arbitraryCandidate,
  { minLength: 1, maxLength: 9 },
);

/** A previously highlighted id, sometimes one of the candidates', sometimes not. */
const arbitraryPrevious: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  arbitrarySectionId,
);

/** An observer-shaped entry, including id-less targets the resolver must drop. */
const arbitraryEntry: fc.Arbitrary<ActiveSectionEntryLike> = fc.record({
  target: fc.record({ id: arbitrarySectionId }),
  isIntersecting: fc.boolean(),
  intersectionRatio: arbitraryRatio,
});

/** A candidate list paired with a permutation of itself. */
const arbitraryCandidatesWithPermutation: fc.Arbitrary<
  [ActiveSectionCandidate[], ActiveSectionCandidate[]]
> = arbitraryCandidates.chain((candidates) =>
  fc.tuple(
    fc.constant(candidates),
    fc.shuffledSubarray(candidates, {
      minLength: candidates.length,
      maxLength: candidates.length,
    }),
  ),
);

// Feature: developer-portfolio, Property 3: Active section resolver selects
// exactly one section
//
// For any generated set of IntersectionObserver entries with varying visibility
// ratios and boundary positions for the homepage's sections, the active-section
// resolver returns exactly one section id as active, never zero and never more
// than one, and that id corresponds to the entry with the highest qualifying
// visibility.
//
// **Validates: Requirements 5.5**
describe("Property 3: active section resolver selects exactly one section", () => {
  it("returns exactly one id, drawn from the input, for any non-empty candidate set", () => {
    fc.assert(
      fc.property(
        arbitraryCandidates,
        arbitraryPrevious,
        (candidates, previous) => {
          const active = resolveActiveSection(candidates, previous);

          // Never zero: the Navbar highlights one link, so "nothing active"
          // is not an acceptable answer while sections are observed.
          expect(active).not.toBeNull();

          // Never an invented id, and never more than one: a single string is
          // returned, and it belongs to the input.
          const ids = candidates.map((candidate) => candidate.sectionId);
          expect(ids).toContain(active);
          expect(typeof active).toBe("string");
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("selects the highest qualifying visibility whenever anything qualifies", () => {
    fc.assert(
      fc.property(
        arbitraryCandidates,
        arbitraryPrevious,
        (candidates, previous) => {
          const qualifying = candidates.filter(qualifies);

          if (qualifying.length === 0) {
            return;
          }

          const active = resolveActiveSection(candidates, previous);
          const winners = candidates.filter(
            (candidate) => candidate.sectionId === active,
          );

          // The winner is itself qualifying — a section outside the band never
          // outranks one inside it.
          expect(winners.some(qualifies)).toBe(true);

          // And it is the *most* visible of them.
          const bestRatio = Math.max(...qualifying.map(ratioOf));
          expect(Math.max(...winners.filter(qualifies).map(ratioOf))).toBe(
            bestRatio,
          );
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("picks the same section for any permutation of the same candidates", () => {
    fc.assert(
      fc.property(
        arbitraryCandidatesWithPermutation,
        arbitraryPrevious,
        ([candidates, permuted], previous) => {
          // Input order carries no meaning (`documentOrder` does), and an
          // observer callback's order is unspecified. A comparator that is not
          // a total order would crown a different winner here — which is the
          // "more than one active section" failure in disguise.
          expect(resolveActiveSection(permuted, previous)).toBe(
            resolveActiveSection(candidates, previous),
          );
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("ranks any pair antisymmetrically and any candidate as no better than itself", () => {
    fc.assert(
      fc.property(
        arbitraryCandidate,
        arbitraryCandidate,
        arbitraryPrevious,
        (first, second, previous) => {
          // Antisymmetry, observed through the resolver: if both directions
          // could claim to be "better", the two orders would disagree.
          expect(resolveActiveSection([second, first], previous)).toBe(
            resolveActiveSection([first, second], previous),
          );

          // Irreflexivity: a candidate never outranks itself, so a duplicated
          // entry resolves to its own id.
          expect(resolveActiveSection([first, first], previous)).toBe(
            first.sectionId,
          );
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("never throws on hostile ratios, duplicate orders, or duplicate ids", () => {
    fc.assert(
      fc.property(
        fc
          .array(
            fc.record({
              sectionId: fc.constantFrom("hero", "blog", ""),
              intersectionRatio: fc.constantFrom(
                Number.NaN,
                Number.POSITIVE_INFINITY,
                Number.NEGATIVE_INFINITY,
                -1,
                -0,
                2,
                1e9,
              ),
              isIntersecting: fc.boolean(),
              documentOrder: fc.constantFrom(0, 0, 1, -1),
            }),
            { minLength: 1, maxLength: 6 },
          )
          .map((candidates) => candidates as ActiveSectionCandidate[]),
        arbitraryPrevious,
        (candidates, previous) => {
          const active = resolveActiveSection(candidates, previous);

          expect(active).not.toBeNull();
          expect(candidates.map((candidate) => candidate.sectionId)).toContain(
            active,
          );
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("prefers any qualifying section over sections outside the band", () => {
    fc.assert(
      fc.property(
        fc.record({
          sectionId: fc.constant("winner"),
          intersectionRatio: fc.double({
            min: Number.MIN_VALUE,
            max: 1,
            noNaN: true,
          }),
          isIntersecting: fc.constant(true),
          documentOrder: arbitraryDocumentOrder,
        }),
        fc.array(
          fc.record({
            sectionId: fc.constantFrom("loser-a", "loser-b", "loser-c"),
            // High ratios, but reported as not intersecting — or intersecting
            // with a zero ratio, i.e. touching the band edge only.
            intersectionRatio: fc.constantFrom(0, 0.9, 1, 5),
            isIntersecting: fc.boolean(),
            documentOrder: arbitraryDocumentOrder,
          }),
          { maxLength: 5 },
        ),
        arbitraryPrevious,
        (winner, others, previous) => {
          const losers = others.map((other) => ({
            ...other,
            isIntersecting:
              other.intersectionRatio === 0 && other.isIntersecting,
          }));

          expect(resolveActiveSection([...losers, winner], previous)).toBe(
            "winner",
          );
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("keeps the previous section on an equal-ratio tie, and the topmost without one", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.tuple(
            fc.constantFrom(
              "hero",
              "featured-projects",
              "tech-stack",
              "blog",
              "contact",
            ),
            fc.integer({ min: 0, max: 8 }),
          ),
          {
            minLength: 2,
            maxLength: 5,
            selector: ([sectionId]) => sectionId,
          },
        ),
        fc.double({ min: Number.MIN_VALUE, max: 1, noNaN: true }),
        fc.nat(),
        (pairs, ratio, previousIndex) => {
          const candidates: ActiveSectionCandidate[] = pairs.map(
            ([sectionId, documentOrder]) => ({
              sectionId,
              documentOrder,
              intersectionRatio: ratio,
              isIntersecting: true,
            }),
          );

          // Stickiness: equally visible sections must not steal the highlight
          // back and forth as sub-pixel ratios wobble mid-scroll.
          const previous =
            candidates[previousIndex % candidates.length].sectionId;
          expect(resolveActiveSection(candidates, previous)).toBe(previous);

          // Cold start: the topmost section wins, ties on `documentOrder`
          // settled by the lexicographically smaller id.
          const topmost = [...candidates].sort(
            (left, right) =>
              left.documentOrder - right.documentOrder ||
              (left.sectionId < right.sectionId ? -1 : 1),
          )[0];
          expect(resolveActiveSection(candidates, null)).toBe(
            topmost.sectionId,
          );
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("returns null only for no observed sections and no previous highlight", () => {
    expect(resolveActiveSection([])).toBeNull();
    expect(resolveActiveSection([], "blog")).toBe("blog");

    fc.assert(
      fc.property(
        arbitraryCandidates,
        arbitraryPrevious,
        (candidates, previous) => {
          expect(resolveActiveSection([], previous)).toBe(previous);
          expect(resolveActiveSection(candidates, previous)).not.toBeNull();
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("resolves observer-shaped entries to exactly one id under the same rule", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryEntry, { maxLength: 8 }),
        arbitraryPrevious,
        (entries, previous) => {
          const active = resolveActiveSectionFromEntries(entries, previous);
          const navigableIds = entries
            .map((entry) => entry.target.id)
            .filter((id) => id !== "");

          if (navigableIds.length === 0) {
            // Id-less targets are dropped, which can empty the set entirely.
            expect(active).toBe(previous);
            return;
          }

          expect(active).not.toBeNull();
          expect(navigableIds).toContain(active);

          // Repeated ids collapse: first index is the document order, last
          // record wins for visibility — same answer as resolving the
          // collapsed candidates directly.
          const collapsed = new Map<string, ActiveSectionCandidate>();
          entries.forEach((entry, index) => {
            if (entry.target.id === "") {
              return;
            }

            collapsed.set(entry.target.id, {
              sectionId: entry.target.id,
              isIntersecting: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio,
              documentOrder:
                collapsed.get(entry.target.id)?.documentOrder ?? index,
            });
          });

          expect(active).toBe(
            resolveActiveSection(Array.from(collapsed.values()), previous),
          );
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
