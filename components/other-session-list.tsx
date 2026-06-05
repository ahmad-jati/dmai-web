'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllSessions, type SessionData } from "@/lib/data-detail-session";
import { Button } from "@/components/ui/button";
import { PersonSimpleTaiChiIcon, PlayIcon, TimerIcon } from "@phosphor-icons/react";
import { Route } from "next";
import Image from "next/image";

function SessionCardSkeleton() {
  return (
    <div className="flex flex-col justify-between items-end gap-4 bg-background p-3 rounded-lg border border-foreground/30 w-full h-40 animate-pulse">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-2.5 bg-muted/60 rounded w-1/2 mt-0.5" />
      </div>
      <div className="w-8 h-8 bg-muted rounded-md shrink-0" />
    </div>
  )
}

export function OtherSessionList({ excludeSlug }: { excludeSlug?: string }) {
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
      <h2>Other Session</h2>

      <div className="grid grid-cols-3 gap-3.5 w-full">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SessionCardSkeleton key={i} />)
          : filtered.map((session) => (
              <Link
                key={session.slug}
                href={`/session/${session.slug}` as Route}
                className="flex flex-row-reverse group justify-between items-center gap-4 bg-background p-3 rounded-lg border border-foreground w-full h-full"
              >
                <div className="w-full h-36">
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
                <div className="flex flex-col h-full py-4 justify-between">
                  <div className=" ">
                    <p className="font-bold text-md group-hover:underline underline-offset-2">{session.session_name}</p>
                  </div>
                    <div className="self-end flex flex-col gap-1">
                      <p className="font-medium text-sm">{session.detail_short}</p>

                      <div className="flex items-center gap-1 mt-1">
                        <PersonSimpleTaiChiIcon className="w-3 h-3 text-muted-foreground" weight="fill" />
                        <p className="font-medium text-xs text-muted-foreground">{session.total_instruction} Instruksi</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <TimerIcon className="w-3 h-3 text-muted-foreground" weight="fill" />
                        <p className="font-medium text-xs text-muted-foreground">{session.duration}</p>
                      </div>
                    </div>

                  {/* <Button className="p-2 bg-white w-8 h-8 [&_svg]:size-3.5 self-end group-hover:bg-celeste" asChild>
                    <span>
                      <PlayIcon className="w-5 h-5" weight="fill" />
                    </span>
                  </Button> */}
                </div>
                {/* <div>
                </div> */}
              </Link>
            ))
        }
      </div>
    </div>
  )
}