"use client";

import { useRef, useState } from "react";
import {
  createBackup,
  downloadBackupFile,
  importBackup,
  parseBackup,
  summarizeBackup,
} from "@/lib/backup";

export function DataBackupSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [pendingFile, setPendingFile] = useState<{ name: string; summary: string } | null>(
    null,
  );
  const [pendingRaw, setPendingRaw] = useState<string | null>(null);

  function handleExport() {
    setMessage(null);
    setPendingFile(null);
    setPendingRaw(null);
    downloadBackupFile(createBackup());
    setMessage({ type: "success", text: "Backup downloaded." });
  }

  async function handleFileSelect(file: File | undefined) {
    setMessage(null);
    setPendingFile(null);
    setPendingRaw(null);

    if (!file) return;

    try {
      const raw = await file.text();
      const backup = parseBackup(raw);
      setPendingRaw(raw);
      setPendingFile({
        name: file.name,
        summary: summarizeBackup(backup),
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not read backup file.",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleConfirmImport() {
    if (!pendingRaw) return;

    try {
      const backup = parseBackup(pendingRaw);
      importBackup(backup);
      setPendingFile(null);
      setPendingRaw(null);
      setMessage({
        type: "success",
        text: "Backup imported. Your channels and progress have been restored.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Import failed.",
      });
    }
  }

  function handleCancelImport() {
    setPendingFile(null);
    setPendingRaw(null);
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Import / export data</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Download a JSON backup of your watched progress, visited channels, video cache,
        and API key settings. Importing replaces all local data in this browser.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          Export data
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          Import data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => handleFileSelect(event.target.files?.[0])}
        />
      </div>

      {pendingFile ? (
        <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
          <p className="text-sm font-medium text-amber-200">Replace current data?</p>
          <p className="mt-1 text-sm text-amber-100/80">
            Import <span className="font-medium">{pendingFile.name}</span> ({pendingFile.summary}).
            This will overwrite your existing local data.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConfirmImport}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              Import and replace
            </button>
            <button
              type="button"
              onClick={handleCancelImport}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          role="status"
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            message.type === "success"
              ? "border border-emerald-900/50 bg-emerald-950/30 text-emerald-300"
              : "border border-red-900/50 bg-red-950/30 text-red-300"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <p className="mt-4 text-xs text-zinc-600">
        Exports may include your API key if you use a custom key. Keep backup files private.
      </p>
    </section>
  );
}
