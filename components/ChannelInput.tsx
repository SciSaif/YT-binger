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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <input
        ref={inputRef}
        name="channelUrl"
        type="text"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        onInput={(event) => setUrl(event.currentTarget.value)}
        placeholder="Paste a channel (@handle, /channel/UC…) or playlist (/playlist?list=PL…) URL"
        autoComplete="off"
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Loading…" : "Load"}
      </button>
    </form>
  );
}
