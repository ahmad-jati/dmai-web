import { SessionListSkeleton } from "@/components/section/homepage/session-list-skeleton";
import { Section } from "@/components/layout/section-wrapper";

export default function Loading() {
  return (
    <div className="flex flex-col items-center  gap-8 lg:max-w-7xl mx-auto w-full pt-0">
      <div className="flex flex-col gap-8 w-full">
        <Section className="flex 2md:flex-row flex-col justify-between gap-8 bg-celeste">

          <div className="flex flex-col 2md:items-start justify-center items-center gap-4 lg:max-w-lg 2md:max-w-sm  w-full">

            <div className="2md:flex hidden items-start justify-start gap-2 ">
              <div className="h-4 w-20 bg-foreground/10 rounded animate-pulse" />
              <div className="h-4 w-32 bg-foreground/10 rounded animate-pulse" />
            </div>

            <div className="rounded-lg w-full border border-foreground bg-background p-2 sm:h-70 xs:h-60 h-52 2md:hidden">
              <div className="w-full h-full bg-foreground/10 rounded animate-pulse" />
            </div>

            <div className="flex flex-col 2md:items-start items-center gap-3 w-full">
              <div className="h-8 w-full bg-foreground/10 rounded animate-pulse" />
              <div className="flex 2md:flex-col gap-2 2md:hidden">
                <div className="h-4 w-8 xs:w-16 2xs:w-28 bg-foreground/10 rounded animate-pulse" />
                <div className="h-4 w-8 xs:w-16 2xs:w-28 bg-foreground/10 rounded animate-pulse" />
                <div className="h-4 w-8 xs:w-16 2xs:w-28 bg-foreground/10 rounded animate-pulse" />
              </div>

              <div className="flex flex-col items-center 2md:items-start gap-2 w-full">
                <div className="h-4 w-full 2xs:w-full bg-foreground/10 rounded animate-pulse" />
                <div className="h-4 w-full 2xs:w-[90%] bg-foreground/10 rounded animate-pulse" />
                <div className="h-4 w-full 2xs:w-[80%] bg-foreground/10 rounded animate-pulse" />
              </div>

            </div>

            <div className="h-10 w-32 bg-foreground/10 rounded-md animate-pulse" />
          </div>

          <div className="flex-1 rounded-5xl border border-foreground bg-background p-2 max-w-130 h-88 hidden 2md:block">
            <div className="w-full h-full rounded-4xl bg-foreground/10 animate-pulse" />
          </div>

        </Section>

        <div className="md:rounded-5xl rounded-xl border border-foreground bg-pink p-6 flex flex-col gap-6">
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