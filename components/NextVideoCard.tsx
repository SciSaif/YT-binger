"use client";

import { useEffect, useRef, useState } from "react";
import type { Video } from "@/types";

interface NextVideoCardProps {
  video: Video | null;
  completed: boolean;
  onMarkWatched?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const EXIT_MS = 280;
const PAUSE_MS = 120;
const ENTER_MS = 360;

type CardContent = {
  video: Video | null;
  completed: boolean;
};

function contentKey({ video, completed }: CardContent): string {
  if (completed) return "completed";
  return video?.id ?? "empty";
}

export function NextVideoCard({ video, completed, onMarkWatched }: NextVideoCardProps) {
  const [displayed, setDisplayed] = useState<CardContent>({ video, completed });
  const [visible, setVisible] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const displayedKeyRef = useRef(contentKey({ video, completed }));
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const id of timeoutsRef.current) window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    const next: CardContent = { video, completed };
    const nextKey = contentKey(next);
    if (nextKey === displayedKeyRef.current) return;

    for (const id of timeoutsRef.current) window.clearTimeout(id);
    timeoutsRef.current = [];

    setTransitioning(true);
    setVisible(false);

    const exitId = window.setTimeout(() => {
      displayedKeyRef.current = nextKey;
      setDisplayed(next);
      setVisible(false);

      const enterId = window.setTimeout(() => {
        setVisible(true);

        const finishId = window.setTimeout(() => {
          setTransitioning(false);
        }, ENTER_MS);
        timeoutsRef.current.push(finishId);
      }, PAUSE_MS);
      timeoutsRef.current.push(enterId);
    }, EXIT_MS);
    timeoutsRef.current.push(exitId);
  }, [video, completed]);

  function handleMarkWatched() {
    if (transitioning || !onMarkWatched) return;
    onMarkWatched();
  }

  const transitionClass = visible
    ? "translate-y-0 scale-100 opacity-100"
    : "-translate-y-2 scale-[0.98] opacity-0";

  if (displayed.completed) {
    return (
      <section className="overflow-hidden rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-6">
        <div
          className={`transition-all ease-out ${transitionClass}`}
          style={{ transitionDuration: `${visible ? ENTER_MS : EXIT_MS}ms` }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            All caught up
          </p>
          <p className="mt-2 text-lg text-zinc-200">
            You have watched every video in this channel. Nice work!
          </p>
        </div>
      </section>
    );
  }

  if (!displayed.video) {
    return (
      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div
          className={`transition-all ease-out ${transitionClass}`}
          style={{ transitionDuration: `${visible ? ENTER_MS : EXIT_MS}ms` }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Next to watch
          </p>
          <p className="mt-2 text-zinc-400">
            Load a channel or mark your progress to get a recommendation.
          </p>
        </div>
      </section>
    );
  }

  const displayedVideo = displayed.video;

  return (
    <section className="overflow-hidden rounded-xl border border-red-800/40 bg-gradient-to-br from-red-950/40 to-zinc-900/80 p-6">
      <div
        className={`transition-all ease-out ${transitionClass}`}
        style={{ transitionDuration: `${visible ? ENTER_MS : EXIT_MS}ms` }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
          Next to watch
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {displayedVideo.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayedVideo.thumbnail}
              alt=""
              className="h-28 w-full rounded-lg object-cover sm:h-24 sm:w-40"
            />
          ) : null}
          <div className="flex-1">
            <h2 className="text-lg font-semibold leading-snug text-zinc-50">
              {displayedVideo.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {formatDate(displayedVideo.publishedAt)} · {displayedVideo.duration}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href={`https://www.youtube.com/watch?v=${displayedVideo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Watch on YouTube
              </a>
              {onMarkWatched ? (
                <button
                  type="button"
                  onClick={handleMarkWatched}
                  disabled={transitioning}
                  className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mark watched
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
