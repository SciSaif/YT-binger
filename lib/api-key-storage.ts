import type { ApiKeyMode, ApiKeySettings } from "@/types/api-key";

const STORAGE_KEY = "yt-binger-api-key";

export const DEFAULT_API_KEY_SETTINGS: ApiKeySettings = {
  onboardingComplete: false,
  mode: "guest",
  customKey: "",
};

export function readApiKeySettings(): ApiKeySettings {
  if (typeof window === "undefined") {
    return DEFAULT_API_KEY_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_API_KEY_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ApiKeySettings>;
    return {
      onboardingComplete: parsed.onboardingComplete ?? false,
      mode: parsed.mode === "custom" ? "custom" : "guest",
      customKey: parsed.customKey ?? "",
    };
  } catch {
    return DEFAULT_API_KEY_SETTINGS;
  }
}

export function writeApiKeySettings(settings: ApiKeySettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function completeOnboarding(mode: ApiKeyMode, customKey = ""): ApiKeySettings {
  const settings: ApiKeySettings = {
    onboardingComplete: true,
    mode,
    customKey: mode === "custom" ? customKey.trim() : "",
  };
  writeApiKeySettings(settings);
  return settings;
}

export function updateApiKeySettings(
  mode: ApiKeyMode,
  customKey = "",
): ApiKeySettings {
  const current = readApiKeySettings();
  const settings: ApiKeySettings = {
    ...current,
    onboardingComplete: true,
    mode,
    customKey: mode === "custom" ? customKey.trim() : "",
  };
  writeApiKeySettings(settings);
  return settings;
}

export function getActiveApiKey(settings: ApiKeySettings): string | null {
  if (settings.mode === "custom" && settings.customKey.trim()) {
    return settings.customKey.trim();
  }
  return null;
}

export function getApiKeyModeLabel(mode: ApiKeyMode): string {
  return mode === "custom" ? "Your API key" : "Guest key";
}
