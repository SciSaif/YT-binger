"use client";

import { useCallback, useSyncExternalStore } from "react";
import { scheduleCloudSync } from "@/lib/cloud-sync";
import type { AppState, ChannelInfo, SortOrder, VideoCache, VisitedChannel } from "@/types";

const STORAGE_KEY = "yt-binger";
export const VIDEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const DEFAULT_STATE: AppState = {
  progress: {},
  videoCache: {},
  visitedChannels: [],
};

let clientState: AppState | null = null;

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function readAppState(): AppState {
  return readStateFromStorage();
}

export function replaceAppState(state: AppState): void {
  clientState = {
    progress: state.progress ?? {},
    videoCache: state.videoCache ?? {},
    visitedChannels: state.visitedChannels ?? [],
  };
  writeState(clientState);
  scheduleCloudSync(clientState);
  emitChange();
}

function readStateFromStorage(): AppState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    return {
      progress: parsed.progress ?? {},
      videoCache: parsed.videoCache ?? {},
      visitedChannels: parsed.visitedChannels ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getSnapshot(): AppState {
  if (clientState === null) {
    clientState = readStateFromStorage();
  }
  return clientState;
}

function getServerSnapshot(): AppState {
  return DEFAULT_STATE;
}

function updateState(updater: (prev: AppState) => AppState): void {
  const prev = getSnapshot();
  const next = updater(prev);
  clientState = next;
  writeState(next);
  scheduleCloudSync(next);
  emitChange();
}

export function isVideoCacheStale(cache: VideoCache | undefined): boolean {
  if (!cache) return true;
  return Date.now() - cache.fetchedAt > VIDEO_CACHE_TTL_MS;
}

export function useAppState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const persist = useCallback((updater: (prev: AppState) => AppState) => {
    updateState(updater);
  }, []);

  const getProgress = useCallback(
    (channelId: string) => state.progress[channelId],
    [state.progress],
  );

  const initProgress = useCallback(
    (channelId: string, channelTitle: string) => {
      persist((prev) => {
        if (prev.progress[channelId]) {
          return {
            ...prev,
            progress: {
              ...prev.progress,
              [channelId]: {
                ...prev.progress[channelId],
                channelTitle,
              },
            },
          };
        }

        return {
          ...prev,
          progress: {
            ...prev.progress,
            [channelId]: {
              channelId,
              channelTitle,
              watchedIds: [],
              latestWatchedId: null,
              sortOrder: "oldest",
            },
          },
        };
      });
    },
    [persist],
  );

  const markWatched = useCallback(
    (channelId: string, videoId: string) => {
      persist((prev) => {
        const current = prev.progress[channelId];
        if (!current) return prev;

        const watchedIds = current.watchedIds.includes(videoId)
          ? current.watchedIds
          : [...current.watchedIds, videoId];

        return {
          ...prev,
          progress: {
            ...prev.progress,
            [channelId]: {
              ...current,
              watchedIds,
              latestWatchedId: videoId,
            },
          },
        };
      });
    },
    [persist],
  );

  const unmarkWatched = useCallback(
    (channelId: string, videoId: string) => {
      persist((prev) => {
        const current = prev.progress[channelId];
        if (!current) return prev;

        return {
          ...prev,
          progress: {
            ...prev.progress,
            [channelId]: {
              ...current,
              watchedIds: current.watchedIds.filter((id) => id !== videoId),
              latestWatchedId:
                current.latestWatchedId === videoId
                  ? null
                  : current.latestWatchedId,
            },
          },
        };
      });
    },
    [persist],
  );

  const setLatestWatched = useCallback(
    (
      channelId: string,
      videoId: string,
      options?: { markPreviousIds?: string[] },
    ) => {
      persist((prev) => {
        const current = prev.progress[channelId];
        if (!current) return prev;

        const markPreviousIds = options?.markPreviousIds ?? [];
        const watchedIds =
          markPreviousIds.length > 0
            ? [...new Set([...current.watchedIds, ...markPreviousIds, videoId])]
            : current.watchedIds;

        return {
          ...prev,
          progress: {
            ...prev.progress,
            [channelId]: {
              ...current,
              watchedIds,
              latestWatchedId: videoId,
            },
          },
        };
      });
    },
    [persist],
  );

  const setSortOrder = useCallback(
    (channelId: string, sortOrder: SortOrder) => {
      persist((prev) => {
        const current = prev.progress[channelId];
        if (!current) return prev;

        return {
          ...prev,
          progress: {
            ...prev.progress,
            [channelId]: {
              ...current,
              sortOrder,
            },
          },
        };
      });
    },
    [persist],
  );

  const getVideoCache = useCallback(
    (channelId: string) => state.videoCache[channelId],
    [state.videoCache],
  );

  const setVideoCache = useCallback(
    (channelId: string, cache: VideoCache) => {
      persist((prev) => ({
        ...prev,
        videoCache: {
          ...prev.videoCache,
          [channelId]: cache,
        },
      }));
    },
    [persist],
  );

  const recordVisit = useCallback(
    (channel: ChannelInfo, sourceUrl?: string) => {
      persist((prev) => {
        const entry: VisitedChannel = {
          channelId: channel.channelId,
          channelTitle: channel.title,
          uploadsPlaylistId: channel.uploadsPlaylistId,
          lastVisitedAt: Date.now(),
          sourceUrl,
        };
        const visitedChannels = [
          entry,
          ...(prev.visitedChannels ?? []).filter(
            (visited) => visited.channelId !== channel.channelId,
          ),
        ];

        return { ...prev, visitedChannels };
      });
    },
    [persist],
  );

  return {
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
  };
}
