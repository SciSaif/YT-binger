"use client";

import { useEffect, useState } from "react";
import { ApiKeyForm } from "@/components/ApiKeyForm";
import type { ApiKeyMode } from "@/types/api-key";

interface ApiKeyOnboardingProps {
  onComplete: (mode: ApiKeyMode, customKey: string) => void;
}

export function ApiKeyOnboarding({ onComplete }: ApiKeyOnboardingProps) {
  const [guestKeyAvailable, setGuestKeyAvailable] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((response) => response.json())
      .then((data: { guestKeyAvailable?: boolean }) => {
        setGuestKeyAvailable(Boolean(data.guestKeyAvailable));
      })
      .catch(() => setGuestKeyAvailable(false));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white">Welcome to YT Binger</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          To load channel videos, this app needs a YouTube Data API key. Use your own key
          for reliable access, or continue with the shared guest key if one is configured
          on the server.
        </p>

        <div className="mt-8">
          <ApiKeyForm
            initialMode="guest"
            initialCustomKey=""
            guestKeyAvailable={guestKeyAvailable}
            submitLabel="Save & continue"
            onSubmit={onComplete}
          />
        </div>
      </div>
    </div>
  );
}
