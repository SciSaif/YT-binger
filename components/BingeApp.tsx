"use client";

import { useCallback, useMemo, useState } from "react";
import { ChannelHeader } from "@/components/ChannelHeader";
import { ChannelInput } from "@/components/ChannelInput";
import { NextVideoCard } from "@/components/NextVideoCard";
import { UpToHereDialog } from "@/components/UpToHereDialog";
import { VideoList } from "@/components/VideoList";
import { VisitedChannelsList } from "@/components/VisitedChannelsList";
import { VisitedPlaylistsList } from "@/components/VisitedPlaylistsList";
import {
  getNextVideo,
  sortPlaylistVideos,
  sortVideos,
} from "@/lib/next-video";
import { apiFetch } from "@/lib/api-client";
import { parseYoutubeInput } from "@/lib/youtube-input";
import { isMixPlaylist } from "@/lib/playlist-limits";
import { isVideoCacheStale, useAppState } from "@/lib/storage";
import type {
  ChannelInfo,
  ChannelProgress,
  PlaylistInfo,
  PlaylistProgress,
  SortOrder,
  Video,
  VisitedChannel,
  VisitedPlaylist,
} from "@/types";

type ActiveSource =
  | { kind: "channel"; info: ChannelInfo }
  | { kind: "playlist"; info: PlaylistInfo };

type WatchProgress = Pick<
  ChannelProgress | PlaylistProgress,
  "watchedIds" | "latestWatchedId" | "sortOrder"
>;

const DEFAULT_CHANNEL_PROGRESS = (channel: ChannelInfo): ChannelProgress => ({
  channelId: channel.channelId,
  channelTitle: channel.title,
  watchedIds: [],
  latestWatchedId: null,
  sortOrder: "oldest",
});

const DEFAULT_PLAYLIST_PROGRESS = (playlist: PlaylistInfo): PlaylistProgress => ({
  playlistId: playlist.playlistId,
  playlistTitle: playlist.title,
  watchedIds: [],
  latestWatchedId: null,
  sortOrder: "oldest",
});

