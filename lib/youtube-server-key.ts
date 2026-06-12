import { API_KEY_HEADER } from "@/types/api-key";

export function resolveYouTubeApiKey(request: Request): string {
  const userKey = request.headers.get(API_KEY_HEADER)?.trim();
  if (userKey) {
    return userKey;
  }

  const envKey = process.env.YOUTUBE_API_KEY?.trim();
  if (envKey) {
    return envKey;
  }

  throw new Error(
    "No YouTube API key available. Add your key in Settings or configure YOUTUBE_API_KEY on the server.",
  );
}

export function isGuestKeyAvailable(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY?.trim());
}
