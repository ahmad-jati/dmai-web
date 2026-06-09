'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllSessions, type SessionData } from "@/lib/data-detail-session";
import { ArrowRightIcon, PersonSimpleTaiChiIcon, TimerIcon } from "@phosphor-icons/react";
import { Route } from "next";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-col w-full sm:items-start items-center gap-2 sm:max-w-180">
        <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold sm:text-left text-center">All Session</h2>
        <p className="sm:text-p/5 text-sm/4 sm:max-w-140 font-medium sm:text-left text-center">Mulai perlahan, pilih satu sesi yang terasa paling dekat denganmu.</p>
      </div>

      <div className="grid 2md:grid-cols-4 2xs:grid-cols-2 grid-cols-1 gap-3.5 w-full 2xs:px-0 xs:px-8 px-2">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))
          : filtered.map((session) => (
              <Link
                key={session.slug}
                href={`/session/${session.slug}` as Route}
                className="group flex flex-col bg-background sm:rounded-[20px] rounded-lg border border-foreground w-full overflow-hidden hover:shadow-md transition-shadow p-3
                  sm:items-start items-center
                "
              >
                <div className="w-full md:h-40 xs:h-46 h-36 xs:rounded-[14px] rounded-[10px] overflow-hidden">
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

                <div className="flex flex-col sm:items-start items-center sm:gap-1.5 gap-2 sm:px-1 px-3 py-3 sm:min-h-33">
                  <p className="text-p/5 max-w-140 font-semibold group-hover:underline underline-offset-2 sm:text-left text-center">
                    {session.session_name}
                  </p>

                  <p className="xs:text-p/5 text-sm/4 sm:max-w-140 font-medium line-clamp-3 sm:min-h-[3lh] text-foreground/70 sm:text-left text-center">
                    {session.detail_short}
                  </p>

                  <div className="mt-auto xs:flex hidden items-center gap-3">
                    <span className="flex items-center gap-1">
                      <PersonSimpleTaiChiIcon className="h-3 w-3 text-foreground/50" weight="fill" />
                      <p className="text-xs font-medium text-foreground/50">
                        {session.total_instruction} Instruksi
                      </p>
                    </span>

                    <span className="flex items-center gap-1">
                      <TimerIcon className="h-3 w-3 text-foreground/50" weight="fill" />
                      <p className="text-xs font-medium text-foreground/50">
                        {session.duration}
                      </p>
                    </span>
                  </div>
                </div>

                <Button 
                  variant={'default'}
                  className="[&_svg]:size-4 rounded-full p-2 xs:hidden block"
                >
                  <Link href={`/session/${session.slug}` as Route} className="">
                    <ArrowRightIcon />
                  </Link>
                </Button>
              </Link>
            ))
        }
      </div>
    </div>
  )
}