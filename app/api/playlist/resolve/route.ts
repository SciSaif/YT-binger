import { NextResponse } from "next/server";
import { parsePlaylistUrl } from "@/lib/playlist-url";
import { resolveYouTubeApiKey } from "@/lib/youtube-server-key";
import { resolvePlaylist } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "Playlist URL is required" }, { status: 400 });
    }

    const playlistId = parsePlaylistUrl(url);
    if (!playlistId) {
      return NextResponse.json(
        { error: "Invalid playlist URL. Try a /playlist?list=PL… link." },
        { status: 400 },
      );
    }

    const apiKey = resolveYouTubeApiKey(request);
    const playlist = await resolvePlaylist(playlistId, apiKey);
    return NextResponse.json(playlist);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve playlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
