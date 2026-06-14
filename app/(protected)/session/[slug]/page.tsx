import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Section } from "@/components/layout/section-wrapper"
import { Button } from "@/components/ui/button"
import { OtherSessionList } from "@/components/other-session-list"
import { fetchSessionBySlug } from "@/lib/data-detail-session"
import { PersonSimpleTaiChiIcon, TimerIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr"
import { Route } from "next"
import { CompletionCount, CompletionCountMobile } from "@/components/session/completion-count"

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9HQAI8gMBfTQ1BQAAAABJRU5ErkJggg=="

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await fetchSessionBySlug(slug)

  if (!session) notFound()

  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="flex 2md:flex-row flex-col justify-between gap-8 bg-celeste min-h-[calc(64svh-64px)] md:min-h-[calc(42dvh-52px)]">
        <div className="flex flex-col 2md:items-start items-center 2md:justify-between 2md:gap-0 gap-4 lg:max-w-xl 2md:max-w-sm">
          
          <div className="2md:flex hidden items-center gap-1">
            <Link
              href={'/session' as Route}
              className="hover:underline underline-offset-2 xs:text-p/5 text-xs/3.5 font-medium"
            >
              ALL SESSION
            </Link>
            <p className="xs:text-p/5 text-sm/4 font-medium">/</p>
            <p className="xs:text-p/5 text-sm/4 font-medium">{session.session_name.toUpperCase()}</p>
          </div>

          {/* Mobile image */}
          <div className="rounded-lg border border-foreground bg-background p-2 sm:h-70 xs:h-60 2md:hidden block">
            <div className="w-full h-full overflow-hidden rounded-sm bg-muted-foreground/10">
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

          {/* Mobile title + meta */}
          <div className="2md:hidden flex flex-col gap-2 items-center">
            <h1 className="sm:text-h1/8 xs:text-[1.8rem]/8 text-xl/7 md:text-left text-center font-semibold">
              {session.session_name.toUpperCase()}
            </h1>
            <div className="flex flex-col gap-1 items-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <PersonSimpleTaiChiIcon className="w-4 h-4" weight="fill" />
                  <p className="font-medium xs:text-p/5 text-xs/3.5">{session.total_instruction} Instruksi</p>
                </div>
                <div className="flex items-center gap-1">
                  <TimerIcon className="w-4 h-4" weight="fill" />
                  <p className="font-medium xs:text-p/5 text-xs/3.5">{session.duration}</p>
                </div>
              </div>
              {/* Client component — loads user's count independently */}
              <CompletionCountMobile slug={slug} />
            </div>
          </div>

          <div className="flex flex-col 2md:items-start items-center gap-4">
            <h1 className="sm:text-h1/8 xs:text-[1.8rem]/8 text-h2/7 md:text-left text-center font-semibold 2md:block hidden">
              {session.session_name.toUpperCase()}
            </h1>

            {(session.detail_full as string[]).map((para, i) => (
              <p key={i} className="font-medium xs:text-p/5 text-xs/3.5 2md:text-left text-center max-w-120 text-pretty">
                {para}
              </p>
            ))}

            {/* Desktop meta */}
            <div className="2md:flex hidden flex-col md:items-start items-center gap-1.5 text-muted-foreground">
              <div className="flex items-center gap-1">
                <PersonSimpleTaiChiIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium xs:text-p/5 text-xs/3.5">{session.total_instruction} Instruksi</p>
              </div>
              <div className="flex items-center gap-1">
                <TimerIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium xs:text-p/5 text-xs/3.5">{session.duration}</p>
              </div>
              {/* Client component — loads user's count independently */}
              <CompletionCount slug={slug} />
            </div>
          </div>

          <Button
            variant={"default"}
            className="flex gap-2 items-center [&_svg]:size-3"
          >
            <Link href={`/session/${slug}/exercise` as Route} className="flex items-center gap-2">
              MULAI SESI
              <PlayIcon className="w-5 h-5" weight="fill" />
            </Link>
          </Button>
        </div>

        {/* Desktop image */}
        <div className="flex-1 rounded-5xl border border-foreground bg-background p-2 max-w-130 h-88 2md:block hidden">
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
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </Section>

      <Section className="bg-pink">
        <OtherSessionList excludeSlug={slug} />
      </Section>
    </div>
  )
}