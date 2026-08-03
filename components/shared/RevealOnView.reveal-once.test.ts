import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  INITIAL_REVEAL_STATE,
  REVEAL_VIEWPORT,
  nextRevealState,
  type RevealState,
} from "@/components/shared/RevealOnView";

const NUM_RUNS = 100;

/**
 * A viewport event, as the reveal state machine sees it: `true` is "at least
 * `amount` of the element is intersecting", `false` is an exit. Sequences are
 * long enough (and biased towards many events) that enter/exit/re-enter churn
 * from fast scrolling, resizes, and tab switches is well covered.
 */
const arbitraryEventSequence = fc.array(fc.boolean(), {
  minLength: 0,
  maxLength: 200,
});

/**
 * Sequences that are guaranteed to contain at least one enter event, so the
 * "reveals on the first qualifying enter" half of the property is exercised on
 * every run instead of only when the generator happens to produce a `true`.
 */
const arbitraryRevealingSequence = fc
  .tuple(
    fc.array(fc.constant(false), { maxLength: 20 }),
    fc.array(fc.boolean(), { maxLength: 200 }),
  )
  .map(([exits, rest]) => [...exits, true, ...rest]);

/** Every intermediate state produced by folding `events` from the initial state. */
function foldReveal(events: readonly boolean[]): RevealState[] {
  const states: RevealState[] = [INITIAL_REVEAL_STATE];

  for (const isIntersecting of events) {
    states.push(nextRevealState(states[states.length - 1], isIntersecting));
  }

  return states;
}

function countTransitions(states: readonly RevealState[]): number {
  return states.reduce(
    (changes, state, index) =>
      index > 0 && state !== states[index - 1] ? changes + 1 : changes,
    0,
  );
}

// Feature: developer-portfolio, Property 20: Scroll-reveal state machine reveals
// exactly once
//
// For any sequence of viewport enter/exit/re-enter events fed to a section's
// reveal state machine, the "revealed" flag transitions from `false` to `true`
// on the first qualifying enter event and remains `true` for every subsequent
// event in the sequence, regardless of further exits or re-entries.
//
// **Validates: Requirements 24.3**
describe("Property 20: scroll-reveal state machine reveals exactly once", () => {
  it("stays hidden until the first intersection and never un-reveals afterwards", () => {
    fc.assert(
      fc.property(arbitraryEventSequence, (events) => {
        const states = foldReveal(events);
        const firstEnter = events.indexOf(true);

        if (firstEnter === -1) {
          // No qualifying enter event: the element is never revealed.
          expect(states.every((state) => state === "hidden")).toBe(true);
          return;
        }

        // Hidden for every state up to and including the one before the first
        // enter event (state index i is the state *before* event i).
        for (let i = 0; i <= firstEnter; i += 1) {
          expect(states[i]).toBe("hidden");
        }

        // Revealed by the first enter event, and revealed for every state after
        // it, whatever the remaining exits and re-entries are.
        for (let i = firstEnter + 1; i < states.length; i += 1) {
          expect(states[i]).toBe("visible");
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("changes state at most once, and only from hidden to visible", () => {
    fc.assert(
      fc.property(arbitraryEventSequence, (events) => {
        const states = foldReveal(events);

        expect(countTransitions(states)).toBeLessThanOrEqual(1);

        // Monotonic: hidden may be followed by visible, never the reverse.
        for (let i = 1; i < states.length; i += 1) {
          if (states[i] !== states[i - 1]) {
            expect(states[i - 1]).toBe("hidden");
            expect(states[i]).toBe("visible");
          }
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("reveals exactly once for any sequence containing an enter event", () => {
    fc.assert(
      fc.property(arbitraryRevealingSequence, (events) => {
        const states = foldReveal(events);

        expect(countTransitions(states)).toBe(1);
        expect(states[0]).toBe("hidden");
        expect(states[states.length - 1]).toBe("visible");
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("treats visible as absorbing for any single event", () => {
    fc.assert(
      fc.property(fc.boolean(), (isIntersecting) => {
        expect(nextRevealState("visible", isIntersecting)).toBe("visible");
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("stops observing after the first intersection", () => {
    // The other half of the "exactly once" guarantee: even if the reducer were
    // fed later events, the observer is detached after the first intersection.
    expect(REVEAL_VIEWPORT.once).toBe(true);
  });
});
