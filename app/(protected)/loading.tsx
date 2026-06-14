import { SessionListSkeleton } from "@/components/section/homepage/session-list-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col items-center  gap-8 lg:max-w-7xl mx-auto w-full pt-0">
      <div className="flex flex-col gap-8 w-full">
        {/* Hero section placeholder */}
        <div className="bg-celeste animate-pulse w-full min-h-[calc(64svh-64px)] md:min-h-[calc(42dvh-52px)] md:rounded-5xl rounded-xl border border-foreground" />

        {/* Session list section placeholder */}
        <div className="md:rounded-5xl rounded-xl border border-foreground bg-pink p-6 flex flex-col gap-6">
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