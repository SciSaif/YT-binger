import type { ParsedChannelInput } from "@/types";

export function parseChannelUrl(input: string): ParsedChannelInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^UC[\w-]{22}$/.test(trimmed)) {
    return { type: "channelId", value: trimmed };
  }

  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1);
    return handle ? { type: "handle", value: handle } : null;
  }

  let url: URL;
  try {
    url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://www.youtube.com/${trimmed}`,
    );
  } catch {
    if (/^[\w.-]+$/.test(trimmed)) {
      return { type: "handle", value: trimmed };
    }
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host !== "youtube.com" && host !== "m.youtube.com") {
    return null;
  }

  const path = url.pathname;

  const channelMatch = path.match(/^\/channel\/(UC[\w-]{22})/);
  if (channelMatch) {
    return { type: "channelId", value: channelMatch[1] };
  }

  const handleMatch = path.match(/^\/@([\w.-]+)/);
  if (handleMatch) {
    return { type: "handle", value: handleMatch[1] };
  }

  const userMatch = path.match(/^\/user\/([\w.-]+)/);
  if (userMatch) {
    return { type: "username", value: userMatch[1] };
  }

  const customMatch = path.match(/^\/c\/([\w.-]+)/);
  if (customMatch) {
    return { type: "custom", value: customMatch[1] };
  }

  return null;
}
