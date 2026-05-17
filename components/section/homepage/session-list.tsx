'use client'

import Image from "next/image";
import Link from "next/link";
import { data_session } from "@/lib/data-detail-session";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@phosphor-icons/react";
import { Route } from "next";

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function SessionList({ excludeSlug }: { excludeSlug?: string }) {
  const sessions = excludeSlug
    ? data_session.filter((s) => toSlug(s.session_name) !== excludeSlug)
    : data_session;

  return (
    <div id="session-list" className="flex flex-col gap-4 items-start">
      <h2>All Session</h2>

      <div className="grid grid-cols-4 gap-3.5">
        {sessions.map((session) => {
          const slug = toSlug(session.session_name);
          return (
            <Link
              key={session.session_name}
              href={`/session/${slug}` as Route}
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

        <div className="relative flex flex-row-reverse items-center justify-end bg-background rounded-lg border border-foreground overflow-hidden h-40">
          <p className="font-bold text-lg z-1 relative -ml-2">
            You&apos;re <span className="block">not</span> alone.
          </p>

          <div className="relative -mb-3 -ml-4">
            <Image
              src="/tropicaline/Diversity.png"
              alt="Diversity icon"
              width={400}
              height={400}
              className="w-49 h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}