"use client";

import type { ChannelProgress, VideoCache, VisitedChannel } from "@/types";

interface VisitedChannelsListProps {
  channels: VisitedChannel[];
  progress: Record<string, ChannelProgress>;
  videoCache: Record<string, VideoCache>;
  onOpen: (channel: VisitedChannel) => void;
  loadingChannelId: string | null;
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

export function VisitedChannelsList({
  channels,
  progress,
  videoCache,
  onOpen,
  loadingChannelId,
}: VisitedChannelsListProps) {
  if (channels.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-white">Your channels</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Pick up where you left off on a channel you&apos;ve visited before.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {channels.map((visited) => {
          const channelProgress = progress[visited.channelId];
          const watchedCount = channelProgress?.watchedIds.length ?? 0;
          const totalVideos = videoCache[visited.channelId]?.videos.length ?? 0;
          const isLoading = loadingChannelId === visited.channelId;

          return (
            <li key={visited.channelId}>
              <button
                type="button"
                onClick={() => onOpen(visited)}
                disabled={isLoading}
                className="flex w-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="font-medium text-zinc-100">{visited.channelTitle}</span>
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
