"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, PlayCircle, Clock3, Heart, BookOpen } from "lucide-react";
import { CATEGORIES, CATEGORY_MAP, VIDEOS, type Video } from "../data";
import { LibraryProvider, useLibrary } from "../store";
import { Rail } from "./Rail";
import { VideoCard } from "./VideoCard";
import { CategoryChips } from "./CategoryChips";
import { VideoModal } from "./VideoModal";

function LibraryInner() {
  const { continueWatching, recentlyWatched, favourites } = useLibrary();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState<Video | null>(null);

  const filterActive = query.trim() !== "" || category !== "all";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VIDEOS.filter((v) => {
      const matchesCategory = category === "all" || v.category === category;
      const matchesQuery =
        q === "" ||
        [v.title, v.coach, v.description, CATEGORY_MAP[v.category].label]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div>
      {/* Heading */}
      <header className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight">Coaching library</h1>
        <p className="mt-1 text-[15px] text-muted">
          Drills, breakdowns and guides from the academy team.
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons, coaches or topics…"
          aria-label="Search the library"
          className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-[14.5px] outline-none transition-shadow placeholder:text-[#9aa1ab] focus:border-brand focus:shadow-[0_0_0_4px_rgba(14,77,58,0.08)]"
        />
      </div>

      {/* Category filter */}
      <div className="mb-6">
        <CategoryChips active={category} onChange={setCategory} />
      </div>

      <motion.div
        key={filterActive ? "grid" : "browse"}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {filterActive ? (
          /* ---- Filtered grid ---- */
          results.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((v) => (
                <VideoCard key={v.id} video={v} onOpen={setOpen} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-background">
                <BookOpen size={22} className="text-muted" />
              </span>
              <p className="text-[15px] font-semibold">No lessons found</p>
              <p className="mt-1 text-[13.5px] text-muted">
                Try a different search or category.
              </p>
            </div>
          )
        ) : (
          /* ---- Browse shelves ---- */
          <div className="space-y-8">
            <Rail
              title="Continue watching"
              icon={PlayCircle}
              videos={continueWatching}
              onOpen={setOpen}
            />
            <Rail
              title="Recently watched"
              icon={Clock3}
              videos={recentlyWatched}
              onOpen={setOpen}
            />
            <Rail
              title="Your favourites"
              icon={Heart}
              videos={favourites}
              onOpen={setOpen}
            />
            {CATEGORIES.map((c) => (
              <Rail
                key={c.slug}
                title={c.label}
                icon={c.icon}
                videos={VIDEOS.filter((v) => v.category === c.slug)}
                onOpen={setOpen}
              />
            ))}
          </div>
        )}
      </motion.div>

      <VideoModal video={open} onClose={() => setOpen(null)} />

      {/* Scoped once: hide scrollbars on the horizontal rails/chips only. */}
      <style>{`
        .lib-rail { scrollbar-width: none; -ms-overflow-style: none; }
        .lib-rail::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

/** Coaching Library — Netflix × Apple TV, mobile-first. */
export function LibraryView() {
  return (
    <LibraryProvider>
      <LibraryInner />
    </LibraryProvider>
  );
}
