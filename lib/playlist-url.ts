const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

function extractListParam(url: URL): string | null {
  const list = url.searchParams.get("list")?.trim();
  if (list && PLAYLIST_ID_PATTERN.test(list)) {
    return list;
  }
  return null;
}

export function parsePlaylistUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (PLAYLIST_ID_PATTERN.test(trimmed)) {
    if (/^UC[\w-]{22}$/.test(trimmed)) {
      return null;
    }
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://www.youtube.com/${trimmed}`,
    );
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host !== "youtube.com" && host !== "m.youtube.com") {
    return null;
  }

  const listFromQuery = extractListParam(url);
  if (listFromQuery) {
    return listFromQuery;
  }

  if (url.pathname === "/playlist") {
    return null;
  }

  return null;
}
