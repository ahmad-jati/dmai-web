'use client'

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/components/layout/section-wrapper";
import { Button } from "@/components/ui/button";
import { SessionList } from "@/components/session-list";
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
          {/* breadcrumb */}
          <div className="h-3 bg-foreground/10 rounded w-48" />
          <div className="flex flex-col gap-4">
            {/* title */}
            <div className="h-8 bg-foreground/10 rounded w-3/4" />
            {/* paragraphs */}
            <div className="flex flex-col gap-2">
              <div className="h-3 bg-foreground/8 rounded w-full" />
              <div className="h-3 bg-foreground/8 rounded w-5/6" />
              <div className="h-3 bg-foreground/8 rounded w-4/6" />
            </div>
            {/* meta */}
            <div className="flex flex-col gap-1.5">
              <div className="h-3 bg-foreground/8 rounded w-32" />
              <div className="h-3 bg-foreground/8 rounded w-28" />
              <div className="h-3 bg-foreground/8 rounded w-48" />
            </div>
          </div>
          {/* button */}
          <div className="h-10 bg-foreground/10 rounded-full w-32" />
        </div>

        {/* image */}
        <div className="flex-1 rounded-5xl border border-foreground/20 bg-foreground/8 h-88 animate-pulse" />
      </Section>

      {/* bottom section placeholder */}
      <Section className="bg-pink">
        <div className="flex flex-col gap-4">
          <div className="h-6 bg-foreground/10 rounded w-32 animate-pulse" />
          <div className="grid grid-cols-3 gap-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
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

  // still loading
  if (session === undefined) return <SessionDetailSkeleton />

  // not found
  if (session === null) notFound()

  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="flex gap-8 bg-celeste">
        <div className="flex flex-col justify-between max-w-xl">
          <div className="flex items-center gap-1 font-semibold text-sm">
            <Link href={'/session' as Route}>ALL SESSION</Link>
            <p>/</p>
            <p>{session.session_name.toUpperCase()}</p>
          </div>

          <div className="flex flex-col gap-4">
            <h1>{session.session_name.toUpperCase()}</h1>

            {session.detail_full.map((para, i) => (
              <p key={i} className="font-medium text-base">{para}</p>
            ))}

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <PersonSimpleTaiChiIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium text-sm">{session.total_instruction} Instruksi</p>
              </div>
              <div className="flex items-center gap-1">
                <TimerIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium text-sm">{session.duration}</p>
              </div>
              <div className="flex items-center gap-1">
                <HeartIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium text-sm">
                  {completionCount === 0
                    ? "Kamu belum pernah mengikuti sesi ini"
                    : `Kamu telah mengikuti sesi ini ${completionCount} kali`}
                </p>
              </div>
            </div>
          </div>

          <Button className="w-fit [&_svg]:size-3">
            <Link href={`/session/${slug}/exercise` as Route} className="flex items-center gap-2">
              MULAI SESI
              <PlayIcon className="w-5 h-5" weight="fill" />
            </Link>
          </Button>
        </div>

        <div className="flex-1 rounded-5xl border border-foreground bg-background p-2 h-88">
          <Image
            src={session.image_cover}
            alt={session.session_name}
            width={2000}
            height={2000}
            priority
            className="w-full h-full object-cover rounded-4xl"
            unoptimized
          />
        </div>
      </Section>

      <Section className="bg-pink">
        <SessionList excludeSlug={slug} />
      </Section>
    </div>
  );
}