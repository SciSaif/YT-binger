"use client";

import { FormEvent, useRef, useState } from "react";

interface ChannelInputProps {
  onLoad: (url: string) => Promise<void>;
  loading: boolean;
  initialUrl?: string;
}

export function ChannelInput({ onLoad, loading, initialUrl = "" }: ChannelInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = (inputRef.current?.value ?? url).trim();
    if (!value || loading) return;
    setUrl(value);
    await onLoad(value);
  }

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
      <h2 className="text-sm font-medium text-zinc-300">Load a channel or playlist</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Paste any YouTube channel URL, @handle, or playlist link.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex w-full flex-col gap-3 sm:flex-row">
        <input
          ref={inputRef}
          name="channelUrl"
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onInput={(event) => setUrl(event.currentTarget.value)}
          placeholder="https://youtube.com/@channel or /playlist?list=PL…"
          autoComplete="off"
          className="flex-1 rounded-xl border border-zinc-700/80 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-red-500/80 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </form>
    </section>
  );
}
