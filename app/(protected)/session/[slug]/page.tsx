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
  if (session === undefined) {
    return (
      <div className="flex flex-col gap-8 w-full">
        <Section className="bg-celeste h-[76dvh] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Memuat sesi...</p>
        </Section>
      </div>
    )
  }

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
            src={session.instructions[0]?.image}
            alt={session.session_name}
            width={2000}
            height={2000}
            className="w-full h-full object-cover rounded-4xl"
            loading="eager"
          />
        </div>
      </Section>

      <Section className="bg-pink">
        <SessionList excludeSlug={slug} />
      </Section>
    </div>
  );
}