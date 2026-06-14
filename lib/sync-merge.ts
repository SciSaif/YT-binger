import type {
  AppState,
  ChannelProgress,
  PlaylistProgress,
  PlaylistVideoCache,
  VisitedChannel,
  VisitedPlaylist,
  VideoCache,
} from "@/types";

const EMPTY_STATE: AppState = {
  progress: {},
  videoCache: {},
  visitedChannels: [],
  playlistProgress: {},
  playlistVideoCache: {},
  visitedPlaylists: [],
};

type WatchProgressFields = Pick<
  ChannelProgress,
  "watchedIds" | "latestWatchedId" | "sortOrder"
>;

function mergeWatchProgressFields(
  local: WatchProgressFields | undefined,
  cloud: WatchProgressFields | undefined,
): WatchProgressFields | undefined {
  if (!local && !cloud) return undefined;
  if (!local) return cloud;
  if (!cloud) return local;

  const watchedIds = [...new Set([...local.watchedIds, ...cloud.watchedIds])];
  const localCount = local.watchedIds.length;
  const cloudCount = cloud.watchedIds.length;

  let latestWatchedId = local.latestWatchedId;
  if (cloudCount > localCount) {
    latestWatchedId = cloud.latestWatchedId;
  } else if (cloudCount === localCount && cloud.latestWatchedId) {
    latestWatchedId = cloud.latestWatchedId ?? local.latestWatchedId;
  }

  return {
    watchedIds,
    latestWatchedId,
    sortOrder: local.sortOrder ?? cloud.sortOrder,
  };
}

function mergeChannelProgress(
  local: ChannelProgress | undefined,
  cloud: ChannelProgress | undefined,
): ChannelProgress | undefined {
  const merged = mergeWatchProgressFields(local, cloud);
  if (!merged) return undefined;

  return {
    channelId: local?.channelId || cloud?.channelId || "",
    channelTitle: local?.channelTitle || cloud?.channelTitle || "Unknown channel",
    ...merged,
  };
}

function mergeCachedVideos(
  local: { videos: VideoCache["videos"]; fetchedAt: number } | undefined,
  cloud: { videos: VideoCache["videos"]; fetchedAt: number } | undefined,
): { videos: VideoCache["videos"]; fetchedAt: number } | undefined {
  if (!local && !cloud) return undefined;
  if (!local) return cloud;
  if (!cloud) return local;
  return local.fetchedAt >= cloud.fetchedAt ? local : cloud;
}

function mergeVideoCache(
  local: VideoCache | undefined,
  cloud: VideoCache | undefined,
): VideoCache | undefined {
  const merged = mergeCachedVideos(local, cloud);
  if (!merged) return undefined;

  return {
    channelId: local?.channelId || cloud?.channelId || "",
    videos: merged.videos,
    fetchedAt: merged.fetchedAt,
  };
}

function mergeVisitedChannels(
  local: VisitedChannel[],
  cloud: VisitedChannel[],
): VisitedChannel[] {
  const byId = new Map<string, VisitedChannel>();

  for (const entry of [...cloud, ...local]) {
    const existing = byId.get(entry.channelId);
    if (!existing || entry.lastVisitedAt >= existing.lastVisitedAt) {
      byId.set(entry.channelId, entry);
    }
  }

  return [...byId.values()].sort((a, b) => b.lastVisitedAt - a.lastVisitedAt);
}

function mergeVisitedPlaylists(
  local: VisitedPlaylist[],
  cloud: VisitedPlaylist[],
): VisitedPlaylist[] {
  const byId = new Map<string, VisitedPlaylist>();

  for (const entry of [...cloud, ...local]) {
    const existing = byId.get(entry.playlistId);
    if (!existing || entry.lastVisitedAt >= existing.lastVisitedAt) {
      byId.set(entry.playlistId, entry);
    }
  }

  return [...byId.values()].sort((a, b) => b.lastVisitedAt - a.lastVisitedAt);
}

function mergePlaylistProgressRecord(
  local: Record<string, PlaylistProgress>,
  cloud: Record<string, PlaylistProgress>,
): Record<string, PlaylistProgress> {
  const ids = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  const merged: Record<string, PlaylistProgress> = {};

  for (const playlistId of ids) {
    const progressFields = mergeWatchProgressFields(
      local[playlistId],
      cloud[playlistId],
    );
    if (progressFields) {
      merged[playlistId] = {
        playlistId,
        playlistTitle:
          local[playlistId]?.playlistTitle ||
          cloud[playlistId]?.playlistTitle ||
          "Unknown playlist",
        ...progressFields,
      };
    }
  }

  return merged;
}

function mergePlaylistVideoCacheRecord(
  local: Record<string, PlaylistVideoCache>,
  cloud: Record<string, PlaylistVideoCache>,
): Record<string, PlaylistVideoCache> {
  const ids = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  const merged: Record<string, PlaylistVideoCache> = {};

  for (const playlistId of ids) {
    const cached = mergeCachedVideos(local[playlistId], cloud[playlistId]);
    if (cached) {
      merged[playlistId] = {
        playlistId,
        videos: cached.videos,
        fetchedAt: cached.fetchedAt,
      };
    }
  }

  return merged;
}

export function mergeAppStates(local: AppState, cloud: AppState): AppState {
  const localState = local ?? EMPTY_STATE;
  const cloudState = cloud ?? EMPTY_STATE;

  const channelIds = new Set([
    ...Object.keys(localState.progress ?? {}),
    ...Object.keys(cloudState.progress ?? {}),
  ]);

  const progress: Record<string, ChannelProgress> = {};
  for (const channelId of channelIds) {
    const merged = mergeChannelProgress(
      localState.progress?.[channelId],
      cloudState.progress?.[channelId],
    );
    if (merged) {
      progress[channelId] = merged;
    }
  }

  const cacheIds = new Set([
    ...Object.keys(localState.videoCache ?? {}),
    ...Object.keys(cloudState.videoCache ?? {}),
  ]);

  const videoCache: Record<string, VideoCache> = {};
  for (const channelId of cacheIds) {
    const merged = mergeVideoCache(
      localState.videoCache?.[channelId],
      cloudState.videoCache?.[channelId],
    );
    if (merged) {
      videoCache[channelId] = merged;
    }
  }

  return {
    progress,
    videoCache,
    visitedChannels: mergeVisitedChannels(
      localState.visitedChannels ?? [],
      cloudState.visitedChannels ?? [],
    ),
    playlistProgress: mergePlaylistProgressRecord(
      localState.playlistProgress ?? {},
      cloudState.playlistProgress ?? {},
    ),
    playlistVideoCache: mergePlaylistVideoCacheRecord(
      localState.playlistVideoCache ?? {},
      cloudState.playlistVideoCache ?? {},
    ),
    visitedPlaylists: mergeVisitedPlaylists(
      localState.visitedPlaylists ?? [],
      cloudState.visitedPlaylists ?? [],
    ),
  };
}

export function normalizeAppState(state: AppState | null | undefined): AppState {
  if (!state) return { ...EMPTY_STATE };
  return {
    progress: state.progress ?? {},
    videoCache: state.videoCache ?? {},
    visitedChannels: state.visitedChannels ?? [],
    playlistProgress: state.playlistProgress ?? {},
    playlistVideoCache: state.playlistVideoCache ?? {},
    visitedPlaylists: state.visitedPlaylists ?? [],
  };
}
