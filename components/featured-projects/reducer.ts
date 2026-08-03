/**
 * The Featured Projects selection state machine.
 *
 * Pure, framework-agnostic module (no React import) backing
 * `FeaturedProjectsClient`'s `useReducer` call (task 23.5). Selection state is
 * modeled as a single discriminated union updated only through
 * `selectionReducer`, never through independent per-field `useState` calls,
 * so a partial/torn UI update is structurally impossible — `VideoPlayer`,
 * `ProjectDetails`, and the technology badge list all read the same
 * `project` field off the same state object (Requirement 9.5).
 *
 * Design source (`design.md`, "FeaturedProjectsSection — Atomic Selection
 * Design"):
 *
 * ```ts
 * type SelectionState =
 *   | { status: "idle"; selectedIndex: number; project: Project }
 *   | {
 *       status: "transitioning";
 *       selectedIndex: number;
 *       project: Project;
 *       pendingIndex: number;
 *     }
 *   | { status: "error"; selectedIndex: number; project: Project };
 *
 * type SelectionAction =
 *   | { type: "SELECT"; index: number }
 *   | { type: "COMMIT" } // all downstream consumers (video/details) confirmed ready
 *   | { type: "FAIL" }; // any consumer failed -> revert
 * ```
 *
 * ## Resolving the `error` vs. "FAIL fully reverts" tension
 *
 * The task brief for 22.1 flags an apparent contradiction: the union has an
 * `error` variant, yet Property 9 (and Requirement 9.6) require `FAIL` to
 * fully revert to the pre-`SELECT` state. The design's own prose resolves
 * this: "if iframe assignment throws ... it dispatches `FAIL` instead, and
 * the reducer discards the `pendingIndex`, **remaining on the previously
 * committed project**" — "committed" is exactly what `COMMIT` produces
 * (`status: "idle"`), so `FAIL` transitions back to `idle`, not `error`.
 * Nothing in the design's flow paragraph ever describes a transition that
 * *produces* `status: "error"`; `SELECT`/`COMMIT`/`FAIL` are the only three
 * actions, and all three are accounted for above without ever needing it.
 *
 * `error` is therefore kept in the type (it is part of the authoritative
 * shape in design.md and callers elsewhere may pattern-match on it), but this
 * reducer's own transitions never construct it — `FAIL` always yields
 * `idle`. Since `initialSelectionState` only ever produces `idle`, and this
 * reducer never produces `error`, every state reachable via `SELECT` /
 * `COMMIT` / `FAIL` is `idle` or `transitioning`; a `FAIL` therefore always
 * reverts to an `idle` state whose `selectedIndex`/`project` are byte-for-byte
 * the same values `transitioning` was carrying, which is exactly the state
 * that existed immediately before the `SELECT` that started the transition
 * (Requirement 9.6, Property 9's revert clause). `idle` and `error` share an
 * identical field shape (`selectedIndex`, `project`) precisely so a future
 * caller could construct an `error` state from an `idle` one without any
 * structural change — that path is out of scope for this reducer.
 *
 * ## Why `selectionReducer` is a small factory over `projects`
 *
 * `SelectionAction`'s `SELECT` carries only `index: number` (per the type
 * above), and `COMMIT` carries no payload at all. Turning a `pendingIndex`
 * into the `Project` object the `idle` state must hold therefore requires the
 * resolved featured project list at reduction time — no field in
 * `SelectionState` stores it. `selectionReducer(projects)` closes over that
 * list once and returns the plain `(state, action) => state` function
 * `useReducer` expects, so the reducer itself stays a pure function of
 * `(state, action)` and the same resolved list task 22's data layer already
 * produced (`getFeaturedProjectsResolved()`) is the single source of truth
 * for index -> `Project` resolution, mirroring how `initialSelectionState`
 * takes that same list to seed the first selection.
 *
 * Requirements: 9.3, 9.5, 9.6, 9.7
 */

import type { Project } from "@/types/project";

