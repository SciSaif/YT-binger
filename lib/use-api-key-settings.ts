"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_API_KEY_SETTINGS,
  readApiKeySettings,
  updateApiKeySettings,
  completeOnboarding,
  writeApiKeySettings,
} from "@/lib/api-key-storage";
import type { ApiKeyMode, ApiKeySettings } from "@/types/api-key";

let clientSettings: ApiKeySettings | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): ApiKeySettings {
  if (clientSettings === null) {
    clientSettings = readApiKeySettings();
  }
  return clientSettings;
}

function getServerSnapshot(): ApiKeySettings {
  return DEFAULT_API_KEY_SETTINGS;
}

function persistSettings(settings: ApiKeySettings): void {
  clientSettings = settings;
  writeApiKeySettings(settings);
  emitChange();
}

export function replaceApiKeySettings(settings: ApiKeySettings): void {
  persistSettings({
    onboardingComplete: settings.onboardingComplete,
    mode: settings.mode === "custom" ? "custom" : "guest",
    customKey: settings.customKey ?? "",
  });
}

export function useApiKeySettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const finishOnboarding = useCallback((mode: ApiKeyMode, customKey = "") => {
    persistSettings(completeOnboarding(mode, customKey));
  }, []);

  const saveSettings = useCallback((mode: ApiKeyMode, customKey = "") => {
    persistSettings(updateApiKeySettings(mode, customKey));
  }, []);

  const resetOnboarding = useCallback(() => {
    persistSettings({ ...getSnapshot(), onboardingComplete: false });
  }, []);

  return {
    settings,
    hydrated,
    finishOnboarding,
    saveSettings,
    resetOnboarding,
  };
}
