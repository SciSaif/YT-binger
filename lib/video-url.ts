const VIDEO_ID_PATTERN = /^[\w-]{11}$/;

export function parseVideoUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (VIDEO_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  const isYouTube =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host === "music.youtube.com";

  if (!isYouTube) return null;

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return VIDEO_ID_PATTERN.test(id) ? id : null;
  }

  const watchId = url.searchParams.get("v");
  if (watchId && VIDEO_ID_PATTERN.test(watchId)) {
    return watchId;
  }

  const pathMatch = url.pathname.match(
    /^\/(?:shorts|embed|live|v)\/([\w-]{11})/,
  );
  if (pathMatch) {
    return pathMatch[1];
  }

  return null;
}

export function findVideoIndex(videos: { id: string }[], videoId: string): number {
  return videos.findIndex((video) => video.id === videoId);
}
