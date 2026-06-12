import type { ChannelInfo, ParsedChannelInput, Video } from "@/types";

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

interface VideoItem {
  id: string;
  snippet?: {
    title?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
  contentDetails?: { duration?: string };
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }
  return key;
}

async function youtubeFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  url.searchParams.set("key", getApiKey());
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

async function fetchChannelById(channelId: string): Promise<ChannelInfo> {
  const data = await youtubeFetch<YouTubeListResponse<ChannelItem>>("channels", {
    part: "snippet,contentDetails",
    id: channelId,
  });

  const item = data.items?.[0];
  if (!item) {
    throw new Error("Channel not found");
  }

  return channelFromItem(item);
}

async function fetchChannelByHandle(handle: string): Promise<ChannelInfo> {
  const data = await youtubeFetch<YouTubeListResponse<ChannelItem>>("channels", {
    part: "snippet,contentDetails",
    forHandle: handle,
  });

  const item = data.items?.[0];
  if (!item) {
    throw new Error("Channel not found");
  }

  return channelFromItem(item);
}

async function fetchChannelByUsername(username: string): Promise<ChannelInfo> {
  const data = await youtubeFetch<YouTubeListResponse<ChannelItem>>("channels", {
    part: "snippet,contentDetails",
    forUsername: username,
  });

  const item = data.items?.[0];
  if (!item) {
    throw new Error("Channel not found");
  }

  return channelFromItem(item);
}

async function searchChannel(query: string): Promise<ChannelInfo> {
  const data = await youtubeFetch<
    YouTubeListResponse<{ id?: { channelId?: string } }>
  >("search", {
    part: "snippet",
    type: "channel",
    q: query,
    maxResults: "1",
  });

  const channelId = data.items?.[0]?.id?.channelId;
  if (!channelId) {
    throw new Error("Channel not found");
  }

  return fetchChannelById(channelId);
}

export async function resolveChannel(
  parsed: ParsedChannelInput,
): Promise<ChannelInfo> {
  switch (parsed.type) {
    case "channelId":
      return fetchChannelById(parsed.value);
    case "handle":
      return fetchChannelByHandle(parsed.value);
    case "username":
      return fetchChannelByUsername(parsed.value);
    case "custom":
      return searchChannel(parsed.value);
  }
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

async function fetchVideoDetails(videoIds: string[]): Promise<Video[]> {
  if (videoIds.length === 0) return [];

  const data = await youtubeFetch<YouTubeListResponse<VideoItem>>("videos", {
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

export async function fetchAllVideos(
  uploadsPlaylistId: string,
): Promise<Video[]> {
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const params: Record<string, string> = {
      part: "snippet",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }

    const data = await youtubeFetch<YouTubeListResponse<PlaylistItem>>(
      "playlistItems",
      params,
    );

    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (videoId) {
        videoIds.push(videoId);
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  const videos: Video[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const details = await fetchVideoDetails(batch);
    videos.push(...details);
  }

  return videos.sort(
    (a, b) =>
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
  );
}
