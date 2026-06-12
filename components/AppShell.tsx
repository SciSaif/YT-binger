"use client";

import Link from "next/link";
import { ApiKeyOnboarding } from "@/components/ApiKeyOnboarding";
import { BingeApp } from "@/components/BingeApp";
import { useApiKeySettings } from "@/lib/use-api-key-settings";

export function AppShell() {
  const { settings, hydrated, finishOnboarding } = useApiKeySettings();

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!settings.onboardingComplete) {
    return (
      <ApiKeyOnboarding
        onComplete={(mode, customKey) => {
          finishOnboarding(mode, customKey);
        }}
      />
    );
  }

  return (
    <>
      <div className="border-b border-zinc-900 bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-end px-4 py-3 sm:px-6">
          <Link
            href="/settings"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Settings
          </Link>
        </div>
      </div>
      <BingeApp />
    </>
  );
}