export function BingeApp() {
  const {
    state,
    getProgress,
    initProgress,
    markWatched,
    unmarkWatched,
    setLatestWatched,
    setSortOrder,
    getVideoCache,
    setVideoCache,
    recordVisit,
    getPlaylistProgress,
    initPlaylistProgress,
    markPlaylistWatched,
    unmarkPlaylistWatched,
    setPlaylistLatestWatched,
    setPlaylistSortOrder,
    getPlaylistVideoCache,
    setPlaylistVideoCache,
    recordPlaylistVisit,
  } = useAppState();

  const [activeSource, setActiveSource] = useState<ActiveSource | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingSourceId, setLoadingSourceId] = useState<string | null>(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState("");
  const [pendingUpToHereVideo, setPendingUpToHereVideo] = useState<Video | null>(
    null,
  );
  const [markPreviousAsWatched, setMarkPreviousAsWatched] = useState(false);
  const [playlistNotice, setPlaylistNotice] = useState<string | null>(null);

  const watchProgress: WatchProgress | undefined = useMemo(() => {
    if (!activeSource) return undefined;
    if (activeSource.kind === "channel") {
      return (
        getProgress(activeSource.info.channelId) ??
        DEFAULT_CHANNEL_PROGRESS(activeSource.info)
      );
    }
    return (
      getPlaylistProgress(activeSource.info.playlistId) ??
      DEFAULT_PLAYLIST_PROGRESS(activeSource.info)
    );
  }, [activeSource, getProgress, getPlaylistProgress]);

  const fetchChannelVideos = useCallback(
    async (channelInfo: ChannelInfo, forceRefresh = false) => {
      const cached = getVideoCache(channelInfo.channelId);
      if (!forceRefresh && cached && !isVideoCacheStale(cached)) {
        setVideos(cached.videos);
        return;
      }

      setLoadingVideos(true);
      try {
        const response = await apiFetch(
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

  const fetchPlaylistVideosForSource = useCallback(
    async (playlistInfo: PlaylistInfo, forceRefresh = false) => {
      const cached = getPlaylistVideoCache(playlistInfo.playlistId);
      if (!forceRefresh && cached && !isVideoCacheStale(cached)) {
        setVideos(cached.videos);
        if (isMixPlaylist(playlistInfo.playlistId)) {
          setPlaylistNotice(
            `YouTube Mix playlists are endless — showing the first ${cached.videos.length} videos.`,
          );
        } else {
          setPlaylistNotice(null);
        }
        return;
      }

      setLoadingVideos(true);
      try {
        const response = await apiFetch(
          `/api/playlist/videos?playlistId=${encodeURIComponent(playlistInfo.playlistId)}`,
        );
        const data = (await response.json()) as {
          videos?: Video[];
          truncated?: boolean;
          limit?: number;
          isMixPlaylist?: boolean;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to fetch videos");
        }

        const fetchedVideos = data.videos ?? [];
        setVideos(fetchedVideos);
        setPlaylistVideoCache(playlistInfo.playlistId, {
          playlistId: playlistInfo.playlistId,
          videos: fetchedVideos,
          fetchedAt: Date.now(),
        });

        if (data.truncated && data.limit) {
          setPlaylistNotice(
            data.isMixPlaylist
              ? `YouTube Mix playlists are endless — showing the first ${data.limit} videos.`
              : `Showing the first ${data.limit} videos from this playlist.`,
          );
        } else {
          setPlaylistNotice(null);
        }
      } finally {
        setLoadingVideos(false);
      }
    },
    [getPlaylistVideoCache, setPlaylistVideoCache],
  );

  const openChannel = useCallback(
    async (channelInfo: ChannelInfo, sourceUrl?: string) => {
      setError(null);
      setVideos([]);
      setPlaylistNotice(null);

      initProgress(channelInfo.channelId, channelInfo.title);
      recordVisit(channelInfo, sourceUrl);
      setActiveSource({ kind: "channel", info: channelInfo });

      try {
        await fetchChannelVideos(channelInfo);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch videos",
        );
      }
    },
    [fetchChannelVideos, initProgress, recordVisit],
  );

  const openPlaylist = useCallback(
    async (playlistInfo: PlaylistInfo, sourceUrl?: string) => {
      setError(null);
      setVideos([]);

      initPlaylistProgress(playlistInfo.playlistId, playlistInfo.title);
      recordPlaylistVisit(playlistInfo, sourceUrl);
      setActiveSource({ kind: "playlist", info: playlistInfo });

      try {
        await fetchPlaylistVideosForSource(playlistInfo);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch videos",
        );
      }
    },
    [fetchPlaylistVideosForSource, initPlaylistProgress, recordPlaylistVisit],
  );

  const loadSource = useCallback(
    async (url: string) => {
      setLoadingSource(true);
      setError(null);
      setLastUrl(url);

      try {
        const parsed = parseYoutubeInput(url);
        if (!parsed) {
          throw new Error(
            "Invalid URL. Try a channel (@handle, /channel/UC…) or playlist (/playlist?list=PL…) link.",
          );
        }

        if (parsed.kind === "playlist") {
          const resolveResponse = await apiFetch("/api/playlist/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          const playlistData = (await resolveResponse.json()) as PlaylistInfo & {
            error?: string;
          };

          if (!resolveResponse.ok) {
            throw new Error(playlistData.error ?? "Failed to resolve playlist");
          }

          await openPlaylist(playlistData, url);
          return;
        }

        const resolveResponse = await apiFetch("/api/channel/resolve", {
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

        await openChannel(channelData, url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setActiveSource(null);
        setVideos([]);
        setLoadingVideos(false);
      } finally {
        setLoadingSource(false);
      }
    },
    [openChannel, openPlaylist],
  );

  const openVisitedChannel = useCallback(
    async (visited: VisitedChannel) => {
      setLoadingSourceId(visited.channelId);
      setError(null);

      try {
        await openChannel(
          {
            channelId: visited.channelId,
            title: visited.channelTitle,
            uploadsPlaylistId: visited.uploadsPlaylistId,
          },
          visited.sourceUrl,
        );
      } finally {
        setLoadingSourceId(null);
      }
    },
    [openChannel],
  );

  const openVisitedPlaylist = useCallback(
    async (visited: VisitedPlaylist) => {
      setLoadingSourceId(visited.playlistId);
      setError(null);

      try {
        await openPlaylist(
          {
            playlistId: visited.playlistId,
            title: visited.playlistTitle,
          },
          visited.sourceUrl,
        );
      } finally {
        setLoadingSourceId(null);
      }
    },
    [openPlaylist],
  );

  const handleBack = useCallback(() => {
    setActiveSource(null);
    setVideos([]);
    setError(null);
    setPlaylistNotice(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!activeSource) return;
    setRefreshing(true);
    setError(null);
    try {
      if (activeSource.kind === "channel") {
        await fetchChannelVideos(activeSource.info, true);
      } else {
        await fetchPlaylistVideosForSource(activeSource.info, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh videos");
    } finally {
      setRefreshing(false);
    }
  }, [activeSource, fetchChannelVideos, fetchPlaylistVideosForSource]);

  const sortedVideos = useMemo(() => {
    if (!watchProgress) return videos;
    if (activeSource?.kind === "playlist") {
      return sortPlaylistVideos(videos, watchProgress.sortOrder);
    }
    return sortVideos(videos, watchProgress.sortOrder);
  }, [videos, watchProgress, activeSource]);

  const nextVideo = useMemo(() => {
    if (!watchProgress || videos.length === 0) return null;
    return getNextVideo(videos, watchProgress, {
      order: activeSource?.kind === "playlist" ? "playlist" : "published",
    });
  }, [videos, watchProgress, activeSource]);

  const watchedSet = useMemo(
    () => new Set(watchProgress?.watchedIds ?? []),
    [watchProgress?.watchedIds],
  );

  const watchedCount = watchProgress?.watchedIds.length ?? 0;
  const allWatched = videos.length > 0 && watchedCount >= videos.length;
  const isLoading = loadingSource || loadingVideos;
  const isHome = activeSource === null;

  const sourceTitle =
    activeSource?.kind === "channel"
      ? activeSource.info.title
      : activeSource?.info.title;

  function handleToggleWatched(videoId: string, watched: boolean) {
    if (!activeSource) return;

    if (activeSource.kind === "channel") {
      if (watched) {
        markWatched(activeSource.info.channelId, videoId);
      } else {
        unmarkWatched(activeSource.info.channelId, videoId);
      }
      return;
    }

    if (watched) {
      markPlaylistWatched(activeSource.info.playlistId, videoId);
    } else {
      unmarkPlaylistWatched(activeSource.info.playlistId, videoId);
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
    if (!activeSource || !pendingUpToHereVideo) return;

    const videoIndex = sortedVideos.findIndex(
      (video) => video.id === pendingUpToHereVideo.id,
    );

    const markPreviousIds =
      markPreviousAsWatched && videoIndex >= 0
        ? sortedVideos.slice(0, videoIndex + 1).map((video) => video.id)
        : undefined;

    if (activeSource.kind === "channel") {
      if (markPreviousIds) {
        setLatestWatched(activeSource.info.channelId, pendingUpToHereVideo.id, {
          markPreviousIds,
        });
      } else {
        setLatestWatched(activeSource.info.channelId, pendingUpToHereVideo.id);
      }
    } else if (markPreviousIds) {
      setPlaylistLatestWatched(activeSource.info.playlistId, pendingUpToHereVideo.id, {
        markPreviousIds,
      });
    } else {
      setPlaylistLatestWatched(activeSource.info.playlistId, pendingUpToHereVideo.id);
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
    if (!activeSource) return;

    if (activeSource.kind === "channel") {
      setSortOrder(activeSource.info.channelId, sortOrder);
    } else {
      setPlaylistSortOrder(activeSource.info.playlistId, sortOrder);
    }
  }

  const watchedLabel = loadingVideos
    ? "Loading videos…"
    : `${watchedCount} / ${videos.length} watched`;

  const sortOldestLabel =
    activeSource?.kind === "playlist" ? "First to last" : "Oldest first";
  const sortNewestLabel =
    activeSource?.kind === "playlist" ? "Last to first" : "Newest first";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {isHome ? (
          <>
            <header className="mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-white">YT Binger</h1>
              <p className="mt-2 text-zinc-400">
                Binge YouTube channels or playlists in order — never miss a video.
              </p>
            </header>

            <ChannelInput
              onLoad={loadSource}
              loading={loadingSource}
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

            <VisitedChannelsList
              channels={state.visitedChannels}
              progress={state.progress}
              videoCache={state.videoCache}
              onOpen={openVisitedChannel}
              loadingChannelId={
                loadingSourceId && state.visitedChannels.some(
                  (visited) => visited.channelId === loadingSourceId,
                )
                  ? loadingSourceId
                  : null
              }
            />

            <VisitedPlaylistsList
              playlists={state.visitedPlaylists ?? []}
              progress={state.playlistProgress ?? {}}
              videoCache={state.playlistVideoCache ?? {}}
              onOpen={openVisitedPlaylist}
              loadingPlaylistId={
                loadingSourceId && (state.visitedPlaylists ?? []).some(
                  (visited) => visited.playlistId === loadingSourceId,
                )
                  ? loadingSourceId
                  : null
              }
            />

            {isLoading ? (
              <p role="status" className="mt-8 text-center text-zinc-500">
                Loading…
              </p>
            ) : null}
          </>
        ) : (
          activeSource &&
          watchProgress && (
            <div className="space-y-8">
              <ChannelHeader
                title={sourceTitle ?? "Unknown"}
                watchedLabel={watchedLabel}
                onBack={handleBack}
              />

              {error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </p>
              ) : null}

              {playlistNotice ? (
                <p className="rounded-lg border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
                  {playlistNotice}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  Sort
                  <select
                    value={watchProgress.sortOrder}
                    onChange={(event) =>
                      handleSortChange(event.target.value as SortOrder)
                    }
                    disabled={loadingVideos}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:border-red-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="oldest">{sortOldestLabel}</option>
                    <option value="newest">{sortNewestLabel}</option>
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

              {loadingVideos ? (
                <div
                  role="status"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center text-zinc-400"
                >
                  Fetching video list from YouTube…
                </div>
              ) : (
                <>
                  <NextVideoCard
                    video={nextVideo}
                    completed={allWatched && !nextVideo}
                    onMarkWatched={
                      nextVideo
                        ? () => handleToggleWatched(nextVideo.id, true)
                        : undefined
                    }
                  />

                  <VideoList
                    videos={sortedVideos}
                    watchedIds={watchedSet}
                    latestWatchedId={watchProgress.latestWatchedId}
                    nextVideoId={nextVideo?.id ?? null}
                    onToggleWatched={handleToggleWatched}
                    onRequestSetLatestWatched={handleRequestSetLatestWatched}
                  />
                </>
              )}
            </div>
          )
        )}

        <UpToHereDialog
          video={pendingUpToHereVideo}
          open={pendingUpToHereVideo !== null}
          markPrevious={markPreviousAsWatched}
          previousCount={pendingPreviousCount}
          onMarkPreviousChange={setMarkPreviousAsWatched}
          onConfirm={handleConfirmUpToHere}
          onCancel={handleCancelUpToHere}
        />
      </div>
    </div>
  );
}