/** The Featured Projects selection state machine's discriminated union. */
export type SelectionState =
  | { status: "idle"; selectedIndex: number; project: Project }
  | {
      status: "transitioning";
      selectedIndex: number;
      project: Project;
      pendingIndex: number;
    }
  | { status: "error"; selectedIndex: number; project: Project };

/** Actions accepted by `selectionReducer`. */
export type SelectionAction =
  | { type: "SELECT"; index: number }
  | { type: "COMMIT" }
  | { type: "FAIL" };

/**
 * Builds the initial selection state from the resolved, ordered featured
 * project list, defaulting to the first project (Requirement 9.3, Property
 * 9's "the initial state's `project` equals the first project in the list").
 *
 * `projects` is expected to be the output of `getFeaturedProjectsResolved()`
 * (non-empty in any shipped build — `lib/validate-data.ts` fails the build
 * otherwise). An empty list has no valid default selection to construct, so
 * this throws rather than fabricating a placeholder `Project`.
 */
export function initialSelectionState(
  projects: readonly Project[],
): SelectionState {
  const project = projects[0];

  if (!project) {
    throw new Error(
      "initialSelectionState requires at least one resolved featured project",
    );
  }

  return { status: "idle", selectedIndex: 0, project };
}

/**
 * Creates the `(state, action) => state` reducer for the given resolved
 * featured project list, for use with `useReducer`:
 *
 * ```ts
 * const [state, dispatch] = useReducer(
 *   selectionReducer(projects),
 *   initialSelectionState(projects),
 * );
 * ```
 *
 * Transition table:
 * - `SELECT` from `idle`/`error`: moves to `transitioning`, **keeping** the
 *   current `selectedIndex`/`project` unchanged and recording the requested
 *   `index` as `pendingIndex` (Requirement 9.7 — selection only changes in
 *   response to this explicit action). An `index` outside `projects`'
 *   bounds, or equal to the currently selected index, is a no-op: the state
 *   is returned unchanged.
 * - `SELECT` while already `transitioning`: a no-op. A second selection
 *   cannot be honoured until the in-flight one resolves without risking a
 *   torn revert target, so it is ignored rather than overwriting
 *   `pendingIndex`.
 * - `COMMIT` from `transitioning`: resolves `pendingIndex` against
 *   `projects` and moves to `idle` with that project as the new
 *   `selectedIndex`/`project` — every downstream consumer (video, details,
 *   badges) reads this single new value atomically (Requirement 9.5).
 * - `FAIL` from `transitioning`: discards `pendingIndex` and moves to `idle`
 *   using the `selectedIndex`/`project` the `transitioning` state was still
 *   carrying — a full, exact revert to the state before the triggering
 *   `SELECT` (Requirement 9.6).
 * - `COMMIT`/`FAIL` while not `transitioning`: a no-op, since there is
 *   nothing in flight to resolve or revert.
 */
export function selectionReducer(
  projects: readonly Project[],
): (state: SelectionState, action: SelectionAction) => SelectionState {
  return function reduce(
    state: SelectionState,
    action: SelectionAction,
  ): SelectionState {
    switch (action.type) {
      case "SELECT": {
        if (state.status === "transitioning") {
          return state;
        }

        const { index } = action;

        if (
          index < 0 ||
          index >= projects.length ||
          index === state.selectedIndex
        ) {
          return state;
        }

        return {
          status: "transitioning",
          selectedIndex: state.selectedIndex,
          project: state.project,
          pendingIndex: index,
        };
      }

      case "COMMIT": {
        if (state.status !== "transitioning") {
          return state;
        }

        const project = projects[state.pendingIndex];

        if (!project) {
          return state;
        }

        return {
          status: "idle",
          selectedIndex: state.pendingIndex,
          project,
        };
      }

      case "FAIL": {
        if (state.status !== "transitioning") {
          return state;
        }

        return {
          status: "idle",
          selectedIndex: state.selectedIndex,
          project: state.project,
        };
      }

      default:
        return state;
    }
  };
}
