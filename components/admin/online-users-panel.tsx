'use client'

import { useState, useCallback } from 'react'
import { usePresenceSubscriber } from '@/lib/hooks/usePresence'
import type { PresencePayload } from '@/lib/hooks/usePresence'
import { cn } from '@/lib/utils'

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}d lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`
  return `${Math.floor(diff / 3600)}j lalu`
}

function StatusDot({ status }: { status: PresencePayload['status'] }) {
  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full shrink-0',
      status === 'in_session' ? 'bg-green-500 animate-pulse' : 'bg-yellow-400'
    )} />
  )
}

export function OnlineUsersPanel() {
  const [users, setUsers] = useState<PresencePayload[]>([])

  const handleSync = useCallback((incoming: PresencePayload[]) => {
    setUsers(incoming)
  }, [])

  usePresenceSubscriber(handleSync)

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">User Online</h2>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {users.length} online
        </span>
      </div>

      {/* List */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground/50">
          <span className="text-2xl">🌙</span>
          <p className="text-xs font-medium">Tidak ada user online</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <div
              key={user.user_id}
              className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors"
            >
              {/* Avatar placeholder */}
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground uppercase">
                {user.email.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <StatusDot status={user.status} />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {user.email}
                  </span>
                </div>

                {user.status === 'in_session' && user.session_name ? (
                  <p className="text-xs text-muted-foreground truncate">
                    Sedang di sesi{' '}
                    <span className="font-medium text-foreground">{user.session_name}</span>
                    {user.step_index !== undefined && (
                      <span className="text-muted-foreground/60"> · Tahap {user.step_index + 1}</span>
                    )}
                    {user.step_type && (
                      <span className="text-muted-foreground/60"> ({user.step_type})</span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Browsing</p>
                )}
              </div>

              {/* Time */}
              <span className="text-xs text-muted-foreground/50 shrink-0 tabular-nums">
                {timeAgo(user.joined_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}