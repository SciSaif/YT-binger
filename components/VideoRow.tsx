"use client";

import type { Video } from "@/types";

interface VideoRowProps {
  video: Video;
  index: number;
  watched: boolean;
  isLatestWatched: boolean;
  isNext: boolean;
  isFocused?: boolean;
  onToggleWatched: (videoId: string, watched: boolean) => void;
  onRequestSetLatestWatched: (video: Video) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function VideoRow({
  video,
  index,
  watched,
  isLatestWatched,
  isNext,
  isFocused = false,
  onToggleWatched,
  onRequestSetLatestWatched,
}: VideoRowProps) {
  const rowClass = isNext
    ? "bg-red-950/30"
    : isFocused
      ? "bg-zinc-800/70 ring-1 ring-inset ring-zinc-600"
      : isLatestWatched
        ? "bg-zinc-800/50"
        : watched
          ? "opacity-60"
          : "";

  return (
    <div
      className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center ${rowClass}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-1 w-8 shrink-0 text-xs tabular-nums text-zinc-500">
          {index}
        </span>
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt=""
            className="h-16 w-28 shrink-0 rounded object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {watched ? (
              <span className="text-emerald-400" title="Watched">
                ✓
              </span>
            ) : (
              <span className="text-zinc-600" title="Unwatched">
                ○
              </span>
            )}
            {isLatestWatched ? (
              <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-200">
                You are here
              </span>
            ) : null}
            {isNext ? (
              <span className="rounded bg-red-900/80 px-2 py-0.5 text-xs text-red-200">
                Next
              </span>
            ) : null}
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-medium leading-snug text-zinc-100 hover:text-red-400"
          >
            {video.title}
          </a>
          <p className="mt-1 text-xs text-zinc-500">
            {formatDate(video.publishedAt)} · {video.duration}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 pl-11 sm:pl-0">
        <button
          type="button"
          onClick={() => onToggleWatched(video.id, !watched)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          {watched ? "Unmark watched" : "Mark watched"}
        </button>
        <button
          type="button"
          onClick={() => onRequestSetLatestWatched(video)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          I&apos;m up to here
        </button>
      </div>
    </div>
  );
}
