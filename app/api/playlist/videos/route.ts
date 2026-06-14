import { NextResponse } from "next/server";
import { isMixPlaylist } from "@/lib/playlist-limits";
import { resolveYouTubeApiKey } from "@/lib/youtube-server-key";
import { fetchPlaylistVideos } from "@/lib/youtube";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get("playlistId");

    if (!playlistId) {
      return NextResponse.json({ error: "playlistId is required" }, { status: 400 });
    }

    const apiKey = resolveYouTubeApiKey(request);
    const result = await fetchPlaylistVideos(playlistId, apiKey);
    return NextResponse.json({
      playlistId,
      videos: result.videos,
      truncated: result.truncated,
      limit: result.limit,
      isMixPlaylist: isMixPlaylist(playlistId),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch videos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
