"use client";

interface TagFilterProps {
  tags: string[];
  selectedTag?: string;
  onSelectTag: (tag?: string) => void;
}

export default function TagFilter({ tags, selectedTag, onSelectTag }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectTag(undefined)}
        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
          !selectedTag
            ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
            : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--muted)]"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelectTag(tag === selectedTag ? undefined : tag)}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
            selectedTag === tag
              ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
              : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--muted)]"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
