import type { AppState, ChannelProgress, VisitedChannel, VideoCache } from "@/types";

const EMPTY_STATE: AppState = {
  progress: {},
  videoCache: {},
  visitedChannels: [],
};

function mergeChannelProgress(
  local: ChannelProgress | undefined,
  cloud: ChannelProgress | undefined,
): ChannelProgress | undefined {
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
    channelId: local.channelId || cloud.channelId,
    channelTitle: local.channelTitle || cloud.channelTitle,
    watchedIds,
    latestWatchedId,
    sortOrder: local.sortOrder ?? cloud.sortOrder,
  };
}

function mergeVideoCache(
  local: VideoCache | undefined,
  cloud: VideoCache | undefined,
): VideoCache | undefined {
  if (!local && !cloud) return undefined;
  if (!local) return cloud;
  if (!cloud) return local;
  return local.fetchedAt >= cloud.fetchedAt ? local : cloud;
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
  };
}

export function normalizeAppState(state: AppState | null | undefined): AppState {
  if (!state) return { ...EMPTY_STATE };
  return {
    progress: state.progress ?? {},
    videoCache: state.videoCache ?? {},
    visitedChannels: state.visitedChannels ?? [],
  };
}
