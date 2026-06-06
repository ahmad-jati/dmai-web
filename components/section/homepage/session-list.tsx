'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllSessions, type SessionData } from "@/lib/data-detail-session";
import { PersonSimpleTaiChiIcon, TimerIcon } from "@phosphor-icons/react";
import { Route } from "next";

function SessionCardSkeleton() {
  return (
    <div className="flex flex-col gap-0 bg-background rounded-lg border border-foreground/20 w-full overflow-hidden animate-pulse">
      {/* image placeholder */}
      <div className="w-full h-36 bg-foreground/8" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-3.5 bg-foreground/10 rounded w-3/4" />
        <div className="h-3 bg-foreground/8 rounded w-full" />
        <div className="h-2.5 bg-foreground/6 rounded w-1/2 mt-0.5" />
      </div>
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
    <div id="session-list" className="flex flex-col gap-6 items-start">
      <div className="flex flex-col gap-2 max-w-180">
        <h2>All Session</h2>
        <p className="font-medium text-foreground/70">Mulai perlahan, pilih satu sesi yang terasa paling dekat denganmu.</p>
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
                className="group flex flex-col bg-background rounded-[20px] border border-foreground w-full overflow-hidden hover:shadow-md transition-shadow p-2"
              >
                <div className="w-full h-36 rounded-[14px] overflow-hidden">
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
                <div className="flex flex-col gap-1.5 px-1 py-3">
                  <p className="font-bold text-md group-hover:underline underline-offset-2 leading-snug">{session.session_name}</p>
                  <p className="font-medium text-sm text-foreground/70 line-clamp-2 wrap-break-word min-w-0 overflow-hidden leading-relaxed">{session.detail_short}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1">
                      <PersonSimpleTaiChiIcon className="w-3 h-3 text-foreground/50" weight="fill" />
                      <p className="font-medium text-xs text-foreground/50">{session.total_instruction} Instruksi</p>
                    </span>
                    <span className="flex items-center gap-1">
                      <TimerIcon className="w-3 h-3 text-foreground/50" weight="fill" />
                      <p className="font-medium text-xs text-foreground/50">{session.duration}</p>
                    </span>
                  </div>
                </div>
              </Link>
            ))
        }
      </div>
    </div>
  )
}