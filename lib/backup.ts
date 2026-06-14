import { readApiKeySettings } from "@/lib/api-key-storage";
import { readAppState, replaceAppState } from "@/lib/storage";
import { replaceApiKeySettings } from "@/lib/use-api-key-settings";
import type {
  AppState,
  ChannelProgress,
  PlaylistProgress,
  PlaylistVideoCache,
  SortOrder,
  Video,
  VideoCache,
  VisitedChannel,
  VisitedPlaylist,
} from "@/types";
import type { ApiKeySettings } from "@/types/api-key";
import { BACKUP_VERSION, type YtBingerBackup } from "@/types/backup";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSortOrder(value: unknown): SortOrder {
  return value === "newest" ? "newest" : "oldest";
}

function normalizeProgress(value: unknown): ChannelProgress | null {
  if (!isRecord(value) || typeof value.channelId !== "string") return null;

  return {
    channelId: value.channelId,
    channelTitle: typeof value.channelTitle === "string" ? value.channelTitle : "Unknown channel",
    watchedIds: Array.isArray(value.watchedIds)
      ? value.watchedIds.filter((id): id is string => typeof id === "string")
      : [],
    latestWatchedId:
      typeof value.latestWatchedId === "string" ? value.latestWatchedId : null,
    sortOrder: normalizeSortOrder(value.sortOrder),
  };
}

function normalizeVideo(value: unknown): Video | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;

  return {
    id: value.id,
    title: typeof value.title === "string" ? value.title : "Untitled",
    thumbnail: typeof value.thumbnail === "string" ? value.thumbnail : "",
    publishedAt: typeof value.publishedAt === "string" ? value.publishedAt : "",
    duration: typeof value.duration === "string" ? value.duration : "0:00",
  };
}

function normalizeVideoCache(value: unknown): VideoCache | null {
  if (!isRecord(value) || typeof value.channelId !== "string") return null;
  if (!Array.isArray(value.videos)) return null;

  const videos = value.videos
    .map(normalizeVideo)
    .filter((video): video is Video => video !== null);

  return {
    channelId: value.channelId,
    videos,
    fetchedAt: typeof value.fetchedAt === "number" ? value.fetchedAt : Date.now(),
  };
}

function normalizeVisitedChannel(value: unknown): VisitedChannel | null {
  if (
    !isRecord(value) ||
    typeof value.channelId !== "string" ||
    typeof value.channelTitle !== "string" ||
    typeof value.uploadsPlaylistId !== "string"
  ) {
    return null;
  }

  return {
    channelId: value.channelId,
    channelTitle: value.channelTitle,
    uploadsPlaylistId: value.uploadsPlaylistId,
    lastVisitedAt:
      typeof value.lastVisitedAt === "number" ? value.lastVisitedAt : Date.now(),
    sourceUrl: typeof value.sourceUrl === "string" ? value.sourceUrl : undefined,
  };
}

function normalizeVisitedPlaylist(value: unknown): VisitedPlaylist | null {
  if (
    !isRecord(value) ||
    typeof value.playlistId !== "string" ||
    typeof value.playlistTitle !== "string"
  ) {
    return null;
  }

  return {
    playlistId: value.playlistId,
    playlistTitle: value.playlistTitle,
    lastVisitedAt:
      typeof value.lastVisitedAt === "number" ? value.lastVisitedAt : Date.now(),
    sourceUrl: typeof value.sourceUrl === "string" ? value.sourceUrl : undefined,
  };
}

function normalizePlaylistProgress(value: unknown): PlaylistProgress | null {
  if (!isRecord(value) || typeof value.playlistId !== "string") return null;

  return {
    playlistId: value.playlistId,
    playlistTitle:
      typeof value.playlistTitle === "string" ? value.playlistTitle : "Unknown playlist",
    watchedIds: Array.isArray(value.watchedIds)
      ? value.watchedIds.filter((id): id is string => typeof id === "string")
      : [],
    latestWatchedId:
      typeof value.latestWatchedId === "string" ? value.latestWatchedId : null,
    sortOrder: normalizeSortOrder(value.sortOrder),
  };
}

function normalizePlaylistVideoCache(value: unknown): PlaylistVideoCache | null {
  if (!isRecord(value) || typeof value.playlistId !== "string") return null;
  if (!Array.isArray(value.videos)) return null;

  const videos = value.videos
    .map(normalizeVideo)
    .filter((video): video is Video => video !== null);

  return {
    playlistId: value.playlistId,
    videos,
    fetchedAt: typeof value.fetchedAt === "number" ? value.fetchedAt : Date.now(),
  };
}

