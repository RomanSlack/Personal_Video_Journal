"use client";

import Link from "next/link";
import { Play, Clock, Loader2 } from "lucide-react";
import type { Video } from "@/lib/api";

interface VideoCardProps {
  video: Video;
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

export default function VideoCard({ video }: VideoCardProps) {
  const isProcessing = video.status === "processing" || video.status === "pending";
  const hasFailed = video.status === "failed";

  return (
    <Link href={`/video/${video.id}`} className="group block">
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] hover:border-[var(--muted)] transition-colors">
        {/* Video thumbnail / preview */}
        {video.storage_url ? (
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
          <div className="w-full h-full flex items-center justify-center bg-[var(--card)]">
            <Play className="w-8 h-8 text-[var(--muted)]" />
          </div>
        )}

        {/* Status overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <span className="text-xs">Processing...</span>
            </div>
          </div>
        )}

        {hasFailed && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <span className="text-xs text-red-500 bg-white/90 px-2 py-1 rounded">
              Processing failed
            </span>
          </div>
        )}

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
            <Clock className="w-3 h-3" />
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-[var(--foreground)] ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 px-1">
        <h3 className="font-medium text-sm truncate">
          {video.title || video.filename}
        </h3>
        <p className="text-xs text-[var(--muted)] mt-1">
          {formatDate(video.created_at)}
        </p>

        {/* Tags */}
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {video.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]"
              >
                {tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-xs text-[var(--muted)]">
                +{video.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
