'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { LockSimpleIcon, LockSimpleOpenIcon } from '@phosphor-icons/react'
import { SessionRecord } from './types'

interface SessionCardProps {
  session: SessionRecord
  onClick: () => void
  onLockToggled: (id: string, is_locked: boolean) => void
}

export function SessionCard({ session, onClick, onLockToggled }: SessionCardProps) {
  const [toggling, setToggling] = useState(false)

  const handleLockToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setToggling(true)
    const supabase = createClient()
    const newLocked = !session.is_locked

    const { error } = await supabase
      .from('sessions')
      .update({ is_locked: newLocked })
      .eq('id', session.id)

    if (error) {
      toast.error('Gagal mengubah status', { description: error.message })
    } else {
      onLockToggled(session.id, newLocked)
      toast.success(newLocked ? 'Sesi dikunci' : 'Sesi dibuka')
    }
    setToggling(false)
  }

  return (
    <div className="relative flex flex-col gap-2.5 p-3.5 bg-white border border-border hover:border-muted-foreground/40 hover:shadow-sm transition-all text-left rounded-sm group w-full">
      {/* Lock toggle — top-right corner, does NOT trigger card click */}
      <button
        onClick={handleLockToggle}
        disabled={toggling}
        title={session.is_locked ? 'Klik untuk buka kunci' : 'Klik untuk kunci'}
        className={[
          'absolute top-2.5 right-2.5 z-10 flex items-center justify-center w-7 h-7 rounded-sm border transition-colors',
          session.is_locked
            ? 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20'
            : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100',
          toggling ? 'opacity-50 pointer-events-none' : '',
        ].join(' ')}
      >
        {session.is_locked ? (
          <LockSimpleIcon weight="fill" className="w-3.5 h-3.5" />
        ) : (
          <LockSimpleOpenIcon weight="fill" className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Main clickable area */}
      <button onClick={onClick} className="flex flex-col gap-2.5 text-left w-full pr-8">
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
