"use client";

import { useEffect, useRef, useState } from "react";
import { Video } from "lucide-react";

/**
 * The Featured Projects video surface (Requirements 9.10, 27.3,
 * design.md "FeaturedProjectsSection — Atomic Selection Design").
 *
 * ## Lazy iframe mount (Requirement 9.10, 27.3)
 *
 * Renders a fixed-aspect-ratio placeholder box — no iframe in the DOM at all —
 * until an `IntersectionObserver` reports the player is near the viewport,
 * then injects the YouTube iframe `src`. This keeps the iframe (and the
 * network request it triggers) from loading before the FeaturedProjectsSection
 * is actually about to be seen. `rootMargin: "200px"` starts loading slightly
 * ahead of the visible viewport so the video is ready by the time a visitor
 * scrolls to it, without loading it eagerly on every homepage visit.
 *
 * ## Reporting success/failure back to the selection reducer
 *
 * `FeaturedProjectsClient` owns the single `SelectionState` and this component
 * never touches it directly — it only calls the two callbacks it is handed.
 * `onReady()` fires once the iframe's `src` has been assigned (assignment is
 * synchronous, so this fires on the same tick the `src` is set); `onError()`
 * fires if that assignment throws (e.g. a malformed/empty video id), letting
 * the parent dispatch `FAIL` and revert instead of leaving a broken player
 * displayed as if it were the newly selected project (Requirement 9.6).
 *
 * ## Held min-height (Requirement 9.13)
 *
 * The placeholder and the iframe share the exact same `aspect-video` box, so
 * swapping between them never changes this component's rendered height —
 * `FeaturedProjectsClient` relies on that to keep the page's scroll position
 * stable across a selection change.
 *
 * Client Component: owns the `IntersectionObserver` and the "has intersected
 * yet" state, both of which need the browser (design.md's own classification
 * of `VideoPlayer` as a Client Component).
 */
export interface VideoPlayerProps {
  /** YouTube video id to embed once mounted. `undefined` renders a "no video" placeholder. */
  youtubeVideoId: string | undefined;
  /** Accessible title for the embedded video, e.g. the project's title. */
  title: string;
  /** Called once the iframe `src` has been successfully assigned. */
  onReady: () => void;
  /** Called if assigning the iframe `src` fails. */
  onError: () => void;
  /** Extra utilities merged onto the wrapper; conflicting classes win. */
  className?: string;
}

export function VideoPlayer({
  youtubeVideoId,
  title,
  onReady,
  onError,
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      // No observer support (or no element yet): fail open rather than never
      // loading the video at all.
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isNearViewport) {
      return;
    }

    try {
      // A project with no configured video is a valid, deliberate content
      // state (`Project.youtubeVideoId` is optional) — not a failure. Only an
      // actual assignment error (caught below) should ever revert the
      // selection.
      onReady();
    } catch {
      onError();
    }
    // Re-run whenever the video id changes (a new selection) or the observer
    // first fires, so each new project gets its own ready/error report.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearViewport, youtubeVideoId]);

  const shouldRenderIframe = isNearViewport && Boolean(youtubeVideoId);

  return (
    <div
      ref={containerRef}
      data-slot="video-player"
      className={
        className ??
        "relative aspect-16/8 w-full overflow-hidden rounded-lg border border-border bg-muted lg:max-h-80"
      }
    >
      {shouldRenderIframe ? (
        <iframe
          data-slot="video-player-iframe"
          className="absolute inset-0 size-full"
          src={`https://www.youtube.com/embed/${youtubeVideoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div
          data-slot="video-player-placeholder"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"
        >
          <Video aria-hidden="true" className="size-10" />
          <span className="text-small">Video preview</span>
        </div>
      )}
    </div>
  );
}
