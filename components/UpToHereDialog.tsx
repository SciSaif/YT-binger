"use client";

import { useEffect, useRef } from "react";
import type { Video } from "@/types";

interface UpToHereDialogProps {
  video: Video | null;
  open: boolean;
  markPrevious: boolean;
  previousCount: number;
  onMarkPreviousChange: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UpToHereDialog({
  video,
  open,
  markPrevious,
  previousCount,
  onMarkPreviousChange,
  onConfirm,
  onCancel,
}: UpToHereDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open || !video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="up-to-here-title"
        className="relative w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
      >
        <h2 id="up-to-here-title" className="text-lg font-semibold text-white">
          Set progress here?
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Your next recommended video will be the one after:
        </p>
        <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm leading-snug text-zinc-200">
          {video.title}
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={markPrevious}
            onChange={(event) => onMarkPreviousChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-zinc-300">
            Also mark all previous videos as watched
            {previousCount > 0 ? (
              <span className="block text-xs text-zinc-500">
                {previousCount} video{previousCount === 1 ? "" : "s"} before this one
              </span>
            ) : (
              <span className="block text-xs text-zinc-500">
                No earlier videos in the current sort order
              </span>
            )}
          </span>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
