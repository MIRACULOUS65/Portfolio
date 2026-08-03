import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  initialSelectionState,
  selectionReducer,
  type SelectionAction,
  type SelectionState,
} from "./reducer";
import type { Project } from "@/types/project";

const NUM_RUNS = 100;

/**
 * Property 9 tests the reducer directly, as a plain `(state, action) => state`
 * function — `reducer.ts` is pure and framework-agnostic (no React import), so
 * no `useReducer`/React Testing Library harness is needed here.
 *
 * Per `reducer.ts`'s own doc comments, `FAIL` always reverts to `idle` (never
 * to the `error` variant the type also declares) — see that file for the full
 * reasoning. This test asserts that behavior rather than re-deciding it.
 */

/* -------------------------------------------------------------------------- */
/*                                 Generators                                 */
/* -------------------------------------------------------------------------- */

/** A minimal, structurally valid `Project` fixture for a given index. */
function project(index: number): Project {
  return {
    id: `project-${index}`,
    slug: `project-${index}`,
    title: `Project ${index}`,
    shortDescription: `Short ${index}`,
    description: `Description ${index}`,
    category: "Web",
    status: "Completed",
    thumbnail: `/images/projects/project-${index}.jpg`,
    heroImage: `/images/projects/project-${index}-hero.jpg`,
    gallery: [],
    startDate: "2022-01-01",
    featured: true,
    pinned: false,
    archived: false,
    technologies: [],
    features: [],
    challenges: [],
    learnings: [],
    architecture: [],
    screenshots: [],
    relatedProjects: [],
  };
}

/** Non-empty, arbitrary-length list of distinct `Project`s. */
const arbitraryProjects: fc.Arbitrary<readonly Project[]> = fc
  .integer({ min: 1, max: 8 })
  .map((length) =>
    Array.from({ length }, (_, index) => project(index)),
  );

type ActionKind = "SELECT" | "COMMIT" | "FAIL";

/** Builds a `SelectionAction` from a kind, resolving `SELECT`'s index against the project list. */
function buildAction(
  kind: ActionKind,
  index: number,
): SelectionAction {
  if (kind === "SELECT") {
    return { type: "SELECT", index };
  }

  return { type: kind };
}

/* -------------------------------------------------------------------------- */
/*                                 Property 9                                 */
/* -------------------------------------------------------------------------- */

