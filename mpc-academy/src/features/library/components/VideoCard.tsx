"use client";

import { motion } from "framer-motion";
import { Play, Heart } from "lucide-react";
import { CATEGORY_MAP, type Video } from "../data";
import { useLibrary } from "../store";
import { cn } from "@/lib/utils";

/** A single library video. Netflix/Apple-TV feel: lifts and reveals play on hover. */
export function VideoCard({ video, onOpen }: { video: Video; onOpen: (v: Video) => void }) {
  const { isFavourite, progressOf, toggleFavourite } = useLibrary();
  const category = CATEGORY_MAP[video.category];
  const Icon = category.icon;
  const fav = isFavourite(video.id);
  const progress = progressOf(video.id);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(video)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(video);
        }
      }}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group block w-full cursor-pointer rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-video w-full overflow-hidden rounded-xl shadow-card ring-1 ring-black/5"
        style={{ background: category.gradient }}
      >
        {/* Faded category glyph */}
        <Icon
          size={96}
          className="absolute -bottom-4 -right-3 text-white/10"
          aria-hidden
        />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 grid place-items-center bg-black/0 transition-colors duration-200 group-hover:bg-black/20 group-focus-visible:bg-black/20">
          <span className="grid h-12 w-12 scale-90 place-items-center rounded-full bg-white/95 text-brand opacity-0 shadow-sm transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
            <Play size={20} className="ml-0.5" fill="currentColor" />
          </span>
        </div>

        {/* Favourite */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavourite(video.id);
          }}
          aria-label={fav ? "Remove from favourites" : "Add to favourites"}
          aria-pressed={fav}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <motion.span key={fav ? "on" : "off"} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
            <Heart size={15} fill={fav ? "#D4AF37" : "none"} color={fav ? "#D4AF37" : "currentColor"} />
          </motion.span>
        </button>

        {/* Duration */}
        <span className="absolute bottom-2 left-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {video.duration}
        </span>

        {/* Progress */}
        {progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
            <div
              className={cn("h-full", progress >= 100 ? "bg-gold" : "bg-white")}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Meta */}
      <p className="mt-2.5 line-clamp-1 text-[14.5px] font-semibold">{video.title}</p>
      <p className="mt-0.5 text-[12.5px] text-muted">
        {category.label} · {video.coach}
      </p>
    </motion.div>
  );
}
