"use client";

import { useEffect, useState } from "react";

/**
 * Threshold array handed to the observer (design.md "Navbar").
 *
 * Five steps rather than a single `0` so the callback fires while a section
 * crosses the band, not only when it first touches it — that is what keeps the
 * highlighted link from lagging visibly behind the section the visitor is
 * reading during rapid scrolling (Requirement 5.5).
 */
export const ACTIVE_SECTION_THRESHOLDS: readonly number[] = [
  0, 0.25, 0.5, 0.75, 1,
];

/**
 * Shrinks the observer root to a thin horizontal band near the vertical center
 * of the viewport (design.md "Navbar").
 *
 * Top and bottom are each pulled in by 45%, leaving a ~10%-tall band. A band is
 * what makes "the current section" well defined: with a full-viewport root, two
 * or three sections intersect at once during a scroll and the naive
 * "isIntersecting" reading highlights several links — the classic
 * multi-active-link bug Requirement 5.5 forbids.
 */
export const ACTIVE_SECTION_ROOT_MARGIN = "-45% 0px -45% 0px";

/**
 * How observed sections are discovered.
 *
 * Deliberately broader than `section[data-slot="section"]`: it matches any
 * `<section>` carrying an `id`, so it keeps working for a section that is
 * hand-rolled rather than wrapped in `components/shared/Section.tsx` (the
 * Hero's layout, for instance) while still ignoring the many non-`section`
 * elements with ids on the page. Elements with an empty `id` are filtered out
 * in code, since `[id]` also matches `id=""`.
 */
export const HOMEPAGE_SECTION_SELECTOR = "section[id]";

/**
 * One section's visibility, as the resolver sees it.
 *
 * `documentOrder` is the section's index in document order (0 = topmost). It is
 * carried explicitly instead of being read back off the DOM because the
 * resolver is pure: `IntersectionObserver` delivers entries in an unspecified
 * order, and only for sections whose visibility changed, so order has to travel
 * with the data.
 */
export interface ActiveSectionCandidate {
  /** The `<section>` element's `id`, e.g. `"projects"`. */
  sectionId: string;
  /** Fraction of the section inside the observer band, `0`–`1`. */
  intersectionRatio: number;
  /** The observer's own verdict for this section. */
  isIntersecting: boolean;
  /** Index in document order; lower is closer to the top of the page. */
  documentOrder: number;
}

/**
 * The subset of `IntersectionObserverEntry` this hook actually reads.
 *
 * Structural, not a re-export of the DOM type, so a test can build entries as
 * plain objects: jsdom ships no `IntersectionObserver`, so Property 3 (task
 * 17.2) has no real entries to hand to `resolveActiveSectionFromEntries`.
 */
export interface ActiveSectionEntryLike {
  target: { id: string };
  isIntersecting: boolean;
  intersectionRatio: number;
}

/**
 * Forces a ratio into the `[0, 1]` range the resolver's ordering assumes.
 *
 * Real observers stay inside it; a generated or shimmed entry may not, and
 * `NaN` would silently break every comparison it takes part in (`NaN > x` and
 * `NaN < x` are both false), which is exactly how a comparator stops being a
 * total order and starts producing zero or two winners.
 */
function normalizeRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) {
    return 0;
  }

  return Math.min(1, Math.max(0, ratio));
}

/**
 * Whether a candidate counts as visible — "qualifying", in Property 3's terms.
 *
 * Both conditions matter: the observer's `isIntersecting` flag *and* a non-zero
 * ratio. A section touching the band edge is reported as intersecting with a
 * ratio of `0`, i.e. nothing of it is actually in the band, so it must not
 * outrank a section that genuinely occupies the band.
 */
function isQualifying(candidate: ActiveSectionCandidate): boolean {
  return (
    candidate.isIntersecting && normalizeRatio(candidate.intersectionRatio) > 0
  );
}

