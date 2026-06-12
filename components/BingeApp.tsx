"use client";

import { useCallback, useMemo, useState } from "react";
import { ChannelInput } from "@/components/ChannelInput";
import { NextVideoCard } from "@/components/NextVideoCard";
import { UpToHereDialog } from "@/components/UpToHereDialog";
import { VideoList } from "@/components/VideoList";
import { sortVideos, getNextVideo } from "@/lib/next-video";
import { isVideoCacheStale, useAppState } from "@/lib/storage";
import type { ChannelInfo, ChannelProgress, SortOrder, Video } from "@/types";

const DEFAULT_PROGRESS = (channel: ChannelInfo): ChannelProgress => ({
  channelId: channel.channelId,
  channelTitle: channel.title,
  watchedIds: [],
  latestWatchedId: null,
  sortOrder: "oldest",
});

export function BingeApp() {
  const {
    getProgress,
    initProgress,
    markWatched,
    unmarkWatched,
    setLatestWatched,
    setSortOrder,
    getVideoCache,
    setVideoCache,
  } = useAppState();

  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState("");
  const [pendingUpToHereVideo, setPendingUpToHereVideo] = useState<Video | null>(
    null,
  );
  const [markPreviousAsWatched, setMarkPreviousAsWatched] = useState(false);

  const progress = channel
    ? (getProgress(channel.channelId) ?? DEFAULT_PROGRESS(channel))
    : undefined;

  const fetchVideos = useCallback(
    async (channelInfo: ChannelInfo, forceRefresh = false) => {
      const cached = getVideoCache(channelInfo.channelId);
      if (!forceRefresh && cached && !isVideoCacheStale(cached)) {
        setVideos(cached.videos);
        return;
      }

      setLoadingVideos(true);
      try {
        const response = await fetch(
          `/api/channel/videos?channelId=${encodeURIComponent(channelInfo.channelId)}&uploadsPlaylistId=${encodeURIComponent(channelInfo.uploadsPlaylistId)}`,
        );
        const data = (await response.json()) as {
          videos?: Video[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to fetch videos");
        }

        const fetchedVideos = data.videos ?? [];
        setVideos(fetchedVideos);
        setVideoCache(channelInfo.channelId, {
          channelId: channelInfo.channelId,
          videos: fetchedVideos,
          fetchedAt: Date.now(),
        });
      } finally {
        setLoadingVideos(false);
      }
    },
    [getVideoCache, setVideoCache],
  );

  const loadChannel = useCallback(
    async (url: string) => {
      setLoadingChannel(true);
      setError(null);
      setLastUrl(url);
      setChannel(null);
      setVideos([]);

      try {
        const resolveResponse = await fetch("/api/channel/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const channelData = (await resolveResponse.json()) as ChannelInfo & {
          error?: string;
        };

        if (!resolveResponse.ok) {
          throw new Error(channelData.error ?? "Failed to resolve channel");
        }

        initProgress(channelData.channelId, channelData.title);
        setChannel(channelData);

        try {
          await fetchVideos(channelData);
        } catch (fetchError) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to fetch videos",
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setChannel(null);
        setVideos([]);
        setLoadingVideos(false);
      } finally {
        setLoadingChannel(false);
      }
    },
    [fetchVideos, initProgress],
  );

  const handleRefresh = useCallback(async () => {
    if (!channel) return;
    setRefreshing(true);
    setError(null);
    try {
      await fetchVideos(channel, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh videos");
    } finally {
      setRefreshing(false);
    }
  }, [channel, fetchVideos]);

  const sortedVideos = useMemo(() => {
    if (!progress) return videos;
    return sortVideos(videos, progress.sortOrder);
  }, [videos, progress]);

  const nextVideo = useMemo(() => {
    if (!progress || videos.length === 0) return null;
    return getNextVideo(videos, progress);
  }, [videos, progress]);

  const watchedSet = useMemo(
    () => new Set(progress?.watchedIds ?? []),
    [progress?.watchedIds],
  );

  const watchedCount = progress?.watchedIds.length ?? 0;
  const allWatched = videos.length > 0 && watchedCount >= videos.length;
  const isLoading = loadingChannel || loadingVideos;

  function handleToggleWatched(videoId: string, watched: boolean) {
    if (!channel) return;
    if (watched) {
      markWatched(channel.channelId, videoId);
    } else {
      unmarkWatched(channel.channelId, videoId);
    }
  }

  function handleRequestSetLatestWatched(video: Video) {
    setMarkPreviousAsWatched(false);
    setPendingUpToHereVideo(video);
  }

  function handleCancelUpToHere() {
    setPendingUpToHereVideo(null);
    setMarkPreviousAsWatched(false);
  }

  function handleConfirmUpToHere() {
    if (!channel || !pendingUpToHereVideo) return;

    const videoIndex = sortedVideos.findIndex(
      (video) => video.id === pendingUpToHereVideo.id,
    );

    if (markPreviousAsWatched && videoIndex >= 0) {
      setLatestWatched(channel.channelId, pendingUpToHereVideo.id, {
        markPreviousIds: sortedVideos
          .slice(0, videoIndex + 1)
          .map((video) => video.id),
      });
    } else {
      setLatestWatched(channel.channelId, pendingUpToHereVideo.id);
    }

    handleCancelUpToHere();
  }

  const pendingPreviousCount = pendingUpToHereVideo
    ? Math.max(
        0,
        sortedVideos.findIndex((video) => video.id === pendingUpToHereVideo.id),
      )
    : 0;

  function handleSortChange(sortOrder: SortOrder) {
    if (!channel) return;
    setSortOrder(channel.channelId, sortOrder);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">YT Binger</h1>
          <p className="mt-2 text-zinc-400">
            Binge a YouTube channel from oldest to newest — never miss a video.
          </p>
        </header>

        <ChannelInput
          onLoad={loadChannel}
          loading={loadingChannel}
          initialUrl={lastUrl}
        />

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </p>
        ) : null}

        {channel && progress ? (
          <div className="mt-10 space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{channel.title}</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {loadingVideos
                    ? "Loading videos…"
                    : `${watchedCount} / ${videos.length} watched`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  Sort
                  <select
                    value={progress.sortOrder}
                    onChange={(event) =>
                      handleSortChange(event.target.value as SortOrder)
                    }
                    disabled={loadingVideos}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:border-red-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="oldest">Oldest first</option>
                    <option value="newest">Newest first</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing || loadingVideos}
                  className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
                >
                  {refreshing ? "Refreshing…" : "Refresh list"}
                </button>
              </div>
            </div>

            {loadingVideos ? (
              <div
                role="status"
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center text-zinc-400"
              >
                Fetching video list from YouTube…
              </div>
            ) : (
              <>
                <NextVideoCard video={nextVideo} completed={allWatched && !nextVideo} />

                <VideoList
                  videos={sortedVideos}
                  watchedIds={watchedSet}
                  latestWatchedId={progress.latestWatchedId}
                  nextVideoId={nextVideo?.id ?? null}
                  onToggleWatched={handleToggleWatched}
                  onRequestSetLatestWatched={handleRequestSetLatestWatched}
                />
              </>
            )}
          </div>
        ) : null}

        <UpToHereDialog
          video={pendingUpToHereVideo}
          open={pendingUpToHereVideo !== null}
          markPrevious={markPreviousAsWatched}
          previousCount={pendingPreviousCount}
          onMarkPreviousChange={setMarkPreviousAsWatched}
          onConfirm={handleConfirmUpToHere}
          onCancel={handleCancelUpToHere}
        />

        {isLoading && !channel ? (
          <p role="status" className="mt-8 text-center text-zinc-500">
            Resolving channel…
          </p>
        ) : null}
      </div>
    </div>
  );
}
