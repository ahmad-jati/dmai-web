function SessionCardSkeleton() {
  return (
    <div className="group flex 2xs:flex-row flex-col items-start 2xs:gap-6 gap-3 2md:rounded-[20px] rounded-lg w-full overflow-hidden p-3 lg:bg-transparent bg-background animate-pulse">
      {/* Week number badge placeholder */}
      <div className="h-full shrink-0">
        <div className="h-10 w-14 bg-foreground/10 rounded" />
      </div>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col gap-1.5">
          {/* Session name */}
          <div className="h-lh bg-foreground/10 rounded w-3/4" />

          {/* Detail short — 3 lines matching line-clamp-3 */}
          <div className="flex flex-col gap-1 w-full 2md:min-h-[3lh]">
            <div className="h-lh bg-foreground/8 rounded w-full" />
            <div className="h-lh bg-foreground/8 rounded w-5/6" />
            <div className="h-lh bg-foreground/8 rounded w-2/3" />
          </div>
        </div>

        {/* Image placeholder — same dimensions as real card image */}
        <div className="relative w-full lg:h-60 3md:h-40 sm:h-60 xs:h-44 h-34 rounded-sm overflow-hidden bg-foreground/8" />
      </div>
    </div>
  );
}

export function SessionListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="
        grid 2md:grid-cols-2 grid-cols-1 2xs:gap-3.5 gap-2
        w-full
      "
    >
      {Array.from({ length: count }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  );
}