'use client'

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { data_session } from "@/lib/data-detail-session";

type SessionGridProps = {
  excludeSlug?: string;         // e.g. "motivasi" – hides that card
  className?: string;           // extra wrapper classes
  gridClassName?: string;       // override grid cols, e.g. "grid-cols-2 lg:grid-cols-4"
};

/** Convert a session_name to a URL slug, e.g. "Self Reported" → "self-reported" */
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
            key={slug}
            href={`/session/${slug}`}
            className="group flex flex-col gap-3 rounded-3xl border border-foreground bg-background p-4 transition-shadow hover:shadow-md active:scale-[0.98]"
          >
            <div className="w-10 h-10 flex-shrink-0">
              <Image
                src={session.icon}
                alt={session.session_name}
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-semibold text-sm leading-tight group-hover:underline underline-offset-2">
                {session.session_name}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                {session.detail_short}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}