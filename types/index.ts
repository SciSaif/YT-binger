export type SortOrder = "oldest" | "newest";

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
}

export interface ChannelInfo {
  channelId: string;
  title: string;
  uploadsPlaylistId: string;
}

export interface ChannelProgress {
  channelId: string;
  channelTitle: string;
  watchedIds: string[];
  latestWatchedId: string | null;
  sortOrder: SortOrder;
}

export interface VideoCache {
  channelId: string;
  videos: Video[];
  fetchedAt: number;
}

export interface AppState {
  progress: Record<string, ChannelProgress>;
  videoCache: Record<string, VideoCache>;
  visitedChannels: VisitedChannel[];
}

export interface VisitedChannel {
  channelId: string;
  channelTitle: string;
  uploadsPlaylistId: string;
  lastVisitedAt: number;
  sourceUrl?: string;
}

export type ParsedChannelInput =
  | { type: "channelId"; value: string }
  | { type: "handle"; value: string }
  | { type: "username"; value: string }
  | { type: "custom"; value: string };
