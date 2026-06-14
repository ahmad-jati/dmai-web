import { SessionListSkeleton } from "@/components/section/homepage/session-list-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col items-center md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto w-full sm:pt-32 xs:pt-30 pt-26">
      <div className="flex flex-col gap-8 w-full">
        {/* Hero section placeholder */}
        <div className="rounded-2xl bg-lemon animate-pulse w-full h-48 sm:h-56" />

        {/* Session list section placeholder */}
        <div className="rounded-2xl bg-lavender p-6 flex flex-col gap-6">
          {/* Section header */}
          <div className="flex flex-col gap-2">
            <div className="h-7 bg-foreground/10 rounded w-36 animate-pulse" />
            <div className="h-5 bg-foreground/7 rounded w-72 animate-pulse" />
          </div>
          <SessionListSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}