import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { fetchAllSessions } from "@/lib/data-detail-session"
import { ArrowUpRightIcon, PersonSimpleTaiChiIcon, TimerIcon } from "@phosphor-icons/react/dist/ssr"
import { Route } from "next"
import { Button } from "./ui/button"

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9HQAI8gMBfTQ1BQAAAABJRU5ErkJggg=="

function OtherSessionCardSkeleton() {
  return (
    <div className="flex flex-col items-end 2xs:gap-4 gap-2 bg-background 2md:rounded-[20px] rounded-lg border border-foreground/20 w-full overflow-hidden p-3 animate-pulse">
      <div className="md:w-full md:h-40 2xs:w-34 2xs:h-30 w-24 h-20 2md:rounded-[14px] rounded-[10px] bg-foreground/8" />
      <div className="flex flex-col items-start xs:gap-1.5 gap-2 2md:px-1 w-full">
        <div className="h-[1lh] bg-foreground/10 rounded w-3/4" />
        <div className="h-[1lh] bg-foreground/8 rounded w-full" />
        <div className="flex items-center gap-3">
          <div className="h-3 bg-foreground/6 rounded w-20" />
          <div className="h-3 bg-foreground/6 rounded w-14" />
        </div>
      </div>
    </div>
  )
}

function OtherSessionListSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 3md:grid-cols-2 grid-cols-1 gap-3.5 w-full">
      {Array.from({ length: 6 }).map((_, i) => (
        <OtherSessionCardSkeleton key={i} />
      ))}
    </div>
  )
}

async function OtherSessionListServer({ excludeSlug }: { excludeSlug?: string }) {
  const sessions = await fetchAllSessions()

  const filtered = excludeSlug
    ? sessions.filter((s) => s.slug !== excludeSlug)
    : sessions

  return (
    <div className="grid lg:grid-cols-3 3md:grid-cols-2 grid-cols-1 gap-3.5 w-full">
      {filtered.map((session) => (
        <Link
          key={session.slug}
          href={`/session/${session.slug}` as Route}
          className="
            group flex flex-col items-end 2xs:gap-4 gap-2
            bg-background dark:bg-card 2md:rounded-[20px] rounded-lg border border-foreground w-full overflow-hidden hover:shadow-md transition-shadow 
            p-3
          "
        >
          <div className="md:w-full md:h-40 2xs:w-34 2xs:h-30 w-24 h-20 2md:rounded-[14px] rounded-[10px] overflow-hidden">
            <Image
              src={session.image_cover}
              alt={`session ${session.session_name}`}
              width={2000}
              height={2000}
              priority
              unoptimized
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="w-full h-full object-cover bg-muted-foreground/10 group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex flex-col items-start xs:gap-1.5 gap-2 2md:px-1 w-full">
            <div className="flex items-center w-full gap-2">
              <p className="text-p/5 max-w-140 font-semibold group-hover:underline underline-offset-2 2md:text-left text-left">
                {session.session_name}
              </p>
              <Button
                variant={"default"}
                className="md:[&_svg]:size-5 [&_svg]:size-6 font-foreground bg-none rounded-none border-none p-0 h-fit md:hidden block"
              >
                <ArrowUpRightIcon />
              </Button>
            </div>

            <p className="2md:mt-0 text-pretty -mt-2 xs:text-p/5 text-sm/4 2md:max-w-140 font-medium text-muted-foreground 2md:text-left text-left">
              {session.detail_short}
            </p>

            <div className="flex-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <PersonSimpleTaiChiIcon className="h-3 w-3 text-muted-foreground" weight="fill" />
                <p className="sm:text-sm/5 text-xs/4 font-medium text-muted-foreground">
                  {session.total_instruction} Instruksi
                </p>
              </span>
              <span className="flex items-center gap-1">
                <TimerIcon className="h-3 w-3 text-muted-foreground" weight="fill" />
                <p className="sm:text-sm/5 text-xs/4 font-medium text-muted-foreground">
                  {session.duration}
                </p>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function OtherSessionList({ excludeSlug }: { excludeSlug?: string }) {
  return (
    <div className="flex flex-col gap-4 items-start">
      <div className="flex flex-col w-full 2md:items-start items-center gap-2 sm:max-w-180 2md:max-w-80">
        <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold sm:text-left text-center">Other Session</h2>
        <p className="xs:text-p/5 text-sm/4 sm:max-w-140 font-medium sm:text-left text-center text-pretty">
          Temukan sesi lain yang bisa menemanimu hari ini.
        </p>
      </div>
      <Suspense fallback={<OtherSessionListSkeleton />}>
        <OtherSessionListServer excludeSlug={excludeSlug} />
      </Suspense>
    </div>
  )
}