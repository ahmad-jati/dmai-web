
function SessionCardSkeleton() {
  return (
    <div className="flex flex-col 2md:items-start items-end gap-3 bg-background 2md:rounded-[20px] rounded-lg border border-foreground/20 w-full overflow-hidden p-3 animate-pulse">
      {/* Image placeholder — same dimensions as real card image */}
      <div className="md:w-full md:h-40 2xs:w-34 2xs:h-30 w-24 h-20 2md:rounded-[14px] rounded-[10px] bg-foreground/8" />

      {/* Text content placeholder */}
      <div className="flex flex-col items-start gap-1.5 2md:px-1 w-full">
        {/* Session name */}
        <div className="h-lh bg-foreground/10 rounded w-3/4" />

        {/* Detail short — 3 lines matching line-clamp-3 */}
        <div className="flex flex-col gap-1 w-full 2md:min-h-[3lh]">
          <div className="h-lh bg-foreground/8 rounded w-full" />
          <div className="h-lh bg-foreground/8 rounded w-5/6" />
        </div>

        {/* Meta row — instruksi + durasi */}
        <div className="flex items-center gap-3">
          <div className="h-3 bg-foreground/6 rounded w-20" />
          <div className="h-3 bg-foreground/6 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export function SessionListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="
        grid 2lg:grid-cols-4 3md:grid-cols-3 2xs:grid-cols-2 grid-cols-1 gap-3.5 
        w-full
      "
    >
      {Array.from({ length: count }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  );
}