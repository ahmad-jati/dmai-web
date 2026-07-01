import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { fetchAllSessions } from "@/lib/data-detail-session"
import { 
  ArrowUpRightIcon, 
  LockSimpleIcon, 
  TimerIcon, 
  LightbulbIcon } from "@phosphor-icons/react/dist/ssr"
import { Route } from "next"
import { Button } from "./ui/button"

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9HQAI8gMBfTQ1BQAAAABJRU5ErkJggg=="

function OtherSessionCardSkeleton() {
  return (
    <div className="flex flex-col items-end 2xs:gap-4 gap-2 bg-background dark:bg-card 2md:rounded-[20px] rounded-lg border border-foreground/15 w-full overflow-hidden p-3 animate-pulse">
      {/* image placeholder — ukuran sama persis dengan card asli */}
      <div className="md:w-full md:h-40 2xs:w-34 2xs:h-30 w-24 h-20 2md:rounded-[14px] rounded-[10px] bg-foreground/8" />

      <div className="flex flex-col items-start xs:gap-1.5 gap-2 2md:px-1 w-full">
        {/* title row + ruang utk lock icon */}
        <div className="flex items-center w-full gap-2">
          <div className="h-[1lh] bg-foreground/10 rounded w-3/4" />
          <div className="h-4 w-4 rounded-full bg-foreground/8 flex-shrink-0" />
        </div>

        {/* deskripsi 2 baris */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="h-3 bg-foreground/8 rounded w-full" />
          <div className="h-3 bg-foreground/8 rounded w-2/3" />
        </div>

        {/* footer: instruksi + durasi */}
        <div className="flex items-center gap-3 mt-1">
          <div className="h-3 bg-foreground/6 rounded w-20" />
          <div className="h-3 bg-foreground/6 rounded w-14" />
        </div>
      </div>
    </div>
  )
}

function OtherSessionListSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 grid-cols-1 gap-3.5 w-full">
      {Array.from({ length: 4 }).map((_, i) => (
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

  const sorted = [...filtered].sort((a, b) => a.week_number - b.week_number)

  return (
    <div className="grid lg:grid-cols-3  md:grid-cols-2 grid-cols-1 2xs:gap-3.5 gap-2 w-full">
      {sorted.map((session) => (
        <Link
          key={session.slug}
          href={session.is_locked ? "#" : (`/session/${session.slug}` as Route)}
          scroll={false}
          className={`
            group flex flex-col items-start lg:gap-6 gap-3
            2md:rounded-[20px] rounded-lg w-full overflow-hidden transition-shadow p-3
            2xs:bg-transparent bg-background
            ${session.is_locked 
              ? "cursor-not-allowed opacity-70" 
              : "hover:bg-background hover:dark:bg-secondary hover:shadow-md"
            }
          `}
        >
          <div className="h-full flex gap-3 items-center">
            <h3 className="font-bold text-5xl text-muted-foreground/30 uppercase">0{session.week_number}</h3>
            <p className={`xs:text-lg/4.5 text-sm/3.5 font-semibold w-full text-left underline-offset-3 ${!session.is_locked && "group-hover:underline"}`}>
                {session.session_name}
              </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <div className="relative w-full lg:h-60 3md:h-40 sm:h-60 xs:h-44 h-34 rounded-sm overflow-hidden">
              <Image
                src={session.image_cover}
                alt={`session ${session.session_name}`}
                fill
                unoptimized
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className={`w-full h-full object-cover bg-muted-foreground/10 transition-transform duration-300 ${!session.is_locked && " rounded-sm"}`}
              />

              {session.is_locked && (
                <div className="absolute inset-0 flex 2xs:flex-row flex-col  items-center gap-3 justify-center bg-background/40 dark:bg-black/40 backdrop-blur-sm z-10 animate-fade-in rounded-sm">
                  <div className="bg-background dark:bg-secondary p-3 rounded-full shadow-lg border border-border/40">
                    <LockSimpleIcon className="h-6 w-6 text-foreground" weight="fill" />
                  </div>
                  <div>
                    <p className="2xs:text-p/5 text-xs/4">Sesi berikutnya segera hadir</p>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 right-4 rounded-sm p-2 flex flex-col xs:gap-1 gap-0 transition items-end 
              md:bg-muted-foreground/40 bg-background md:text-background text-muted-foreground group-hover:bg-background/86  group-hover:text-muted-foreground group-hover:dark:text-foreground              
              ">
                <span className="flex items-center gap-1">
                  <p className="md:text-sm/5 xs:text-xs/4 text-2xs font-medium">
                    {session.total_instruction} Instruksi
                  </p>
                  <LightbulbIcon className="h-3 w-3" weight="fill" />
                </span>

                <span className="flex items-center gap-1">
                  <p className="md:text-sm/5 xs:text-xs/4 text-2xs font-medium">
                    {session.duration}
                  </p>
                  <TimerIcon className="h-3 w-3" weight="fill" />
                </span>
              </div>
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