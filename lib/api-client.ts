import { getActiveApiKey, readApiKeySettings } from "@/lib/api-key-storage";
import { API_KEY_HEADER } from "@/types/api-key";

export function withApiKeyHeaders(init?: RequestInit): RequestInit {
  const settings = readApiKeySettings();
  const headers = new Headers(init?.headers);
  const userKey = getActiveApiKey(settings);

  if (userKey) {
    headers.set(API_KEY_HEADER, userKey);
  }

  return { ...init, headers };
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, withApiKeyHeaders(init));
}
