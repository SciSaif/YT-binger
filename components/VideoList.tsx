"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { findVideoIndex, parseVideoUrl } from "@/lib/video-url";
import type { Video } from "@/types";
import { VideoRow } from "./VideoRow";

interface VideoListProps {
  videos: Video[];
  watchedIds: Set<string>;
  latestWatchedId: string | null;
  nextVideoId: string | null;
  onToggleWatched: (videoId: string, watched: boolean) => void;
  onRequestSetLatestWatched: (video: Video) => void;
}

const ROW_ESTIMATE_PX = 120;
const OVERSCAN = 4;

function getAnchorIndex(
  videos: Video[],
  nextVideoId: string | null,
  latestWatchedId: string | null,
): number {
  if (nextVideoId) {
    const nextIndex = videos.findIndex((video) => video.id === nextVideoId);
    if (nextIndex >= 0) return nextIndex;
  }

  if (latestWatchedId) {
    const latestIndex = videos.findIndex((video) => video.id === latestWatchedId);
    if (latestIndex >= 0) return latestIndex;
  }

  return 0;
}

export function VideoList({
  videos,
  watchedIds,
  latestWatchedId,
  nextVideoId,
  onToggleWatched,
  onRequestSetLatestWatched,
}: VideoListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [findUrl, setFindUrl] = useState("");
  const [findError, setFindError] = useState<string | null>(null);

  const virtualizer = useVirtualizer({
    count: videos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE_PX,
    overscan: OVERSCAN,
  });

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const clamped = Math.max(0, Math.min(index, videos.length - 1));
      setFocusIndex(clamped);
      virtualizer.scrollToIndex(clamped, { align: "center", behavior });
    },
    [videos.length, virtualizer],
  );

  useEffect(() => {
    if (videos.length === 0) return;
    const anchorIndex = getAnchorIndex(videos, nextVideoId, latestWatchedId);
    setFocusIndex(anchorIndex);
    virtualizer.scrollToIndex(anchorIndex, { align: "center", behavior: "auto" });
  }, [videos, nextVideoId, latestWatchedId, virtualizer]);

  useEffect(() => {
    const container = parentRef.current;
    if (!container) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        scrollToIndex(focusIndex - 1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        scrollToIndex(focusIndex + 1);
      }
    }

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }, [focusIndex, scrollToIndex]);

  function handleFindVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFindError(null);

    const videoId = parseVideoUrl(findUrl);
    if (!videoId) {
      setFindError("Invalid video URL. Try a watch link, youtu.be, or video ID.");
      return;
    }

    const index = findVideoIndex(videos, videoId);
    if (index < 0) {
      setFindError("That video is not in this channel's list.");
      return;
    }

    scrollToIndex(index);
    parentRef.current?.focus();
  }

  if (videos.length === 0) {
    return (
      <p className="py-8 text-center text-zinc-500">No videos found for this channel.</p>
    );
  }

  const focusedVideo = videos[focusIndex];
  const canGoUp = focusIndex > 0;
  const canGoDown = focusIndex < videos.length - 1;

  return (
    <section className="space-y-3">
      <form
        onSubmit={handleFindVideo}
        className="flex flex-col gap-2 sm:flex-row sm:items-start"
      >
        <div className="flex-1">
          <input
            type="text"
            value={findUrl}
            onChange={(event) => {
              setFindUrl(event.target.value);
              if (findError) setFindError(null);
            }}
            placeholder="Find by video URL (e.g. https://youtube.com/watch?v=…)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          {findError ? (
            <p role="alert" className="mt-1.5 text-xs text-red-400">
              {findError}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!findUrl.trim()}
          className="shrink-0 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Go to video
        </button>
      </form>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200">
            Video {focusIndex + 1} of {videos.length}
          </p>
          {focusedVideo ? (
            <p className="mt-1 truncate text-xs text-zinc-500">{focusedVideo.title}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scrollToIndex(focusIndex - 1)}
            disabled={!canGoUp}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↑ Previous
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(focusIndex + 1)}
            disabled={!canGoDown}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↓ Next
          </button>
        </div>
      </div>

      <div
        ref={parentRef}
        tabIndex={0}
        role="listbox"
        aria-label="Channel videos"
        aria-activedescendant={
          focusedVideo ? `video-row-${focusedVideo.id}` : undefined
        }
        className="h-[min(70vh,640px)] overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/30 outline-none focus:ring-2 focus:ring-red-500/40"
      >
        <ul
          className="relative w-full divide-y divide-zinc-800"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const video = videos[virtualRow.index];
            if (!video) return null;

            return (
              <li
                key={video.id}
                id={`video-row-${video.id}`}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                role="option"
                aria-selected={virtualRow.index === focusIndex}
                className="absolute left-0 top-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <VideoRow
                  video={video}
                  index={virtualRow.index + 1}
                  watched={watchedIds.has(video.id)}
                  isLatestWatched={video.id === latestWatchedId}
                  isNext={video.id === nextVideoId}
                  isFocused={virtualRow.index === focusIndex}
                  onToggleWatched={onToggleWatched}
                  onRequestSetLatestWatched={onRequestSetLatestWatched}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-center text-xs text-zinc-600">
        Use ↑ ↓ buttons or arrow keys to browse. Only nearby videos are loaded in view.
      </p>
    </section>
  );
}
