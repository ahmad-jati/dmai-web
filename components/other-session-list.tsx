'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllSessions, type SessionData } from "@/lib/data-detail-session";
import { PersonSimpleTaiChiIcon, TimerIcon } from "@phosphor-icons/react";
import { Route } from "next";
import Image from "next/image";

function SessionCardSkeleton() {
  return (
    <div className="flex flex-row-reverse gap-4 bg-background rounded-lg border border-foreground/20 w-full overflow-hidden animate-pulse h-40">
      {/* image placeholder — right side */}
      <div className="w-36 shrink-0 bg-foreground/8" />
      {/* text side */}
      <div className="flex flex-col justify-between p-3 flex-1">
        <div className="flex flex-col gap-2">
          <div className="h-3.5 bg-foreground/10 rounded w-3/4" />
          <div className="h-3 bg-foreground/8 rounded w-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 bg-foreground/8 rounded w-1/2" />
          <div className="h-2.5 bg-foreground/6 rounded w-2/5" />
        </div>
      </div>
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
                className="flex flex-row-reverse group justify-between items-stretch gap-1.5 bg-background border border-foreground w-full h-40 overflow-hidden hover:shadow-md transition-shadow rounded-[20px] p-3"
              >
                {/* Image — right side */}
                <div className="w-36 shrink-0 overflow-hidden rounded-[14px]">
                  <Image
                    src={session.image_cover}
                    alt={`session ${session.session_name}`}
                    width={2000}
                    height={2000}
                    priority
                    unoptimized
                    className="w-full h-full object-cover bg-muted-foreground/10 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Text — left side */}
                <div className="flex flex-col gap-2 px-1 py-3 flex-1">
                  <p className="font-bold text-base group-hover:underline underline-offset-2 leading-snug">{session.session_name}</p>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-sm text-foreground/70 tracking-normal line-clamp-3 wrap-break-word min-w-0 overflow-hidden leading-relaxed">{session.detail_short}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <PersonSimpleTaiChiIcon className="w-3 h-3 text-foreground/50" weight="fill" />
                      <p className="font-medium text-xs text-foreground/50">{session.total_instruction} Instruksi</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <TimerIcon className="w-3 h-3 text-foreground/50" weight="fill" />
                      <p className="font-medium text-xs text-foreground/50">{session.duration}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
        }
      </div>
    </div>
  )
}