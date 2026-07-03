"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { UploadCloud, Video, X, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GOOGLE_CONFIG } from "@/lib/config";
import { droppedFileSchema, formatBytes, type FileMeta } from "../schema";

interface UploadDropzoneProps {
  fileMeta: FileMeta | null;
  /** Draft restored the metadata but not the bytes — prompt a re-attach. */
  needsReattach: boolean;
  onAccepted: (file: File) => void;
  onRemove: () => void;
}

/**
 * Drag-and-drop (and tap-to-browse) uploader. Validates format + size with
 * Zod, surfaces rejects as toasts, and shows the attached clip as a card.
 * The real network upload (with progress) happens later, on submit.
 */
export function UploadDropzone({
  fileMeta,
  needsReattach,
  onAccepted,
  onRemove,
}: UploadDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const file = rejections[0].file;
        const parsed = droppedFileSchema.safeParse({
          type: file.type,
          size: file.size,
        });
        toast.error(
          parsed.success
            ? "That file couldn't be added. Try another clip."
            : parsed.error.issues[0].message,
        );
        return;
      }

      const file = accepted[0];
      if (!file) return;

      const parsed = droppedFileSchema.safeParse({
        type: file.type,
        size: file.size,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }

      onAccepted(file);
      toast.success("Video attached");
    },
    [onAccepted],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/mpeg": [".mpeg", ".mpg"],
    },
    maxSize: GOOGLE_CONFIG.maxUploadBytes,
    multiple: false,
    noClick: true, // we wire our own click so the whole area feels intentional
  });

  const showDropzone = !fileMeta || needsReattach;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait" initial={false}>
        {showDropzone ? (
          <motion.div
            key="drop"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div
              {...getRootProps()}
              onClick={open}
              role="button"
              tabIndex={0}
              aria-label="Upload a video. Drag and drop, or activate to browse."
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                isDragActive
                  ? "border-brand bg-brand-tint"
                  : "border-[#d6ddda] bg-[#fcfdfc] hover:border-[#bfc8c4]",
              )}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={{
                  y: isDragActive ? -4 : 0,
                  scale: isDragActive ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-tint"
              >
                <UploadCloud size={28} className="text-brand" />
              </motion.div>
              <p className="text-[15.5px] font-semibold">
                {isDragActive
                  ? "Drop your clip to upload"
                  : "Drag & drop your video"}
              </p>
              <p className="mt-1 text-sm text-muted">
                or tap to browse your device
              </p>
              <p className="mt-4 text-xs text-muted">MP4, MOV or MPEG · up to 2GB</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-line bg-surface p-5 shadow-card"
          >
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-tint">
                <Video size={22} className="text-brand" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">
                  {fileMeta.name}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {formatBytes(fileMeta.size)} · ready
                </p>
              </div>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand">
                <Check size={15} className="text-white" strokeWidth={3} />
              </span>
              <button
                type="button"
                onClick={onRemove}
                aria-label="Remove video"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumed-draft hint: metadata is back, but the bytes need re-attaching. */}
      {needsReattach && fileMeta && (
        <div className="flex items-start gap-2.5 rounded-xl bg-gold-tint px-3.5 py-3 text-[13px] text-[#8A6D12]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong className="font-semibold">{fileMeta.name}</strong> was saved
            with your draft, but the video itself can&apos;t be restored after a
            refresh. Re-select it above to upload.
          </span>
        </div>
      )}
    </div>
  );
}
