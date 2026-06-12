"use client";

import { FormEvent, useState } from "react";
import { getApiKeyModeLabel } from "@/lib/api-key-storage";
import type { ApiKeyMode } from "@/types/api-key";

interface ApiKeyFormProps {
  initialMode: ApiKeyMode;
  initialCustomKey: string;
  guestKeyAvailable: boolean;
  submitLabel: string;
  onSubmit: (mode: ApiKeyMode, customKey: string) => void;
  showGuestOption?: boolean;
}

export function ApiKeyForm({
  initialMode,
  initialCustomKey,
  guestKeyAvailable,
  submitLabel,
  onSubmit,
  showGuestOption = true,
}: ApiKeyFormProps) {
  const [mode, setMode] = useState<ApiKeyMode>(initialMode);
  const [customKey, setCustomKey] = useState(initialCustomKey);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "custom" && !customKey.trim()) {
      setError("Enter your YouTube Data API v3 key or use the guest key.");
      return;
    }

    if (mode === "guest" && !guestKeyAvailable) {
      setError("Guest key is not available on this deployment. Please enter your own API key.");
      return;
    }

    onSubmit(mode, customKey.trim());
  }

  return (
    <form
      key={`${initialMode}:${initialCustomKey}`}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label htmlFor="api-key" className="block text-sm font-medium text-zinc-300">
          YouTube Data API v3 key
        </label>
        <input
          id="api-key"
          type="password"
          value={customKey}
          onChange={(event) => {
            setCustomKey(event.target.value);
            if (event.target.value.trim()) {
              setMode("custom");
            }
            if (error) setError(null);
          }}
          placeholder="AIza…"
          autoComplete="off"
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Optional. Get a free key from Google Cloud Console and enable the YouTube Data API v3.
          Your key is stored only in this browser.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
        >
          {submitLabel}
        </button>
        {showGuestOption ? (
          <button
            type="button"
            onClick={() => {
              setMode("guest");
              setCustomKey("");
              setError(null);
              onSubmit("guest", "");
            }}
            disabled={!guestKeyAvailable}
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue with guest key
          </button>
        ) : null}
      </div>

      <p className="text-xs text-zinc-600">
        Current selection: {getApiKeyModeLabel(mode)}
        {!guestKeyAvailable && mode === "guest" ? " (unavailable)" : ""}
      </p>
    </form>
  );
}
