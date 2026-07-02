import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import SessionLocked from "@/components/session-locked"
import { Section } from "@/components/layout/section-wrapper"
import { Button } from "@/components/ui/button"
import { OtherSessionList } from "@/components/other-session-list"
import { fetchSessionBySlug } from "@/lib/data-detail-session"
import { LightbulbIcon, TimerIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr"
import { Route } from "next"
import { CompletionCount, CompletionCountMobile } from "@/components/session/completion-count"

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9HQAI8gMBfTQ1BQAAAABJRU5ErkJggg=="

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await fetchSessionBySlug(slug)
  console.log(session)

  if (!session) notFound()
  

  return (
    <div className="flex flex-col gap-8 w-full lg:h-full h-fit">
      <div className="flex flex-row gap-4 h-full group">
        <Section className="bg-celeste h-full lg:w-fit w-full">
          <div className="flex flex-col lg:items-start items-center lg:justify-between gap-4 lg:max-w-xl h-full">

            {/* Mobile title + meta */}
            <div className="lg:hidden flex flex-col gap-2 items-center">
              <p className="text-lg font-medium text-muted-foreground -mb-3 block lg:hidden">Session</p>
              <h1 className="sm:text-h1/8 xs:text-[1.8rem]/8 text-xl/7 md:text-left text-center font-semibold">
                {session.session_name.toUpperCase()}
              </h1>
              <div className="flex flex-col gap-1 items-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <LightbulbIcon className="w-4 h-4" weight="fill" />
                    <p className="font-medium xs:text-p/5 text-xs/3.5">{session.total_instruction} Instruksi</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TimerIcon className="w-4 h-4" weight="fill" />
                    <p className="font-medium xs:text-p/5 text-xs/3.5">{session.duration}</p>
                  </div>
                </div>
                <CompletionCountMobile slug={slug} />
              </div>
            </div>

            {/* Mobile image */}
            <div className="sm:h-90 xs:h-60 w-full lg:hidden block">
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

            <div className="flex flex-col lg:items-start items-center gap-4">
              <p className="text-lg font-medium text-muted-foreground -mb-3 lg:block hidden">Session</p>
              <h1 className="sm:text-h1/8 xs:text-[1.8rem]/8 text-h2/7 md:text-left text-center font-semibold lg:block hidden">
                {session.session_name.toUpperCase()}
              </h1>

              {(session.detail_full as string[]).map((para, i) => (
                <p key={i} className="font-medium xs:text-p/5 text-xs/3.5 lg:text-left text-center max-w-120 text-pretty">
                  {para}
                </p>
              ))}
            </div>

            <div className="flex-col gap-1 items-start justify-start text-muted-foreground lg:flex hidden">
              <div className="flex items-center gap-1">
                <LightbulbIcon className="w-4 h-4" weight="fill" />
                <p className="font-medium xs:text-p/5 text-xs/3.5">{session.total_instruction} Instruksi</p>
              </div>
              <div className="flex items-center gap-1">
                <TimerIcon className="w-4 h-4" weight="fill" />
                <p className="font-medium xs:text-p/5 text-xs/3.5">{session.duration}</p>
              </div>
              <CompletionCount slug={slug} />
            </div>

            <Link href={`/session/${slug}/exercise` as Route} className="flex items-center gap-2">
              <Button
                variant={"default"}
                className="flex gap-2 items-center [&_svg]:size-3 dark:bg-primary lg:text-base"
              >
                Mulai Sesi
                <PlayIcon className="w-5 h-5" weight="fill" />
              </Button>
            </Link>
          </div>

        </Section>
        <div className="bg-celeste md:rounded-5xl rounded-xl border border-foreground p-3 h-full flex-1 lg:block hidden">
          <div className="w-full h-full overflow-hidden rounded-4xl bg-muted-foreground/10">
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

      <Section className="bg-pink">
        <OtherSessionList excludeSlug={slug} />
      </Section>
    </div>
  )
}