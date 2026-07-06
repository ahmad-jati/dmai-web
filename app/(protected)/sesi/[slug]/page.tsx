import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Section } from "@/components/layout/section-wrapper"
import { Button } from "@/components/ui/button"
import { OtherSessionList } from "@/components/other-session-list"
import { fetchSessionBySlug } from "@/lib/data-detail-session"
import { LightbulbIcon, TimerIcon, PlayIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr"
import { Route } from "next"
import { CompletionCount, CompletionCountMobile } from "@/components/session/completion-count"
import { SessionDetailSkeleton } from "@/components/session/session-detail-skeleton"
import { cn } from "@/lib/utils"
import { fetchCompletionCount } from "@/lib/fetch-completion-count"

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9HQAI8gMBfTQ1BQAAAABJRU5ErkJggg=="

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <div className="flex flex-col gap-8 w-full h-fit">
      <Suspense fallback={<SessionDetailSkeleton />}>
        <SessionDetail slug={slug} />
      </Suspense>

      <Section className="bg-pink dark:bg-card">
        <OtherSessionList excludeSlug={slug} />
      </Section>
    </div>
  )
}

async function SessionDetail({ slug }: { slug: string }) {
  const [session, completionCount] = await Promise.all([
    fetchSessionBySlug(slug),
    fetchCompletionCount(slug),
  ])

  if (!session) notFound()

  const isLocked = session.is_locked === true
  console.log(completionCount)
  console.log(session)

  return (
    <div className="relative w-full">
      <Section className={cn("bg-celeste h-full w-full flex gap-10 items-center dark:bg-card", isLocked && "pointer-events-none select-none")}>
        <div className="flex flex-col lg:items-start items-center lg:justify-between gap-4 lg:w-120 w-full h-full">

          {/* Mobile title + meta */}
          <div className="lg:hidden flex flex-col gap-2 items-center mb-2">
            <p className="md:text-xl text-sm font-medium text-muted-foreground -mb-2 block lg:hidden uppercase">Sesi</p>
            <h2 className="md:text-3xl/6.5 2xs:text-3xl/6.5 text-2xl/6 text-center font-semibold md:max-w-160 w-full">
              {session.session_name} 
            </h2>
            <div className="flex flex-col gap-1 items-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <LightbulbIcon className="w-4 h-4" weight="fill" />
                  <p className="font-medium 2xs:text-sm/5 text-xs/3.5">{session.total_instruction} Instruksi</p>
                </div>
                <div className="flex items-center gap-1">
                  <TimerIcon className="w-4 h-4" weight="fill" />
                  <p className="font-medium 2xs:text-sm/5 text-xs/3.5">{session.duration}</p>
                </div>
              </div>
              <CompletionCountMobile count={completionCount} />
            </div>
          </div>

          {/* Mobile image */}
          <div className="2xs:h-60 sm:w-120 2xs:w-100 w-full h-40 lg:hidden block">
            <div className="w-full h-full overflow-hidden md:rounded-3xl rounded-xl">
              <Image
                src={session.image_cover}
                alt={session.session_name}
                width={2000}
                height={2000}
                priority
                unoptimized
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>

          <div className="flex flex-col lg:items-start items-center gap-4 w-full">
            {/* <p className="text-lg font-medium text-muted-foreground -mb-6 lg:block hidden pl-1 uppercase">Sesi</p> */}
            <h1 className="sm:text-h1/8.5 xs:text-[1.8rem]/8 text-h2/7 md:text-left text-center font-semibold lg:block hidden">
              {session.session_name}
            </h1>

            <div className="flex flex-col gap-2 md:max-w-160 w-full">
              {(session.detail_full as string[]).map((para, i) => (
                <p key={i} className="font-medium sm:text-p/5 text-sm/4 lg:text-left text-center text-pretty 2md:px-0 px-0">
                  {para}
                </p>
              ))}
            </div>
          </div>

            <div className="flex-col gap-1 items-start justify-start text-muted-foreground lg:flex hidden">
              <div className="flex items-center gap-1">
                <LightbulbIcon className="w-4 h-4" weight="fill" />
                <p className="font-medium xs:text-sm/5 text-xs/3.5">{session.total_instruction} Instruksi</p>
              </div>
              <div className="flex items-center gap-1">
                <TimerIcon className="w-4 h-4" weight="fill" />
                <p className="font-medium xs:text-sm/5 text-xs/3.5">{session.duration}</p>
              </div>
              <CompletionCount count={completionCount} />
          </div>

          <div className="flex lg:flex-row flex-col lg:gap-2 gap-1 items-center lg:mt-0 mt-2">
            {isLocked ? (
              <Button
                variant={"default"}
                disabled
                className="flex gap-2 items-center [&_svg]:size-3 dark:bg-primary lg:text-base bg-white text-foreground opacity-50 cursor-not-allowed"
              >
                Terkunci
                <LockSimpleIcon className="w-5 h-5" weight="fill" />
              </Button>
            ) : (
              <Link href={`/sesi/${slug}/latihan` as Route} className="flex items-center gap-2">
                <Button
                  variant={"default"}
                  className="flex gap-2 items-center [&_svg]:size-3 dark:bg-primary lg:text-sm bg-white hover:bg-white/90 text-foreground rounded-lg"
                >
                  Mulai Sesi
                  {/* <PlayIcon className="w-5 h-5" weight="fill" /> */}
                </Button>
              </Link>
            )}

            <p className="xs:text-sm text-2xs text-muted-foreground">atau</p>

            <Link
              href={"/beranda" as Route}
              className="xs:text-sm text-2xs underline-offset-2 hover:underline hover:cursor-pointer text-muted-foreground"
            >
                Kembali ke Beranda
            </Link>
          </div>
        </div>
        <div className="flex-1 lg:block hidden">
          <div className="rounded-4xl p-3 border border-muted-foreground bg-amber-50 dark:bg-transparent dark:p-0 dark:border-0">
            <div className="h-70 overflow-hidden rounded-3xl bg-muted-foreground/10">
              <Image
                src={session.image_cover}
                alt={session.session_name}
                width={2000}
                height={2000}
                priority
                unoptimized
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </Section>

      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 md:rounded-5xl rounded-xl border border-foreground bg-background/30 backdrop-blur-sm p-4">
          <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center">
            <LockSimpleIcon className="w-8 h-8 text-foreground" weight="fill" />
          </div>
          <p className="text-sm/4 font-semibold text-foreground text-center px-6">
            Sesi ini belum dapat diakses. Silakan cek kembali nanti.
          </p>
        </div>
      )}
    </div>
  )
}