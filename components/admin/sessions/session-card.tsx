'use client'

import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { SessionRecord } from './types'

interface SessionCardProps {
  session: SessionRecord
  onClick: () => void
}

export function SessionCard({ session, onClick }: SessionCardProps) {

  return (
    <div className="relative flex flex-col gap-2.5 p-3.5 bg-background border border-border hover:border-muted-foreground/40 hover:shadow-sm transition-all text-left rounded-sm group w-full hover:cursor-pointer">
      <button onClick={onClick} className="flex flex-col gap-2.5 text-left w-full pr-8 group-hover:cursor-pointer">
        <div className="flex items-start gap-3 w-full">
          <div className="w-14 h-14 rounded-sm overflow-hidden border border-border bg-muted shrink-0">
            {session.image_cover_url ? (
              <Image
                src={session.image_cover_url}
                alt={session.session_name}
                width={56}
                height={56}
                className="w-full h-full object-cover bg-muted-foreground/10"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xs text-muted-foreground">
                —
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <p className="font-semibold text-base leading-snug line-clamp-2 group-hover:underline underline-offset-2">
              {session.session_name}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="w-fit text-xs">
                {session.steps.length} steps
              </Badge>
              {session.week_number && (
                <Badge variant="outline" className="w-fit text-xs">
                  Week {session.week_number}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm/4.5 text-muted-foreground line-clamp-2">{session.detail_short}</p>
      </button>
    </div>
  )
}
