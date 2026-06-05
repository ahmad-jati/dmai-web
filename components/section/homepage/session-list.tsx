'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllSessions, type SessionData } from "@/lib/data-detail-session";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@phosphor-icons/react";
import { Route } from "next";

function SessionCardSkeleton() {
  return (
    <div className="flex flex-col justify-between items-end gap-4 bg-background p-3 rounded-lg border border-foreground/30 w-full h-40 animate-pulse">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-2.5 bg-muted/60 rounded w-1/2 mt-0.5" />
      </div>

      <div className="w-8 h-8 bg-muted rounded-md shrink-0" />
    </div>
  )
}

export function SessionList({ excludeSlug }: { excludeSlug?: string }) {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllSessions().then((data) => {
      setSessions(data)
      setLoading(false)
    })
  }, [])

  const filtered = excludeSlug
    ? sessions.filter((s) => s.slug !== excludeSlug)
    : sessions

  return (
    <div id="session-list" className="flex flex-col gap-4 items-start">
      <div className="flex flex-col gap-3 max-w-180">
        <h2>All Session</h2>
        <p className="font-medium">Mulai perlahan, pilih satu sesi yang terasa paling dekat denganmu.</p>
      </div>

      <div className="grid grid-cols-4 gap-3.5 w-full">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))
          : filtered.map((session) => (
              <Link
                key={session.slug}
                href={`/session/${session.slug}` as Route}
                className="group flex flex-col items-end justify-between gap-2 bg-background p-3 rounded-lg border border-foreground w-full h-62.5"
              >
                <div className="w-full h-35">
                  <Image
                    src={session.image_cover}
                    alt={`session ${session.session_name}`}
                    width={2000}
                    height={2000}
                    priority
                    unoptimized
                    className="w-full h-full object-cover rounded-md bg-muted-foreground/10"
                  />
                </div>
                <div className="flex flex-col gap-1 self-end">
                  <p className="font-bold text-md group-hover:underline underline-offset-2">{session.session_name}</p>
                  <p className="font-medium text-sm">{session.detail_short}</p>
                  <p className="font-medium text-xs text-muted-foreground">
                    {session.total_instruction} Instruksi ● {session.duration}
                  </p>
                  {/* <Button className="w-8 h-8 [&_svg]:size-3.5 bg-white self-end" asChild>
                    <span>
                      <PlayIcon className="w-5 h-5" weight="fill"/>
                    </span>
                  </Button> */}
                </div>
              </Link>
            ))
        }

        {/* {!loading && (
          <div className="relative flex flex-col items-center justify-end bg-background rounded-lg border border-foreground overflow-hidden h-full">
            <div className="flex-1 flex items-center ">
              <p className="font-bold text-xl">
                You&apos;re not alone.
              </p>
            </div>
            <div className="relative -mb-3">
              <Image
                src="/tropicaline/Diversity.png"
                alt="Diversity icon"
                width={400}
                height={400}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}