"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiKeyForm } from "@/components/ApiKeyForm";
import { ApiKeyOnboarding } from "@/components/ApiKeyOnboarding";
import { getApiKeyModeLabel } from "@/lib/api-key-storage";
import { useApiKeySettings } from "@/lib/use-api-key-settings";
import type { ApiKeyMode } from "@/types/api-key";

export function SettingsPage() {
  const { settings, hydrated, finishOnboarding, saveSettings } = useApiKeySettings();
  const [guestKeyAvailable, setGuestKeyAvailable] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((response) => response.json())
      .then((data: { guestKeyAvailable?: boolean }) => {
        setGuestKeyAvailable(Boolean(data.guestKeyAvailable));
      })
      .catch(() => setGuestKeyAvailable(false));
  }, []);

  function handleSave(mode: ApiKeyMode, customKey: string) {
    saveSettings(mode, customKey);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!settings.onboardingComplete) {
    return <ApiKeyOnboarding onComplete={finishOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <span aria-hidden="true">←</span>
          Back to app
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage your YouTube API key. Currently using{" "}
          <span className="text-zinc-300">{getApiKeyModeLabel(settings.mode)}</span>.
        </p>

        {saved ? (
          <p className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
            Settings saved.
          </p>
        ) : null}

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <ApiKeyForm
            initialMode={settings.mode}
            initialCustomKey={settings.customKey}
            guestKeyAvailable={guestKeyAvailable}
            submitLabel="Save changes"
            showGuestOption
            onSubmit={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
