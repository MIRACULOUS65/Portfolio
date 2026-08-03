"use client";

import { useCallback, useReducer } from "react";

import { ProjectDetails } from "@/components/featured-projects/ProjectDetails";
import { ProjectSelector } from "@/components/featured-projects/ProjectSelector";
import { VideoPlayer } from "@/components/featured-projects/VideoPlayer";
import {
  initialSelectionState,
  selectionReducer,
} from "@/components/featured-projects/reducer";
import type { Project } from "@/types";

/**
 * The Featured Projects Client island (Requirements 9.2, 9.5, 9.6, 9.7, 9.8,
 * 9.12, 9.13, 23.2, 23.5, design.md "FeaturedProjectsSection — Atomic
 * Selection Design").
 *
 * Owns the single `SelectionState` object via `useReducer(selectionReducer(
 * projects), initialSelectionState(projects))` — the reducer built in task
 * 22.1 — and renders `VideoPlayer` + `ProjectSelector` + `ProjectDetails`
 * from that one state object, so they can never disagree about which project
 * is displayed (Requirement 9.5).
 *
 * ## Flow
 *
 * Clicking a `ProjectSelector` card calls `handleSelect`, which dispatches
 * `SELECT` — the *only* place a selection change originates
 * (Requirement 9.7); nothing here ever changes `state` automatically.
 * `VideoPlayer` receives the *pending* project's video id while `transitioning`
 * — the reducer already exposes the target via `pendingIndex`, resolved back
 * to a `Project` here — and dispatches `COMMIT` once its iframe assignment
 * succeeds or `FAIL` if it throws, at which point the reducer reverts fully to
 * the previously committed project (Requirement 9.6). No `router.push` or
 * `window.location` assignment exists anywhere in this component
 * (Requirement 9.8).
 *
 * ## Scroll position (Requirement 9.13)
 *
 * `VideoPlayer`'s placeholder and iframe share one `aspect-video` box (see
 * its own doc comment), so the DOM subtree's height never changes across a
 * selection — nothing here needs an explicit `min-height` beyond what
 * `VideoPlayer` already guarantees, and no scroll-restoring code is needed
 * because nothing ever moves.
 *
 * ## Layout order (Requirement 9.12, 23.5)
 *
 * Desktop: `VideoPlayer` at ~65% width on the left, `ProjectSelector` at ~35%
 * on the right (`lg:grid-cols-[65%_35%]`). Mobile: a single column in the
 * fixed order video → horizontal selector → details, using CSS `order`
 * utilities on the same DOM rather than conditional rendering, so there is no
 * duplicate DOM/SEO content between breakpoints.
 *
 * Client Component: owns `useReducer` state, which needs the browser
 * (design.md's own classification).
 */
export interface FeaturedProjectsClientProps {
  /** The resolved, ordered featured project list (`getFeaturedProjectsResolved()`). */
  projects: readonly Project[];
}

export function FeaturedProjectsClient({
  projects,
}: FeaturedProjectsClientProps) {
  const reduce = selectionReducer(projects);
  const [state, dispatch] = useReducer(reduce, initialSelectionState(projects));

  const handleSelect = useCallback((index: number) => {
    dispatch({ type: "SELECT", index });
  }, []);

  const handleVideoReady = useCallback(() => {
    dispatch({ type: "COMMIT" });
  }, []);

  const handleVideoError = useCallback(() => {
    dispatch({ type: "FAIL" });
  }, []);

  // While transitioning, the video reflects the *pending* project (the one
  // being committed to), but ProjectDetails/ProjectSelector keep showing the
  // previously committed project until COMMIT/FAIL resolves — this is what
  // "keeps rendering the previous project and selectedIndex" (design.md)
  // means in code.
  const pendingProject =
    state.status === "transitioning" ? projects[state.pendingIndex] : undefined;
  const videoProject = pendingProject ?? state.project;

  return (
    <div
      data-slot="featured-projects-client"
      className="grid grid-cols-1 gap-8 lg:grid-cols-[65%_35%] lg:gap-10 lg:[grid-template-areas:'video_selector'_'details_selector']"
    >
      <VideoPlayer
        youtubeVideoId={videoProject.youtubeVideoId}
        title={videoProject.title}
        onReady={handleVideoReady}
        onError={handleVideoError}
        className="order-1 relative aspect-16/8 w-full overflow-hidden rounded-lg border border-border bg-muted lg:order-none lg:max-h-80 lg:[grid-area:video]"
      />

      <ProjectSelector
        projects={projects}
        selectedIndex={state.selectedIndex}
        onSelect={handleSelect}
        className="order-2 lg:order-none lg:[grid-area:selector]"
      />

      <ProjectDetails
        project={state.project}
        className="order-3 lg:order-none lg:[grid-area:details]"
      />
    </div>
  );
}
