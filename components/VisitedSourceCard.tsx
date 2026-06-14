"use client";

import { formatRelativeTime } from "@/lib/format-relative-time";

interface VisitedSourceCardProps {
  title: string;
  kind: "channel" | "playlist" | "mix";
  watchedCount: number;
  totalVideos: number;
  lastVisitedAt: number;
  isLoading: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function kindLabel(kind: VisitedSourceCardProps["kind"]): string {
  switch (kind) {
    case "channel":
      return "Channel";
    case "mix":
      return "Mix";
    case "playlist":
      return "Playlist";
  }
}

function kindBadgeClass(kind: VisitedSourceCardProps["kind"]): string {
  switch (kind) {
    case "channel":
      return "border-zinc-700 bg-zinc-800/80 text-zinc-300";
    case "mix":
      return "border-purple-900/50 bg-purple-950/40 text-purple-300";
    case "playlist":
      return "border-blue-900/50 bg-blue-950/40 text-blue-300";
  }
}

export function VisitedSourceCard({
  title,
  kind,
  watchedCount,
  totalVideos,
  lastVisitedAt,
  isLoading,
  onOpen,
  onDelete,
}: VisitedSourceCardProps) {
  const progressPercent =
    totalVideos > 0 ? Math.min(100, Math.round((watchedCount / totalVideos) * 100)) : 0;

  return (
    <article className="group relative rounded-xl border border-zinc-800/80 bg-zinc-900/60 transition-all hover:border-zinc-600 hover:bg-zinc-900 hover:shadow-lg hover:shadow-black/20">
      <button
        type="button"
        onClick={onOpen}
        disabled={isLoading}
        className="flex w-full flex-col p-4 pr-12 text-left disabled:cursor-wait disabled:opacity-60"
      >
        <div className="flex items-start gap-2">
          <span
            className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${kindBadgeClass(kind)}`}
          >
            {kindLabel(kind)}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-medium leading-snug text-zinc-100">{title}</h3>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              {totalVideos > 0
                ? `${watchedCount} / ${totalVideos} watched`
                : `${watchedCount} watched`}
            </span>
            {totalVideos > 0 ? <span>{progressPercent}%</span> : null}
          </div>
          {totalVideos > 0 ? (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-red-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          {isLoading ? "Opening…" : `Visited ${formatRelativeTime(lastVisitedAt)}`}
        </p>
      </button>

      <button
        type="button"
        aria-label={`Remove ${title}`}
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 opacity-60 transition-all hover:bg-zinc-800 hover:text-red-400 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500/40 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </article>
  );
}
