"use client";

import { isUserLoggedIn } from "@/lib/use-auth";
import type { AppState } from "@/types";

const SYNC_DEBOUNCE_MS = 400;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: AppState | null = null;
let syncInFlight: Promise<void> | null = null;
let lastSyncError: string | null = null;
const errorListeners = new Set<(error: string | null) => void>();

function emitSyncError(error: string | null): void {
  lastSyncError = error;
  for (const listener of errorListeners) {
    listener(error);
  }
}

export function subscribeSyncErrors(
  listener: (error: string | null) => void,
): () => void {
  errorListeners.add(listener);
  listener(lastSyncError);
  return () => errorListeners.delete(listener);
}

export function getLastSyncError(): string | null {
  return lastSyncError;
}

async function pushToCloud(state: AppState): Promise<void> {
  const response = await fetch("/api/sync", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app: state }),
  });

  if (!response.ok) {
    let message = "Cloud sync failed.";
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
}

async function flushCloudSync(): Promise<void> {
  if (!pendingState || !isUserLoggedIn()) {
    pendingState = null;
    return;
  }

  const stateToSync = pendingState;
  pendingState = null;

  if (syncInFlight) {
    await syncInFlight;
  }

  syncInFlight = (async () => {
    try {
      await pushToCloud(stateToSync);
      emitSyncError(null);
    } catch (error) {
      emitSyncError(
        error instanceof Error ? error.message : "Cloud sync failed.",
      );
    } finally {
      syncInFlight = null;
    }
  })();

  await syncInFlight;
}

export function scheduleCloudSync(state: AppState): void {
  if (!isUserLoggedIn()) return;

  pendingState = state;
  if (syncTimer) {
    clearTimeout(syncTimer);
  }
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void flushCloudSync();
  }, SYNC_DEBOUNCE_MS);
}

export async function syncNow(state: AppState): Promise<void> {
  if (!isUserLoggedIn()) return;
  pendingState = state;
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  await flushCloudSync();
}