/**
 * Picks the single active section from the current visibility of every observed
 * section (Requirement 5.5, Property 3).
 *
 * ## Exactly one winner, always
 *
 * The candidates are ranked by a **total order**, and the maximum of a total
 * order over a non-empty set is unique. Applied in sequence, first
 * discriminator wins:
 *
 * 1. **Qualifying beats non-qualifying** — a section actually inside the band
 *    always outranks one that isn't (see `isQualifying`).
 * 2. **Higher `intersectionRatio`** — "most visible" within the band.
 * 3. **The previously active section** — if two sections are equally visible,
 *    the highlight stays where it is instead of oscillating between them as
 *    sub-pixel ratios wobble during a scroll.
 * 4. **Lower `documentOrder`** — the topmost section wins.
 * 5. **Lexicographically smaller `sectionId`** — unreachable with real DOM data
 *    (ids are unique and orders distinct), present so the order is total even
 *    for hostile input, e.g. two candidates that agree on every other field.
 *
 * Rules 4 and 5 together mean no tie can survive: any two distinct candidates
 * differ in `documentOrder` or in `sectionId`, so "zero winners" and "two
 * winners" are both structurally impossible for a non-empty candidate set.
 *
 * ## Nothing intersecting is not "nothing active"
 *
 * When no section qualifies — the band sits in a gap between sections, or in a
 * section's padding — the rules above still return one id: rule 3 keeps the
 * previous one, and on a cold start rule 4 selects the topmost section. The
 * Navbar highlights exactly one link at a time (Requirement 5.5), so briefly
 * highlighting *no* link while scrolling across a gap would be a visible defect,
 * not a neutral state.
 *
 * `null` is therefore returned in exactly one situation: `candidates` is empty
 * and there is no previous id — no observed sections at all. That happens on a
 * dedicated page (`/projects`, `/blog`, …), which has no homepage sections to
 * highlight, and in the moment before the observer's first callback on the
 * homepage. Consumers must handle `null` by highlighting nothing.
 *
 * ## Ratio is band occupancy, not screen area
 *
 * `intersectionRatio` is measured against the *target's* size, so with a ~10%
 * band a short section fully inside it scores 1 while a tall section spanning
 * the whole viewport scores much less. That is intended: the band asks "what is
 * the visitor looking at", and the section covering the center of the screen is
 * the answer regardless of how much of that section fits on screen.
 *
 * Pure, and exported for that reason: Property 3 exercises it directly, with no
 * DOM and no `IntersectionObserver`.
 *
 * @param candidates One entry per observed section. Order within the array is
 *   irrelevant; `documentOrder` carries position.
 * @param previousActiveSectionId The id currently highlighted, or `null`. Used
 *   only as a tie-breaker (rule 3) and as the empty-input fallback.
 * @returns The single active section id, or `null` only when no section is
 *   observed and none was previously active.
 */
export function resolveActiveSection(
  candidates: readonly ActiveSectionCandidate[],
  previousActiveSectionId: string | null = null,
): string | null {
  if (candidates.length === 0) {
    return previousActiveSectionId;
  }

  let best = candidates[0];

  for (let index = 1; index < candidates.length; index += 1) {
    if (isBetterCandidate(candidates[index], best, previousActiveSectionId)) {
      best = candidates[index];
    }
  }

  return best.sectionId;
}

/**
 * `true` when `candidate` outranks `incumbent` under the total order documented
 * on `resolveActiveSection`. Never `true` for both directions of a pair, and
 * never `true` for a candidate compared with itself, which is what makes the
 * fold above deterministic regardless of input order.
 */
function isBetterCandidate(
  candidate: ActiveSectionCandidate,
  incumbent: ActiveSectionCandidate,
  previousActiveSectionId: string | null,
): boolean {
  // 1. Qualifying beats non-qualifying.
  const candidateQualifies = isQualifying(candidate);
  const incumbentQualifies = isQualifying(incumbent);

  if (candidateQualifies !== incumbentQualifies) {
    return candidateQualifies;
  }

  // 2. Most visible within the band.
  const candidateRatio = normalizeRatio(candidate.intersectionRatio);
  const incumbentRatio = normalizeRatio(incumbent.intersectionRatio);

  if (candidateRatio !== incumbentRatio) {
    return candidateRatio > incumbentRatio;
  }

  // 3. Stickiness: an equally visible incumbent highlight is not disturbed.
  const candidateWasActive = candidate.sectionId === previousActiveSectionId;
  const incumbentWasActive = incumbent.sectionId === previousActiveSectionId;

  if (candidateWasActive !== incumbentWasActive) {
    return candidateWasActive;
  }

  // 4. Topmost section in document order.
  if (candidate.documentOrder !== incumbent.documentOrder) {
    return candidate.documentOrder < incumbent.documentOrder;
  }

  // 5. Last resort, so the order is total for any input at all.
  return candidate.sectionId < incumbent.sectionId;
}

/**
 * Entry-level wrapper around `resolveActiveSection`.
 *
 * Maps observer entries to candidates — `entry.target.id`, the ratio, the flag,
 * and the array index as `documentOrder` — then resolves. Entries whose target
 * has no `id` are dropped (they are not navigation targets). Repeated ids
 * collapse to one candidate keeping the *first* index seen as its document
 * order and the *last* visibility seen as its state, matching how a real
 * observer supersedes an earlier record with a later one.
 *
 * Two callers: the hook below, and Property 3 (task 17.2), which can pass plain
 * `{ target: { id }, isIntersecting, intersectionRatio }` objects since jsdom
 * has no `IntersectionObserver`. Note that array index is only a faithful
 * `documentOrder` when the caller passes entries for *all* sections in document
 * order — the hook does not use this path for live callbacks, precisely because
 * a real callback carries only the sections that changed.
 */
