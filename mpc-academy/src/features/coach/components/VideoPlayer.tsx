import { Film, ExternalLink } from "lucide-react";

/**
 * Extract a Google Drive file ID from any of its common URL shapes:
 *   .../file/d/<ID>/view    ·    ...?id=<ID>    ·    ...uc?id=<ID>
 * Returns null for non-Drive URLs.
 */
function driveFileId(url: string): string | null {
  const byPath = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (byPath) return byPath[1];
  const byQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return byQuery ? byQuery[1] : null;
}

/**
 * Video for a submission.
 * - Drive URL  → embedded preview player, plus an "Open in Drive" button in
 *   case embedding is blocked by the file's sharing permissions.
 * - Other URL  → a polished "Open video" button.
 * - No URL     → a premium placeholder (the video isn't on Drive yet, e.g. the
 *   in-memory dev mock, which has no Drive to upload to).
 */
export function VideoPlayer({
  url,
  filename,
}: {
  url: string;
  filename?: string;
}) {
  // No Drive URL — show a calm placeholder tile.
  if (!url) {
    return (
      <div
        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl px-4 text-center"
        style={{
          background:
            "linear-gradient(135deg, #0E4D3A 0%, #14624a 55%, #1c6d53 100%)",
        }}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-brand">
          <Film size={20} />
        </span>
        <p className="text-[13px] font-semibold text-white">
          {filename ? "Video attached" : "No video"}
        </p>
        {filename && (
          <p className="max-w-[85%] truncate text-[12px] text-white/80">
            {filename} · uploads to Drive once configured
          </p>
        )}
      </div>
    );
  }

  const id = driveFileId(url);

  if (id) {
    return (
      <div className="space-y-2">
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-line bg-ink">
          <iframe
            src={`https://drive.google.com/file/d/${id}/preview`}
            title="Submission video"
            className="h-full w-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:underline"
        >
          <ExternalLink size={14} />
          Open in Drive
        </a>
      </div>
    );
  }

  // A non-Drive URL — offer a clear open action.
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-line bg-background text-center transition-colors hover:bg-brand-tint"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white">
        <ExternalLink size={18} />
      </span>
      <p className="text-[13px] font-semibold text-ink">Open video</p>
    </a>
  );
}
