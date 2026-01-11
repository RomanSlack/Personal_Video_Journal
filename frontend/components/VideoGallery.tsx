"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { LayoutGrid, Grid3X3, List, Play, Clock, Loader2, Download, Cog, Mic, Sparkles, CheckCircle, XCircle } from "lucide-react";
import type { Video } from "@/lib/api";
import { useProcessingProgress } from "@/lib/useProcessingProgress";

type ViewMode = "card" | "square" | "list";

interface VideoGalleryProps {
  videos: Video[];
  loading?: boolean;
}

// Group videos by month
interface MonthGroup {
  key: string;
  label: string;
  shortLabel: string;
  videos: Video[];
}

function groupVideosByMonth(videos: Video[]): MonthGroup[] {
  const groups: Map<string, Video[]> = new Map();

  videos.forEach((video) => {
    const date = new Date(video.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(video);
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const shortMonthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // Most recent first
    .map(([key, vids]) => {
      const [year, month] = key.split("-");
      const monthIndex = parseInt(month) - 1;
      const currentYear = new Date().getFullYear();
      const isCurrentYear = parseInt(year) === currentYear;

      return {
        key,
        label: isCurrentYear
          ? monthNames[monthIndex]
          : `${monthNames[monthIndex]} ${year}`,
        shortLabel: isCurrentYear
          ? shortMonthNames[monthIndex]
          : `${shortMonthNames[monthIndex]} '${year.slice(2)}`,
        videos: vids,
      };
    });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Individual video item component
interface VideoItemProps {
  video: Video;
  viewMode: ViewMode;
  index: number;
}

const stageIcons: Record<string, React.ReactNode> = {
  queued: <Loader2 className="w-4 h-4 animate-spin" />,
  downloading: <Download className="w-4 h-4 animate-pulse" />,
  transcoding: <Cog className="w-4 h-4 animate-spin" />,
  transcribing: <Mic className="w-4 h-4 animate-pulse" />,
  generating: <Sparkles className="w-4 h-4 animate-pulse" />,
  complete: <CheckCircle className="w-4 h-4 text-green-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
};

function VideoItem({ video, viewMode, index }: VideoItemProps) {
  const isProcessing = video.status === "processing" || video.status === "pending";
  const hasFailed = video.status === "failed";
  const { progress, isConnected } = useProcessingProgress(
    isProcessing ? video.id : null,
    isProcessing
  );

  if (viewMode === "list") {
    return (
      <Link
        href={`/video/${video.id}`}
        className="group flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--card)] transition-colors animate-fade-in"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--card)]">
          {video.storage_url && !isProcessing ? (
            <video
              src={video.storage_url}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--card)] to-[var(--border)]">
              {isProcessing ? (
                <div className="text-white">
                  {progress ? stageIcons[progress.stage] || stageIcons.queued : stageIcons.queued}
                </div>
              ) : (
                <Play className="w-5 h-5 text-[var(--muted)]" />
              )}
            </div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>
            </div>
          )}
          {hasFailed && (
            <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">
            {isProcessing ? "Processing..." : (video.title || video.filename)}
          </h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {formatDate(video.created_at)}
            {video.duration && ` · ${formatDuration(video.duration)}`}
          </p>
          {video.tags.length > 0 && !isProcessing && (
            <div className="flex gap-1 mt-1.5">
              {video.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {isProcessing && progress && (
            <p className="text-[10px] text-[var(--muted)] mt-1">
              {progress.message} ({progress.percent}%)
            </p>
          )}
        </div>

        {/* Duration badge */}
        {video.duration && !isProcessing && (
          <div className="text-xs text-[var(--muted)] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(video.duration)}
          </div>
        )}
      </Link>
    );
  }

  // Card or Square view
  const isSquare = viewMode === "square";

  return (
    <Link
      href={`/video/${video.id}`}
      className="group block animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div
        className={`relative overflow-hidden bg-[var(--card)] border border-[var(--border)] group-hover:border-[var(--muted)] group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 ${
          isSquare ? "aspect-square rounded-lg" : "aspect-[9/16] rounded-xl"
        }`}
      >
        {/* Video thumbnail */}
        {video.storage_url && !isProcessing ? (
          <video
            src={video.storage_url}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onMouseEnter={(e) => {
              const target = e.target as HTMLVideoElement;
              target.currentTime = 0;
              target.play().catch(() => {});
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLVideoElement;
              target.pause();
              target.currentTime = 0;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--card)] to-[var(--border)]">
            {!isProcessing && <Play className={`${isSquare ? "w-6 h-6" : "w-8 h-8"} text-[var(--muted)]`} />}
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-3">
            <div className="text-white text-center">
              <div className="mb-2">
                {progress ? stageIcons[progress.stage] || stageIcons.queued : stageIcons.queued}
              </div>
              <div className={`${isSquare ? "w-12" : "w-20"} h-1 bg-white/20 rounded-full overflow-hidden mb-1.5 mx-auto`}>
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>
              <p className={`${isSquare ? "text-[9px]" : "text-xs"} font-medium`}>
                {progress?.message || "Starting..."}
              </p>
            </div>
          </div>
        )}

        {hasFailed && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <span className={`${isSquare ? "text-[9px]" : "text-xs"} text-red-500 bg-white/90 px-2 py-1 rounded`}>
              Failed
            </span>
          </div>
        )}

        {/* Duration badge */}
        {video.duration && !isProcessing && (
          <div className={`absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 text-white px-1.5 py-0.5 rounded ${isSquare ? "text-[9px]" : "text-xs"}`}>
            <Clock className={isSquare ? "w-2.5 h-2.5" : "w-3 h-3"} />
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Play icon on hover */}
        {!isProcessing && !hasFailed && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className={`${isSquare ? "w-8 h-8" : "w-12 h-12"} rounded-full bg-white/90 flex items-center justify-center`}>
              <Play className={`${isSquare ? "w-3 h-3" : "w-5 h-5"} text-[var(--foreground)] ml-0.5`} fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      {isSquare ? (
        <div className="mt-1.5 px-0.5">
          <h3 className="font-medium text-[11px] truncate text-center">
            {isProcessing ? "Processing..." : (video.title || video.filename)}
          </h3>
        </div>
      ) : (
        <div className="mt-2 px-1">
          <h3 className="font-medium text-sm truncate">
            {isProcessing ? "Processing..." : (video.title || video.filename)}
          </h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {formatDate(video.created_at)}
          </p>
          {video.tags.length > 0 && !isProcessing && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {video.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

// Timeline scrubber component
interface TimelineScrubberProps {
  groups: MonthGroup[];
  activeMonth: string | null;
  onMonthClick: (key: string) => void;
}

function TimelineScrubber({ groups, activeMonth, onMonthClick }: TimelineScrubberProps) {
  if (groups.length <= 1) return null;

  return (
    <div className="fixed right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-end gap-0.5">
      {groups.map((group) => (
        <button
          key={group.key}
          onClick={() => onMonthClick(group.key)}
          className={`text-[10px] px-2 py-1 rounded-full transition-all hover:bg-[var(--card)] ${
            activeMonth === group.key
              ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {group.shortLabel}
        </button>
      ))}
    </div>
  );
}

// View mode switcher
interface ViewModeSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

function ViewModeSwitcher({ viewMode, onViewModeChange }: ViewModeSwitcherProps) {
  return (
    <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-lg p-1">
      <button
        onClick={() => onViewModeChange("card")}
        className={`p-1.5 rounded transition-colors ${
          viewMode === "card"
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
        title="Card view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange("square")}
        className={`p-1.5 rounded transition-colors ${
          viewMode === "square"
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
        title="Grid view"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange("list")}
        className={`p-1.5 rounded transition-colors ${
          viewMode === "list"
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

// Loading skeletons
function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
            <div className="w-20 h-20 rounded-lg bg-[var(--card)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--card)] rounded w-1/3" />
              <div className="h-3 bg-[var(--card)] rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isSquare = viewMode === "square";
  const gridClass = isSquare
    ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2"
    : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";

  return (
    <div className={gridClass}>
      {[...Array(isSquare ? 16 : 8)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className={`${isSquare ? "aspect-square rounded-lg" : "aspect-[9/16] rounded-xl"} bg-[var(--card)]`} />
          {isSquare ? (
            <div className="mt-1.5 px-0.5">
              <div className="h-3 bg-[var(--card)] rounded w-3/4 mx-auto" />
            </div>
          ) : (
            <div className="mt-2 px-1 space-y-1.5">
              <div className="h-4 bg-[var(--card)] rounded w-3/4" />
              <div className="h-3 bg-[var(--card)] rounded w-1/2" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function VideoGallery({ videos, loading }: VideoGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const groups = useMemo(() => groupVideosByMonth(videos), [videos]);

  // Set initial active month
  useEffect(() => {
    if (groups.length > 0 && !activeMonth) {
      setActiveMonth(groups[0].key);
    }
  }, [groups, activeMonth]);

  // Intersection observer for tracking visible month
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const monthKey = entry.target.getAttribute("data-month");
            if (monthKey) {
              setActiveMonth(monthKey);
            }
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    monthRefs.current.forEach((ref) => {
      observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [groups]);

  const handleMonthClick = (key: string) => {
    const ref = monthRefs.current.get(key);
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <ViewModeSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
        <LoadingSkeleton viewMode={viewMode} />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <ViewModeSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
        <div className="text-center py-16">
          <p className="text-[var(--muted)]">No videos yet</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Upload your first video to get started
          </p>
        </div>
      </div>
    );
  }

  const gridClass =
    viewMode === "list"
      ? "space-y-1"
      : viewMode === "square"
      ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2"
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";

  return (
    <div className="relative">
      {/* View mode switcher */}
      <div className="flex justify-end mb-4">
        <ViewModeSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Timeline scrubber */}
      <TimelineScrubber
        groups={groups}
        activeMonth={activeMonth}
        onMonthClick={handleMonthClick}
      />

      {/* Videos grouped by month */}
      <div className="space-y-8 pr-0 md:pr-16">
        {groups.map((group) => (
          <div
            key={group.key}
            ref={(el) => {
              if (el) monthRefs.current.set(group.key, el);
            }}
            data-month={group.key}
          >
            {/* Month header */}
            <h2 className="text-lg font-semibold mb-4 sticky top-[73px] bg-[var(--background)]/90 backdrop-blur-sm py-2 z-5">
              {group.label}
              <span className="text-sm font-normal text-[var(--muted)] ml-2">
                {group.videos.length} {group.videos.length === 1 ? "video" : "videos"}
              </span>
            </h2>

            {/* Videos grid */}
            <div className={gridClass}>
              {group.videos.map((video, index) => (
                <VideoItem
                  key={video.id}
                  video={video}
                  viewMode={viewMode}
                  index={index}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
