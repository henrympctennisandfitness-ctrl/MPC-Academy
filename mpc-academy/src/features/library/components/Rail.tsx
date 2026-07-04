"use client";

import type { LucideIcon } from "lucide-react";
import { VideoCard } from "./VideoCard";
import type { Video } from "../data";

interface RailProps {
  title: string;
  videos: Video[];
  icon?: LucideIcon;
  onOpen: (v: Video) => void;
}

/** A titled, horizontally scrolling shelf (Netflix-style). */
export function Rail({ title, videos, icon: Icon, onOpen }: RailProps) {
  if (videos.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-[17px] font-semibold tracking-tight">
        {Icon && <Icon size={17} className="text-brand" />}
        {title}
      </h2>

      <div className="lib-rail -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
        {videos.map((v) => (
          <div key={v.id} className="w-[68%] shrink-0 snap-start sm:w-56 lg:w-64">
            <VideoCard video={v} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </section>
  );
}
