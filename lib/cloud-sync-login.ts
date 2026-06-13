"use client";

import { syncNow } from "@/lib/cloud-sync";
import { readAppState, replaceAppState } from "@/lib/storage";
import { mergeAppStates, normalizeAppState } from "@/lib/sync-merge";
import type { AppState } from "@/types";

export async function pullAndMergeCloudData(): Promise<AppState> {
  const response = await fetch("/api/sync", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Could not load cloud data.");
  }

  const data = (await response.json()) as { app?: AppState };
  const local = readAppState();
  const cloud = normalizeAppState(data.app);
  const merged = mergeAppStates(local, cloud);

  replaceAppState(merged);
  await syncNow(merged);

  return merged;
}
