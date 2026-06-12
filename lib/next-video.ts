import type { ChannelProgress, SortOrder, Video } from "@/types";

export function sortVideos(videos: Video[], sortOrder: SortOrder): Video[] {
  const sorted = [...videos].sort(
    (a, b) =>
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
  );

  return sortOrder === "newest" ? sorted.reverse() : sorted;
}

export function getNextVideo(
  videos: Video[],
  progress: Pick<ChannelProgress, "watchedIds" | "latestWatchedId" | "sortOrder">,
): Video | null {
  const sorted = sortVideos(videos, progress.sortOrder);
  const watchedSet = new Set(progress.watchedIds);

  if (progress.latestWatchedId) {
    const latestIndex = sorted.findIndex(
      (video) => video.id === progress.latestWatchedId,
    );
    if (latestIndex !== -1) {
      return sorted[latestIndex + 1] ?? null;
    }
  }

  return sorted.find((video) => !watchedSet.has(video.id)) ?? null;
}
