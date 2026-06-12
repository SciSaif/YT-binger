"use client";

interface ChannelHeaderProps {
  title: string;
  watchedLabel: string;
  onBack: () => void;
}

export function ChannelHeader({ title, watchedLabel, onBack }: ChannelHeaderProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <span aria-hidden="true">←</span>
        Back to channels
      </button>
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{watchedLabel}</p>
      </div>
    </div>
  );
}
