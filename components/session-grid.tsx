'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchAllSessions, type SessionData } from "@/lib/data-detail-session";
import { Button } from "./ui/button";
import { PlayIcon } from "@phosphor-icons/react";
import { Route } from "next";

type SessionGridProps = {
  excludeSlug?: string;
  className?: string;
  gridClassName?: string;
};

function SessionCardSkeleton() {
  return (
    <div className="flex flex-col justify-between items-end gap-4 bg-background p-3 rounded-lg border border-foreground/30 w-full xs:h-40 h-32 animate-pulse">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="xs:h-3.5 h-3 bg-muted rounded w-3/4" />
        <div className="xs:h-3 h-2.5 bg-muted rounded w-full" />
        <div className="xs:h-2.5 h-2 bg-muted/60 rounded w-1/2 mt-0.5" />
      </div>
      <div className="xs:w-8 xs:h-8 w-6 h-6 bg-muted rounded-md shrink-0" />
    </div>
  )
}

export function SessionGrid({
  excludeSlug,
  className,
  gridClassName = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
}: SessionGridProps) {
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
    <div className={cn(`grid gap-4 ${gridClassName}`, className)}>
      {loading
        ? Array.from({ length: 8 }).map((_, i) => <SessionCardSkeleton key={i} />)
        : filtered.map((session) => (
            <Link
              key={session.slug}
              href={`/session/${session.slug}` as Route}
              className="flex flex-col justify-between items-end gap-4 bg-background p-3 rounded-lg border border-foreground w-full h-40"
            >
              <div className="flex flex-col gap-1">
                <p className="font-bold text-md">{session.session_name}</p>
                <p className="font-medium text-sm">{session.detail_short}</p>
                <p className="font-medium text-xs text-muted-foreground">
                  {session.total_instruction} Pelatihan ● {session.duration}
                </p>
              </div>
              <div>
                <Button className="p-2 bg-white" asChild>
                  <span>
                    <PlayIcon className="w-5 h-5" weight="fill" />
                  </span>
                </Button>
              </div>
            </Link>
          ))
      }
    </div>
  );
}
