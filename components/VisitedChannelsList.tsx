"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { VisitedSourceCard } from "@/components/VisitedSourceCard";
import type { ChannelProgress, VideoCache, VisitedChannel } from "@/types";

interface VisitedChannelsListProps {
  channels: VisitedChannel[];
  progress: Record<string, ChannelProgress>;
  videoCache: Record<string, VideoCache>;
  onOpen: (channel: VisitedChannel) => void;
  onRemove: (channelId: string) => void;
  loadingChannelId: string | null;
}

export function VisitedChannelsList({
  channels,
  progress,
  videoCache,
  onOpen,
  onRemove,
  loadingChannelId,
}: VisitedChannelsListProps) {
  const [pendingDelete, setPendingDelete] = useState<VisitedChannel | null>(null);

  if (channels.length === 0) {
    return null;
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    onRemove(pendingDelete.channelId);
    setPendingDelete(null);
  }

  return (
    <>
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Your channels</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {channels.length} saved · pick up where you left off
            </p>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {channels.map((visited) => {
            const channelProgress = progress[visited.channelId];
            const watchedCount = channelProgress?.watchedIds.length ?? 0;
            const totalVideos = videoCache[visited.channelId]?.videos.length ?? 0;
            const isLoading = loadingChannelId === visited.channelId;

            return (
              <li key={visited.channelId}>
                <VisitedSourceCard
                  title={visited.channelTitle}
                  kind="channel"
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
        title="Remove channel?"
        description={
          pendingDelete
            ? `Remove "${pendingDelete.channelTitle}" from your home screen? Watch progress and cached videos for this channel will be deleted from this device.`
            : ""
        }
        confirmLabel="Remove"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
