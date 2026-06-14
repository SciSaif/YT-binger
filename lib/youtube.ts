import type { ChannelInfo, ParsedChannelInput, PlaylistInfo, Video } from "@/types";
import {
  getPlaylistVideoLimit,
  isMixPlaylist,
  MAX_PLAYLIST_PAGES,
} from "@/lib/playlist-limits";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeListResponse<T> {
  items?: T[];
  nextPageToken?: string;
  error?: { message?: string };
}

interface ChannelItem {
  id: string;
  snippet?: { title?: string };
  contentDetails?: {
    relatedPlaylists?: { uploads?: string };
  };
}

interface PlaylistItem {
  snippet?: {
    resourceId?: { videoId?: string };
  };
}

interface PlaylistMetaItem {
  id: string;
  snippet?: { title?: string };
}

interface VideoItem {
  id: string;
  snippet?: {
    title?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
  contentDetails?: { duration?: string };
}

async function youtubeFetch<T>(
  apiKey: string,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  url.searchParams.set("key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  const data = (await response.json()) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? `YouTube API error: ${response.status}`);
  }

  return data;
}

function channelFromItem(item: ChannelItem): ChannelInfo {
  const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist for this channel");
  }

  return {
    channelId: item.id,
    title: item.snippet?.title ?? "Unknown channel",
    uploadsPlaylistId,
  };
}

async function fetchChannelById(
  apiKey: string,
  channelId: string,
): Promise<ChannelInfo> {
  const data = await youtubeFetch<YouTubeListResponse<ChannelItem>>(apiKey, "channels", {
    part: "snippet,contentDetails",
    id: channelId,
  });

  const item = data.items?.[0];
  if (!item) {
    throw new Error("Channel not found");
  }

  return channelFromItem(item);
}

async function fetchChannelByHandle(
  apiKey: string,
  handle: string,
): Promise<ChannelInfo> {
  const data = await youtubeFetch<YouTubeListResponse<ChannelItem>>(apiKey, "channels", {
    part: "snippet,contentDetails",
    forHandle: handle,
  });

  const item = data.items?.[0];
  if (!item) {
    throw new Error("Channel not found");
  }

  return channelFromItem(item);
}

async function fetchChannelByUsername(
  apiKey: string,
  username: string,
): Promise<ChannelInfo> {
  const data = await youtubeFetch<YouTubeListResponse<ChannelItem>>(apiKey, "channels", {
    part: "snippet,contentDetails",
    forUsername: username,
  });

  const item = data.items?.[0];
  if (!item) {
    throw new Error("Channel not found");
  }

  return channelFromItem(item);
}

async function searchChannel(apiKey: string, query: string): Promise<ChannelInfo> {
  const data = await youtubeFetch<
    YouTubeListResponse<{ id?: { channelId?: string } }>
  >(apiKey, "search", {
    part: "snippet",
    type: "channel",
    q: query,
    maxResults: "1",
  });

  const channelId = data.items?.[0]?.id?.channelId;
  if (!channelId) {
    throw new Error("Channel not found");
  }

  return fetchChannelById(apiKey, channelId);
}

export async function resolveChannel(
  parsed: ParsedChannelInput,
  apiKey: string,
): Promise<ChannelInfo> {
  switch (parsed.type) {
    case "channelId":
      return fetchChannelById(apiKey, parsed.value);
    case "handle":
      return fetchChannelByHandle(apiKey, parsed.value);
    case "username":
      return fetchChannelByUsername(apiKey, parsed.value);
    case "custom":
      return searchChannel(apiKey, parsed.value);
  }
}

export async function resolvePlaylist(
  playlistId: string,
  apiKey: string,
): Promise<PlaylistInfo> {
  const data = await youtubeFetch<YouTubeListResponse<PlaylistMetaItem>>(
    apiKey,
    "playlists",
    {
      part: "snippet",
      id: playlistId,
    },
  );

  const item = data.items?.[0];
  if (!item) {
    throw new Error("Playlist not found");
  }

  return {
    playlistId: item.id,
    title: item.snippet?.title ?? "Unknown playlist",
  };
}

export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function fetchVideoDetails(apiKey: string, videoIds: string[]): Promise<Video[]> {
  if (videoIds.length === 0) return [];

  const data = await youtubeFetch<YouTubeListResponse<VideoItem>>(apiKey, "videos", {
    part: "snippet,contentDetails",
    id: videoIds.join(","),
  });

  return (data.items ?? []).map((item) => ({
    id: item.id,
    title: item.snippet?.title ?? "Untitled",
    thumbnail:
      item.snippet?.thumbnails?.medium?.url ??
      item.snippet?.thumbnails?.default?.url ??
      "",
    publishedAt: item.snippet?.publishedAt ?? "",
    duration: formatDuration(item.contentDetails?.duration ?? "PT0S"),
  }));
}

async function collectPlaylistVideoIds(
  playlistId: string,
  apiKey: string,
  maxItems = getPlaylistVideoLimit(playlistId),
): Promise<string[]> {
  const videoIds: string[] = [];
  const seenPageTokens = new Set<string>();
  let pageToken: string | undefined;
  let pages = 0;

  do {
    if (pages >= MAX_PLAYLIST_PAGES || videoIds.length >= maxItems) {
      break;
    }

    const params: Record<string, string> = {
      part: "snippet",
      playlistId,
      maxResults: "50",
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }

    const data = await youtubeFetch<YouTubeListResponse<PlaylistItem>>(
      apiKey,
      "playlistItems",
      params,
    );

    pages += 1;

    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (videoId) {
        videoIds.push(videoId);
        if (videoIds.length >= maxItems) {
          break;
        }
      }
    }

    const nextPageToken = data.nextPageToken;
    if (!nextPageToken || seenPageTokens.has(nextPageToken)) {
      break;
    }

    seenPageTokens.add(nextPageToken);
    pageToken = nextPageToken;
  } while (pageToken);

  return videoIds.slice(0, maxItems);
}

export interface FetchPlaylistVideosResult {
  videos: Video[];
  truncated: boolean;
  limit: number;
}

export async function fetchPlaylistVideos(
  playlistId: string,
  apiKey: string,
): Promise<FetchPlaylistVideosResult> {
  const limit = getPlaylistVideoLimit(playlistId);
  const videoIds = await collectPlaylistVideoIds(playlistId, apiKey, limit);
  const detailsById = new Map<string, Video>();

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const details = await fetchVideoDetails(apiKey, batch);
    for (const video of details) {
      detailsById.set(video.id, video);
    }
  }

  const videos = videoIds
    .map((id) => detailsById.get(id))
    .filter((video): video is Video => video !== undefined);

  return {
    videos,
    truncated: isMixPlaylist(playlistId) || videos.length >= limit,
    limit,
  };
}

export async function fetchAllVideos(
  uploadsPlaylistId: string,
  apiKey: string,
): Promise<Video[]> {
  const videoIds = await collectPlaylistVideoIds(uploadsPlaylistId, apiKey);
  const videos: Video[] = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const details = await fetchVideoDetails(apiKey, batch);
    videos.push(...details);
  }

  return videos.sort(
    (a, b) =>
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
  );
}