export function resolveActiveSectionFromEntries(
  entries: readonly ActiveSectionEntryLike[],
  previousActiveSectionId: string | null = null,
): string | null {
  const candidates = new Map<string, ActiveSectionCandidate>();

  entries.forEach((entry, index) => {
    const sectionId = entry.target.id;

    if (sectionId === "") {
      return;
    }

    candidates.set(sectionId, {
      sectionId,
      isIntersecting: entry.isIntersecting,
      intersectionRatio: entry.intersectionRatio,
      documentOrder: candidates.get(sectionId)?.documentOrder ?? index,
    });
  });

  return resolveActiveSection(
    Array.from(candidates.values()),
    previousActiveSectionId,
  );
}

/**
 * Reports which homepage section the visitor is currently viewing
 * (Requirement 5.5).
 *
 * One `IntersectionObserver` watches every `<section id>` on the page — not one
 * observer per section — so all sections are compared against the same band in
 * the same callback, which is what lets the decision be "exactly one active
 * section" rather than a set of independent booleans that can all be true.
 *
 * ## The reported id may have no Navbar link
 *
 * This hook reports the active **section**, not the active *link*.
 * `data/navigation.ts` lists all nine homepage sections but ships only five with
 * `visible: true`, so scrolling into `#contact` or `#education` legitimately
 * yields an id with no visible link. `ActiveSectionIndicator` (task 17.3) owns
 * that case: it must highlight nothing rather than fall back to a neighbouring
 * link, which would highlight a section the visitor is not viewing — and must
 * not crash. Filtering to visible links here would be worse: the highlight
 * would stick to the last visible section across several unrelated ones.
 *
 * ## Lifecycle
 *
 * Client-only. The initial state is `null` and the observer is created inside an
 * effect, so nothing touches `window`, `document`, or `IntersectionObserver`
 * during a server render, and the server and first client render agree. The
 * effect runs once: homepage sections are server-rendered and static, so there
 * is no set of sections to re-subscribe to. It returns `null` (rather than
 * throwing) when the page has no sections, and disconnects the single observer
 * on unmount.
 *
 * `IntersectionObserver` itself is feature-detected: it is absent in jsdom, so
 * component tests render without shimming it and simply observe no active
 * section. A test that needs live behaviour can install the shim from the top
 * of `components/shared/RevealOnView.test.tsx`.
 *
 * @returns The active section id, or `null` when no homepage section is being
 *   observed yet — see `resolveActiveSection` for why that is the only `null`.
 */
export function useActiveSection(): string | null {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    // Homepage sections can nest — a full-viewport group wrapper
    // (`#tech-stack`, `#blog`, `#connect`, ...) contains its own inner
    // `<section id>`s for internal anchors/deep links. Only the outermost
    // matched section per subtree is observed, so a shorter nested section
    // cannot out-rank its own group wrapper on visibility ratio and hijack
    // the Navbar highlight — the group id is what a nav link's `sectionId`
    // actually points at. Computed generically (no id is hardcoded here): a
    // section is "top-level" when no other matched section contains it.
    const allMatchedSections = Array.from(
      document.querySelectorAll<HTMLElement>(HOMEPAGE_SECTION_SELECTOR),
    ).filter((section) => section.id !== "");

    const sections = allMatchedSections.filter(
      (section) =>
        !allMatchedSections.some(
          (other) => other !== section && other.contains(section),
        ),
    );

    if (sections.length === 0) {
      return;
    }

    // Document order, captured once from the query result (which is in document
    // order) because observer callbacks are not.
    const documentOrders = new Map<string, number>();
    sections.forEach((section, index) => {
      if (!documentOrders.has(section.id)) {
        documentOrders.set(section.id, index);
      }
    });

    // Latest known visibility of every section, seeded as "not visible". A
    // callback reports only the sections that changed, so this map — not the
    // callback's `entries` — is what the resolver ranks; otherwise a scroll that
    // moves one section out of the band would be judged without knowing the
    // section that moved in.
    const visibility = new Map<string, ActiveSectionCandidate>();
    documentOrders.forEach((documentOrder, sectionId) => {
      visibility.set(sectionId, {
        sectionId,
        documentOrder,
        isIntersecting: false,
        intersectionRatio: 0,
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const documentOrder = documentOrders.get(target.id);

          if (documentOrder === undefined) {
            continue;
          }

          visibility.set(target.id, {
            sectionId: target.id,
            documentOrder,
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
          });
        }

        const candidates = Array.from(visibility.values());

        setActiveSectionId((previous) =>
          resolveActiveSection(candidates, previous),
        );
      },
      {
        threshold: [...ACTIVE_SECTION_THRESHOLDS],
        rootMargin: ACTIVE_SECTION_ROOT_MARGIN,
      },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return activeSectionId;
}
