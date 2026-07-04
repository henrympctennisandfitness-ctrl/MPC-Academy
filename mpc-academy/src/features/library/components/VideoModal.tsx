"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Play, RotateCcw, Heart } from "lucide-react";
import { Button } from "@/components/ui";
import { CATEGORY_MAP, type Video } from "../data";
import { useLibrary } from "../store";

interface VideoModalProps {
  video: Video | null;
  onClose: () => void;
}

/** Detail sheet for a video. Play/Resume drives the watch-progress features. */
export function VideoModal({ video, onClose }: VideoModalProps) {
  const { isFavourite, progressOf, toggleFavourite, play } = useLibrary();

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [video, onClose]);

  const category = video ? CATEGORY_MAP[video.category] : null;
  const progress = video ? progressOf(video.id) : 0;
  const started = progress > 0 && progress < 100;
  const finished = progress >= 100;
  const fav = video ? isFavourite(video.id) : false;

  return (
    <AnimatePresence>
      {video && category && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:inset-0 sm:my-auto sm:h-fit sm:rounded-3xl"
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.6 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            role="dialog"
            aria-label={video.title}
          >
            {/* Hero */}
            <div
              className="relative grid aspect-video place-items-center"
              style={{ background: category.gradient }}
            >
              <category.icon size={140} className="text-white/10" aria-hidden />
              <span className="absolute grid h-16 w-16 place-items-center rounded-full bg-white/95 text-brand shadow">
                <Play size={26} className="ml-1" fill="currentColor" />
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X size={18} />
              </button>
              {progress > 0 && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
                  <div
                    className={finished ? "h-full bg-gold" : "h-full bg-white"}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                {category.label} · {video.duration}
              </p>
              <h2 className="mt-1 text-[20px] font-bold tracking-tight">
                {video.title}
              </h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                {video.description}
              </p>
              <p className="mt-3 text-[13px] text-muted">With {video.coach}</p>

              <div className="mt-5 flex gap-2">
                <Button onClick={() => play(video.id)} className="flex-1 sm:flex-none">
                  {started ? <RotateCcw size={17} /> : <Play size={17} fill="currentColor" />}
                  {finished ? "Watch again" : started ? `Resume · ${progress}%` : "Play"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => toggleFavourite(video.id)}
                  aria-pressed={fav}
                >
                  <Heart
                    size={17}
                    fill={fav ? "#D4AF37" : "none"}
                    color={fav ? "#D4AF37" : "currentColor"}
                  />
                  {fav ? "Favourited" : "Favourite"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
