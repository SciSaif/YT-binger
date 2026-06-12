import { NextResponse } from "next/server";
import { resolveYouTubeApiKey } from "@/lib/youtube-server-key";
import { fetchAllVideos } from "@/lib/youtube";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const uploadsPlaylistId = searchParams.get("uploadsPlaylistId");

    if (!channelId || !uploadsPlaylistId) {
      return NextResponse.json(
        { error: "channelId and uploadsPlaylistId are required" },
        { status: 400 },
      );
    }

    const apiKey = resolveYouTubeApiKey(request);
    const videos = await fetchAllVideos(uploadsPlaylistId, apiKey);
    return NextResponse.json({ channelId, videos });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch videos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
