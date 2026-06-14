"use client";

import type {
  PlaylistProgress,
  PlaylistVideoCache,
  VisitedPlaylist,
} from "@/types";

interface VisitedPlaylistsListProps {
  playlists: VisitedPlaylist[];
  progress: Record<string, PlaylistProgress>;
  videoCache: Record<string, PlaylistVideoCache>;
  onOpen: (playlist: VisitedPlaylist) => void;
  loadingPlaylistId: string | null;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function VisitedPlaylistsList({
  playlists,
  progress,
  videoCache,
  onOpen,
  loadingPlaylistId,
}: VisitedPlaylistsListProps) {
  if (playlists.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-white">Your playlists</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Continue bingeing a playlist you&apos;ve opened before.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {playlists.map((visited) => {
          const playlistProgress = progress[visited.playlistId];
          const watchedCount = playlistProgress?.watchedIds.length ?? 0;
          const totalVideos = videoCache[visited.playlistId]?.videos.length ?? 0;
          const isLoading = loadingPlaylistId === visited.playlistId;

          return (
            <li key={visited.playlistId}>
              <button
                type="button"
                onClick={() => onOpen(visited)}
                disabled={isLoading}
                className="flex w-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="font-medium text-zinc-100">{visited.playlistTitle}</span>
                <span className="mt-2 text-sm text-zinc-400">
                  {totalVideos > 0
                    ? `${watchedCount} / ${totalVideos} watched`
                    : `${watchedCount} watched`}
                </span>
                <span className="mt-1 text-xs text-zinc-600">
                  {isLoading ? "Opening…" : `Visited ${formatRelativeTime(visited.lastVisitedAt)}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
