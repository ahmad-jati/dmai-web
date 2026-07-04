import { Skeleton } from "@/components/ui/skeleton"
import { Section } from "@/components/layout/section-wrapper"

export function SessionDetailSkeleton() {
  return (
    <div className="relative h-full w-full">
      <Section className="bg-celeste h-full w-full flex gap-10 items-center">
        <div className="flex flex-col lg:items-start items-center lg:justify-between gap-4 lg:w-120 w-full h-full">
          {/* Mobile title + meta */}
          <div className="lg:hidden flex flex-col gap-2 items-center w-full">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex flex-col gap-1 items-center mt-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Mobile image */}
          <div className="2xs:h-60 sm:w-120 2xs:w-100 w-full h-40 lg:hidden block">
            <Skeleton className="w-full h-full md:rounded-3xl rounded-xl" />
          </div>

          {/* Desktop title + description */}
          <div className="flex flex-col lg:items-start items-center gap-6 w-full">
            <Skeleton className="h-10 w-2/3 lg:block hidden" />

            <div className="flex flex-col gap-2 md:max-w-160 w-full items-center lg:items-start">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>

          {/* Desktop meta */}
          <div className="flex-col gap-2 items-start justify-start lg:flex hidden w-full">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
              <Skeleton className="h-4 w-43" />
          </div>

          {/* CTA row */}
          <div className="flex sm:flex-row flex-col sm:gap-2 gap-1 items-center">
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        {/* Desktop cover image */}
        <div className="flex-1 lg:block hidden">
          <div className="rounded-4xl p-3 border border-muted-foreground bg-amber-50">
            <Skeleton className="h-70 w-full rounded-3xl" />
          </div>
        </div>
      </Section>
    </div>
  )
}