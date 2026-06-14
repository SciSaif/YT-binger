"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { VisitedSourceCard } from "@/components/VisitedSourceCard";
import { isMixPlaylist } from "@/lib/playlist-limits";
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
  onRemove: (playlistId: string) => void;
  loadingPlaylistId: string | null;
}

export function VisitedPlaylistsList({
  playlists,
  progress,
  videoCache,
  onOpen,
  onRemove,
  loadingPlaylistId,
}: VisitedPlaylistsListProps) {
  const [pendingDelete, setPendingDelete] = useState<VisitedPlaylist | null>(null);

  if (playlists.length === 0) {
    return null;
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    onRemove(pendingDelete.playlistId);
    setPendingDelete(null);
  }

  return (
    <>
      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Your playlists</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {playlists.length} saved · continue bingeing in order
            </p>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {playlists.map((visited) => {
            const playlistProgress = progress[visited.playlistId];
            const watchedCount = playlistProgress?.watchedIds.length ?? 0;
            const totalVideos = videoCache[visited.playlistId]?.videos.length ?? 0;
            const isLoading = loadingPlaylistId === visited.playlistId;

            return (
              <li key={visited.playlistId}>
                <VisitedSourceCard
                  title={visited.playlistTitle}
                  kind={isMixPlaylist(visited.playlistId) ? "mix" : "playlist"}
                  watchedCount={watchedCount}
                  totalVideos={totalVideos}
                  lastVisitedAt={visited.lastVisitedAt}
                  isLoading={isLoading}
                  onOpen={() => onOpen(visited)}
                  onDelete={() => setPendingDelete(visited)}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove playlist?"
        description={
          pendingDelete
            ? `Remove "${pendingDelete.playlistTitle}" from your home screen? Watch progress and cached videos for this playlist will be deleted from this device.`
            : ""
        }
        confirmLabel="Remove"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
