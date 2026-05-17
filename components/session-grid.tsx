'use client'

import Link from "next/link";
import { cn } from "@/lib/utils";
import { data_session } from "@/lib/data-detail-session";
import { Button } from "./ui/button";
import { PlayIcon } from "@phosphor-icons/react";

type SessionGridProps = {
  excludeSlug?: string;         
  className?: string;            
  gridClassName?: string;        
};

export function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function SessionGrid({
  excludeSlug,
  className,
  gridClassName = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
}: SessionGridProps) {
  const sessions = excludeSlug
    ? data_session.filter((s) => toSlug(s.session_name) !== excludeSlug)
    : data_session;

  return (
    <div className={cn(`grid gap-4 ${gridClassName}`, className)}>
      {sessions.map((session) => {
        const slug = toSlug(session.session_name);
        return (
          <Link
              key={session.session_name}
              href={`/session/${slug}`}
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
        );
      })}
    </div>
  );
}