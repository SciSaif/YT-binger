import { parseChannelUrl } from "@/lib/channel-url";
import { parsePlaylistUrl } from "@/lib/playlist-url";
import type { ParsedChannelInput } from "@/types";

export type ParsedYoutubeInput =
  | { kind: "playlist"; playlistId: string }
  | { kind: "channel"; parsed: ParsedChannelInput };

export function parseYoutubeInput(input: string): ParsedYoutubeInput | null {
  const playlistId = parsePlaylistUrl(input);
  if (playlistId) {
    return { kind: "playlist", playlistId };
  }

  const channel = parseChannelUrl(input);
  if (channel) {
    return { kind: "channel", parsed: channel };
  }

  return null;
}
