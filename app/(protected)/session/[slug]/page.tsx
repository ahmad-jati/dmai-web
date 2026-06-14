'use client'

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/components/layout/section-wrapper";
import { Button } from "@/components/ui/button";
import { OtherSessionList } from "@/components/other-session-list";
import { fetchSessionBySlug, type SessionData } from "@/lib/data-detail-session";
import { createClient } from "@/lib/supabase/client";
import { PersonSimpleTaiChiIcon, TimerIcon, PlayIcon, HeartIcon } from "@phosphor-icons/react";
import { Route } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

function SessionDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="flex gap-8 bg-celeste">
        <div className="flex flex-col justify-between max-w-xl w-full gap-6 animate-pulse">
          <div className="h-3 bg-foreground/10 rounded w-48" />
          <div className="flex flex-col gap-4">
            <div className="h-8 bg-foreground/10 rounded w-3/4" />
            <div className="flex flex-col gap-2">
              <div className="h-3 bg-foreground/8 rounded w-full" />
              <div className="h-3 bg-foreground/8 rounded w-5/6" />
              <div className="h-3 bg-foreground/8 rounded w-4/6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-3 bg-foreground/8 rounded w-32" />
              <div className="h-3 bg-foreground/8 rounded w-28" />
              <div className="h-3 bg-foreground/8 rounded w-48" />
            </div>
          </div>
          <div className="h-10 bg-foreground/10 rounded-full w-32" />
        </div>
        <div className="flex-1 rounded-5xl border border-foreground/20 bg-foreground/8 h-88 animate-pulse" />
      </Section>

      <Section className="bg-pink">
        <div className="flex flex-col gap-4">
          <div className="h-6 bg-foreground/10 rounded w-32 animate-pulse" />
          <div className="grid grid-cols-3 gap-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-background rounded-lg border border-foreground/20 animate-pulse" />
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}

export default function Page({ params }: Props) {
  const { slug } = use(params);

  const [session, setSession] = useState<SessionData | null | undefined>(undefined)
  const [completionCount, setCompletionCount] = useState<number>(0)

  useEffect(() => {
    fetchSessionBySlug(slug).then((data) => setSession(data ?? null))
  }, [slug])

  useEffect(() => {
    const fetchCount = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return
      const { count } = await supabase
        .from("session_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("session_slug", slug)
      setCompletionCount(count ?? 0)
    }
    fetchCount()
  }, [slug])

  if (session === undefined) return <SessionDetailSkeleton />
  if (session === null) notFound()

  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="flex 2md:flex-row flex-col justify-between gap-8 bg-celeste">
        <div className="flex flex-col 2md:items-start items-center 2md:justify-between 2md:gap-0 gap-4 lg:max-w-xl 2md:max-w-sm">
          <div className="2md:flex hidden items-center gap-1">
            <Link
              href={'/session' as Route}
              className="hover:underline underline-offset-2 xs:text-p/5 text-xs/3.5 font-medium "
            >
              ALL SESSION
            </Link>
            <p className="xs:text-p/5 text-sm/4 font-medium">/</p>
            <p className="xs:text-p/5 text-sm/4 font-medium">{session.session_name.toUpperCase()}</p>
          </div>

          <div className="
            rounded-lg border border-foreground bg-background p-2  
            sm:h-70 xs:h-60 
            2md:hidden block 
          ">
            <div className="w-full h-full overflow-hidden rounded-sm bg-muted-foreground/10">
              <Image
                src={session.image_cover}
                alt={session.session_name}
                width={2000}
                height={2000}
                priority
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                unoptimized
              />
            </div>
          </div>

          <div className="2md:hidden flex flex-col gap-2 items-center">
            <h1 className="sm:text-h1/8 xs:text-[1.8rem]/8 text-xl/7 md:text-left text-center font-semibold">{session.session_name.toUpperCase()}</h1>

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
              <div className="2md:hidden flex justify-center text-muted-foreground items-center gap-1 w-full">
                <HeartIcon className="w-4 h-4" weight="fill" />
                <p className="font-medium xs:text-p/5 text-xs/3.5"> 
                  {completionCount === 0
                    ? "Belum mengikuti sesi ini"
                    : `Sesi diikuti ${completionCount} kali`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col 2md:items-start items-center gap-4">
            <h1 className="sm:text-h1/8 xs:text-[1.8rem]/8 text-h2/7 md:text-left text-center font-semibold 2md:block hidden">{session.session_name.toUpperCase()}</h1>

            {session.detail_full.map((para, i) => (
              <p key={i} className="font-medium xs:text-p/5 text-xs/3.5 2md:text-left text-center max-w-120 text-pretty">{para}</p>
            ))}

            <div className="2md:flex hidden flex-col md:items-start items-center gap-1.5">
              <div className="flex items-center gap-1">
                <PersonSimpleTaiChiIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium xs:text-p/5 text-xs/3.5">{session.total_instruction} Instruksi</p>
              </div>
              <div className="flex items-center gap-1">
                <TimerIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium xs:text-p/5 text-xs/3.5">{session.duration}</p>
              </div>
              <div className="flex items-center gap-1">
                <HeartIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium xs:text-p/5 text-xs/3.5">
                  {completionCount === 0
                    ? "Kamu belum pernah mengikuti sesi ini"
                    : `Kamu telah mengikuti sesi ini ${completionCount} kali`}
                </p>
              </div>
            </div>
          </div>

          <Button 
            variant={'default'}
            className="flex gap-2 items-center [&_svg]:size-3"
          >
            <Link href={`/session/${slug}/exercise` as Route} className="flex items-center gap-2">
              MULAI SESI
              <PlayIcon className="w-5 h-5" weight="fill" />
            </Link>
          </Button>
        </div>

        <div className="flex-1 rounded-5xl border border-foreground bg-background p-2 max-w-130 h-88 2md:block hidden">
          <div className="w-full h-full overflow-hidden rounded-4xl bg-muted-foreground/10">
            <Image
              src={session.image_cover}
              alt={session.session_name}
              width={2000}
              height={2000}
              priority
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              unoptimized
            />
          </div>
        </div>
      </Section>

      <Section className="bg-pink">
        <OtherSessionList excludeSlug={slug} />
      </Section>
    </div>
  );
}