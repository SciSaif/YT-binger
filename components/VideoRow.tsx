"use client";

import { useEffect, useRef, useState } from "react";
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
  const prevWatchedRef = useRef(watched);
  const prevIsNextRef = useRef(isNext);
  const prevIsLatestRef = useRef(isLatestWatched);
  const [justWatched, setJustWatched] = useState(false);
  const [nextEntered, setNextEntered] = useState(false);
  const [latestEntered, setLatestEntered] = useState(false);

  useEffect(() => {
    if (!prevWatchedRef.current && watched) {
      setJustWatched(true);
      const timeoutId = window.setTimeout(() => setJustWatched(false), 450);
      prevWatchedRef.current = watched;
      return () => window.clearTimeout(timeoutId);
    }

    prevWatchedRef.current = watched;
  }, [watched]);

  useEffect(() => {
    if (!prevIsNextRef.current && isNext) {
      setNextEntered(true);
      const timeoutId = window.setTimeout(() => setNextEntered(false), 420);
      prevIsNextRef.current = isNext;
      return () => window.clearTimeout(timeoutId);
    }

    prevIsNextRef.current = isNext;
  }, [isNext]);

  useEffect(() => {
    if (!prevIsLatestRef.current && isLatestWatched) {
      setLatestEntered(true);
      const timeoutId = window.setTimeout(() => setLatestEntered(false), 300);
      prevIsLatestRef.current = isLatestWatched;
      return () => window.clearTimeout(timeoutId);
    }

    prevIsLatestRef.current = isLatestWatched;
  }, [isLatestWatched]);

  const rowClass = isNext
    ? "bg-red-950/30"
    : isFocused
      ? "bg-zinc-800/70 ring-1 ring-inset ring-zinc-600"
      : isLatestWatched
        ? "bg-zinc-800/50"
        : "";

  const watchedClass = watched ? "opacity-60" : "opacity-100";
  const flashClass = justWatched ? "animate-row-watched-flash" : "";
  const nextGlowClass = nextEntered ? "animate-next-row-glow" : "";

  return (
    <div
      className={`flex flex-col gap-3 p-4 transition-all duration-300 ease-out sm:flex-row sm:items-center ${rowClass} ${watchedClass} ${flashClass} ${nextGlowClass}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-1 w-8 shrink-0 text-xs tabular-nums text-zinc-500 transition-opacity duration-300">
          {index}
        </span>
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt=""
            className={`h-16 w-28 shrink-0 rounded object-cover transition-all duration-300 ease-out ${
              watched ? "saturate-[0.65] brightness-90" : "saturate-100 brightness-100"
            }`}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {watched ? (
              <span
                className={`text-emerald-400 ${justWatched ? "animate-check-pop" : ""}`}
                title="Watched"
              >
                ✓
              </span>
            ) : (
              <span className="text-zinc-600 transition-opacity duration-300" title="Unwatched">
                ○
              </span>
            )}
            {isLatestWatched ? (
              <span
                className={`rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-200 ${
                  latestEntered ? "animate-badge-pop-in" : ""
                }`}
              >
                You are here
              </span>
            ) : null}
            {isNext ? (
              <span
                className={`rounded bg-red-900/80 px-2 py-0.5 text-xs text-red-200 ${
                  nextEntered ? "animate-badge-pop-in" : ""
                }`}
              >
                Next
              </span>
            ) : null}
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-medium leading-snug text-zinc-100 transition-colors duration-300 hover:text-red-400"
          >
            {video.title}
          </a>
          <p className="mt-1 text-xs text-zinc-500 transition-opacity duration-300">
            {formatDate(video.publishedAt)} · {video.duration}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 pl-11 sm:pl-0">
        <button
          type="button"
          onClick={() => onToggleWatched(video.id, !watched)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.98]"
        >
          {watched ? "Unmark watched" : "Mark watched"}
        </button>
        <button
          type="button"
          onClick={() => onRequestSetLatestWatched(video)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.98]"
        >
          I&apos;m up to here
        </button>
      </div>
    </div>
  );
}
