import type { Video } from "@/types";

interface NextVideoCardProps {
  video: Video | null;
  completed: boolean;
  onMarkWatched?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function NextVideoCard({ video, completed, onMarkWatched }: NextVideoCardProps) {
  if (completed) {
    return (
      <section className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          All caught up
        </p>
        <p className="mt-2 text-lg text-zinc-200">
          You have watched every video in this channel. Nice work!
        </p>
      </section>
    );
  }

  if (!video) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Next to watch
        </p>
        <p className="mt-2 text-zinc-400">
          Load a channel or mark your progress to get a recommendation.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-red-800/40 bg-gradient-to-br from-red-950/40 to-zinc-900/80 p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
        Next to watch
      </p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt=""
            className="h-28 w-full rounded-lg object-cover sm:h-24 sm:w-40"
          />
        ) : null}
        <div className="flex-1">
          <h2 className="text-lg font-semibold leading-snug text-zinc-50">
            {video.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {formatDate(video.publishedAt)} · {video.duration}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              Watch on YouTube
            </a>
            {onMarkWatched ? (
              <button
                type="button"
                onClick={onMarkWatched}
                className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              >
                Mark watched
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