// Feature: developer-portfolio, Property 9: Featured project selection is
// atomic, defaults to the first project, and reverts fully on failure
//
// For any ordered list of resolved featured projects and any sequence of
// SELECT/COMMIT/FAIL actions applied to the selection reducer: the initial
// state's `project` equals the first project in the list; after any SELECT
// followed by COMMIT, every derived field originates from the same single
// `project` value in state (never a mix of two different projects' fields);
// and after any SELECT followed by FAIL, the resulting state is deep-equal to
// the state immediately before that SELECT (a full revert, never a
// partially-applied intermediate state).
//
// **Validates: Requirements 9.3, 9.5, 9.6**
describe("Property 9: featured project selection is atomic, defaults to the first project, and reverts fully on failure", () => {
  it("initialSelectionState always defaults to the first project (Requirement 9.3)", () => {
    fc.assert(
      fc.property(arbitraryProjects, (projects) => {
        const state = initialSelectionState(projects);

        expect(state.status).toBe("idle");
        expect(state.selectedIndex).toBe(0);
        expect(state.project).toEqual(projects[0]);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("SELECT followed by FAIL fully reverts to the exact pre-SELECT state (Requirement 9.6)", () => {
    fc.assert(
      fc.property(
        arbitraryProjects,
        fc.integer({ min: 0, max: 7 }),
        (projects, rawIndex) => {
          // Constrain to a valid, different index so SELECT is guaranteed to
          // actually start a transition rather than no-op.
          fc.pre(projects.length > 1);
          const index = rawIndex % projects.length;
          fc.pre(index !== 0);

          const before = initialSelectionState(projects);
          const reduce = selectionReducer(projects);

          const transitioning = reduce(before, {
            type: "SELECT",
            index,
          });
          expect(transitioning.status).toBe("transitioning");

          const reverted = reduce(transitioning, { type: "FAIL" });

          // Full revert: byte-for-byte identical to the state before SELECT.
          expect(reverted).toEqual(before);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("SELECT followed by COMMIT atomically applies the whole new selection as one unit (Requirement 9.5)", () => {
    fc.assert(
      fc.property(
        arbitraryProjects,
        fc.integer({ min: 0, max: 7 }),
        (projects, rawIndex) => {
          fc.pre(projects.length > 1);
          const index = rawIndex % projects.length;
          fc.pre(index !== 0);

          const before = initialSelectionState(projects);
          const reduce = selectionReducer(projects);

          const transitioning = reduce(before, {
            type: "SELECT",
            index,
          });
          const committed = reduce(transitioning, { type: "COMMIT" });

          expect(committed.status).toBe("idle");
          expect(committed.selectedIndex).toBe(index);
          // The whole state updates as one unit: selectedIndex and project
          // always agree on the same project, never a mix of two.
          expect(committed.project).toEqual(projects[index]);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("SELECT is a no-op while transitioning, when out of bounds, or when re-selecting the current index", () => {
    fc.assert(
      fc.property(arbitraryProjects, fc.integer(), (projects, rawIndex) => {
        const idle = initialSelectionState(projects);
        const reduce = selectionReducer(projects);

        // Out of bounds (never a valid index into `projects`).
        const outOfBoundsIndex =
          rawIndex >= 0
            ? projects.length + Math.abs(rawIndex)
            : -1 - Math.abs(rawIndex);
        expect(reduce(idle, { type: "SELECT", index: outOfBoundsIndex })).toBe(
          idle,
        );

        // Re-selecting the currently selected index (0, from idle).
        expect(reduce(idle, { type: "SELECT", index: 0 })).toBe(idle);

        // Already transitioning: a second SELECT is ignored outright.
        if (projects.length > 1) {
          const transitioning = reduce(idle, { type: "SELECT", index: 1 });
          expect(transitioning.status).toBe("transitioning");

          const nextIndex = projects.length > 2 ? 2 : 1;
          expect(
            reduce(transitioning, { type: "SELECT", index: nextIndex }),
          ).toBe(transitioning);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("COMMIT and FAIL are no-ops when the state is not transitioning", () => {
    fc.assert(
      fc.property(
        arbitraryProjects,
        fc.constantFrom<ActionKind>("COMMIT", "FAIL"),
        (projects, kind) => {
          const idle = initialSelectionState(projects);
          const reduce = selectionReducer(projects);

          expect(reduce(idle, buildAction(kind, 0))).toBe(idle);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it("holds across arbitrary sequences of SELECT/COMMIT/FAIL actions: never a torn state, and every FAIL reverts fully", () => {
    fc.assert(
      fc.property(
        arbitraryProjects,
        fc.array(
          fc.record({
            kind: fc.constantFrom<ActionKind>("SELECT", "COMMIT", "FAIL"),
            index: fc.integer({ min: 0, max: 9 }),
          }),
          { maxLength: 20 },
        ),
        (projects, steps) => {
          const reduce = selectionReducer(projects);
          let state: SelectionState = initialSelectionState(projects);

          expect(state.project).toEqual(projects[0]);

          for (const step of steps) {
            const prev = state;
            const action = buildAction(
              step.kind,
              step.index % projects.length,
            );

            state = reduce(state, action);

            // Every derived field traces back to the single `project` on the
            // active state — selectedIndex/project never disagree.
            if (state.status === "idle") {
              expect(state.project.id).toBe(projects[state.selectedIndex]?.id);
            } else if (state.status === "transitioning") {
              expect(state.project.id).toBe(projects[state.selectedIndex]?.id);
            }

            if (step.kind === "FAIL" && prev.status === "transitioning") {
              expect(state).toEqual({
                status: "idle",
                selectedIndex: prev.selectedIndex,
                project: prev.project,
              });
            }
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
