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

export function SessionGrid({
  excludeSlug,
  className,
  gridClassName = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
}: SessionGridProps) {
  const [sessions, setSessions] = useState<SessionData[]>([])

  useEffect(() => {
    fetchAllSessions().then(setSessions)
  }, [])

  const filtered = excludeSlug
    ? sessions.filter((s) => s.slug !== excludeSlug)
    : sessions

  return (
    <div className={cn(`grid gap-4 ${gridClassName}`, className)}>
      {filtered.map((session) => (
        <Link
          key={session.slug}
          href={`/session/${session.slug}` as Route}
          className="flex flex-col justify-between items-end gap-4 bg-background p-3 rounded-lg border border-foreground w-full h-40"
        >
          <div className="flex flex-col gap-1">
            <p className="font-bold text-md">{session.session_name}</p>
            <p className="font-medium text-sm">{session.detail_short}</p>
            <p className="font-medium text-xs text-muted-foreground">{session.total_instruction} Pelatihan ● {session.duration}</p>
          </div>
          <div>
            <Button className="p-2 bg-white" asChild>
              <span>
                <PlayIcon className="w-5 h-5" weight="fill"/>
              </span>
            </Button>
          </div>
        </Link>
      ))}
    </div>
  );
}