function normalizeAppState(value: unknown): AppState | null {
  if (!isRecord(value)) return null;

  const progress: Record<string, ChannelProgress> = {};
  if (isRecord(value.progress)) {
    for (const [key, entry] of Object.entries(value.progress)) {
      const normalized = normalizeProgress(entry);
      if (normalized) progress[key] = normalized;
    }
  }

  const videoCache: Record<string, VideoCache> = {};
  if (isRecord(value.videoCache)) {
    for (const [key, entry] of Object.entries(value.videoCache)) {
      const normalized = normalizeVideoCache(entry);
      if (normalized) videoCache[key] = normalized;
    }
  }

  const visitedChannels = Array.isArray(value.visitedChannels)
    ? value.visitedChannels
        .map(normalizeVisitedChannel)
        .filter((entry): entry is VisitedChannel => entry !== null)
    : [];

  const playlistProgress: Record<string, PlaylistProgress> = {};
  if (isRecord(value.playlistProgress)) {
    for (const [key, entry] of Object.entries(value.playlistProgress)) {
      const normalized = normalizePlaylistProgress(entry);
      if (normalized) playlistProgress[key] = normalized;
    }
  }

  const playlistVideoCache: Record<string, PlaylistVideoCache> = {};
  if (isRecord(value.playlistVideoCache)) {
    for (const [key, entry] of Object.entries(value.playlistVideoCache)) {
      const normalized = normalizePlaylistVideoCache(entry);
      if (normalized) playlistVideoCache[key] = normalized;
    }
  }

  const visitedPlaylists = Array.isArray(value.visitedPlaylists)
    ? value.visitedPlaylists
        .map(normalizeVisitedPlaylist)
        .filter((entry): entry is VisitedPlaylist => entry !== null)
    : [];

  return {
    progress,
    videoCache,
    visitedChannels,
    playlistProgress,
    playlistVideoCache,
    visitedPlaylists,
  };
}

function normalizeApiKeySettings(value: unknown): ApiKeySettings | null {
  if (!isRecord(value)) return null;

  return {
    onboardingComplete: Boolean(value.onboardingComplete),
    mode: value.mode === "custom" ? "custom" : "guest",
    customKey: typeof value.customKey === "string" ? value.customKey : "",
  };
}

export function createBackup(): YtBingerBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    app: readAppState(),
    apiKey: readApiKeySettings(),
  };
}

export function parseBackup(raw: string): YtBingerBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (!isRecord(parsed) || parsed.version !== BACKUP_VERSION) {
    throw new Error("Unsupported or missing backup version.");
  }

  const app = normalizeAppState(parsed.app);
  const apiKey = normalizeApiKeySettings(parsed.apiKey);

  if (!app || !apiKey) {
    throw new Error("Backup file is missing required data.");
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === "number" ? parsed.exportedAt : Date.now(),
    app,
    apiKey,
  };
}

export function importBackup(backup: YtBingerBackup): void {
  replaceAppState(backup.app);
  replaceApiKeySettings(backup.apiKey);
}

export function downloadBackupFile(backup: YtBingerBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const date = new Date(backup.exportedAt).toISOString().slice(0, 10);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `yt-binger-backup-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function summarizeBackup(backup: YtBingerBackup): string {
  const channelCount = backup.app.visitedChannels.length;
  const playlistCount = backup.app.visitedPlaylists?.length ?? 0;
  const watchedTotal =
    Object.values(backup.app.progress).reduce(
      (sum, progress) => sum + progress.watchedIds.length,
      0,
    ) +
    Object.values(backup.app.playlistProgress ?? {}).reduce(
      (sum, progress) => sum + progress.watchedIds.length,
      0,
    );

  const parts: string[] = [];
  if (channelCount > 0) {
    parts.push(`${channelCount} channel${channelCount === 1 ? "" : "s"}`);
  }
  if (playlistCount > 0) {
    parts.push(`${playlistCount} playlist${playlistCount === 1 ? "" : "s"}`);
  }

  const sourceLabel = parts.length > 0 ? parts.join(", ") : "no sources";
  return `${sourceLabel}, ${watchedTotal} watched video mark${watchedTotal === 1 ? "" : "s"}`;
}
