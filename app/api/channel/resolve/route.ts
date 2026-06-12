import { NextResponse } from "next/server";
import { parseChannelUrl } from "@/lib/channel-url";
import { resolveChannel } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "Channel URL is required" }, { status: 400 });
    }

    const parsed = parseChannelUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid channel URL. Try a @handle or /channel/UC… link." },
        { status: 400 },
      );
    }

    const channel = await resolveChannel(parsed);
    return NextResponse.json(channel);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve channel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
