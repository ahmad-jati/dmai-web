'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePresenceSubscriber } from '@/lib/hooks/usePresence'
import type { PresencePayload } from '@/lib/hooks/usePresence'
import { cn } from '@/lib/utils'
import { WifiHighIcon, WifiSlashIcon } from '@phosphor-icons/react'

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function formatLocalTime(date: Date): string {
  // Detect timezone offset to show WIB/WITA/WIT
  const offset = -date.getTimezoneOffset() / 60
  const tz = offset === 7 ? 'WIB' : offset === 8 ? 'WITA' : offset === 9 ? 'WIT' : `UTC+${offset}`

  const dateStr = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${dateStr}, ${timeStr} ${tz}`
}

// ─── Types ────────────────────────────────────────────────────────────────────────

type SessionGroup = {
  session_id: string
  session_name: string
  session_slug?: string
  users: PresencePayload[]
}

function groupBySession(users: PresencePayload[]): {
  inSession: SessionGroup[]
  active: PresencePayload[]
} {
  const sessionMap = new Map<string, SessionGroup>()
  const active: PresencePayload[] = []

  for (const user of users) {
    if (user.status === 'in_session' && user.session_id && user.session_name) {
      const existing = sessionMap.get(user.session_id)
      if (existing) {
        existing.users.push(user)
      } else {
        sessionMap.set(user.session_id, {
          session_id: user.session_id,
          session_name: user.session_name,
          session_slug: user.session_slug,
          users: [user],
        })
      }
    } else {
      active.push(user)
    }
  }

  return {
    inSession: Array.from(sessionMap.values()),
    active,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: PresencePayload['status'] }) {
  return (
    <span className={cn(
      'inline-block w-1.5 h-1.5 rounded-full shrink-0',
      status === 'in_session' ? 'bg-green-500 animate-pulse' : 'bg-yellow-400'
    )} />
  )
}

function UserChip({ user }: { user: PresencePayload }) {
  const name = user.email.split('@')[0]
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors min-w-0">
      <StatusDot status={user.status} />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-foreground truncate">{name}</span>
        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
      </div>
    </div>
  )
}

function SessionGroupCard({ group }: { group: SessionGroup }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border bg-muted/20">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
        <p className="text-sm font-semibold text-foreground truncate">{group.session_name}</p>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
          {group.users.length} user
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {group.users.map((user) => (
          <UserChip key={user.user_id} user={user} />
        ))}
      </div>
    </div>
  )
}

function ActiveUsersCard({ users }: { users: PresencePayload[] }) {
  if (users.length === 0) return null
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border bg-muted/20">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
        <p className="text-sm font-semibold text-foreground">Online</p>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
          {users.length} user
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {users.map((user) => (
          <UserChip key={user.user_id} user={user} />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────────

export default function OnlineActivityPage() {
  const [users, setUsers] = useState<PresencePayload[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [filter, setFilter] = useState<'all' | 'in_session' | 'active'>('all')

  const handleSync = useCallback((incoming: PresencePayload[]) => {
    setUsers(incoming)
    setLastUpdated(new Date())
  }, [])

  usePresenceSubscriber(handleSync)

  const { inSession, active } = groupBySession(users)
  const total = users.length
  const inSessionCount = users.filter((u) => u.status === 'in_session').length
  const activeCount = users.filter((u) => u.status === 'active').length

  // Apply filter
  const filteredInSession = filter === 'active' ? [] : inSession
  const filteredActive = filter === 'in_session' ? [] : active
  const isEmpty = filteredInSession.length === 0 && filteredActive.length === 0

  return (
    <div className="flex flex-col gap-6 p-10 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <WifiHighIcon className="w-5 h-5 text-foreground" />
            <h1 className="text-xl font-bold text-foreground">Aktivitas Online</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Realtime activity semua user yang sedang online
          </p>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground/60 shrink-0 pt-1 text-right">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5 align-middle" />
            {formatLocalTime(lastUpdated)}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 p-4 rounded-2xl border border-border bg-background">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Online</span>
          <span className="text-3xl font-bold text-foreground tabular-nums">{total}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
          <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Dalam Sesi</span>
          <span className="text-3xl font-bold text-foreground tabular-nums">{inSessionCount}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Online</span>
          <span className="text-3xl font-bold text-foreground tabular-nums">{activeCount}</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1 w-fit">
        {(['all', 'in_session', 'active'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              filter === f
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f === 'all' ? 'Semua' : f === 'in_session' ? 'Dalam Sesi' : 'Online'}
            <span className={cn('ml-1.5 tabular-nums', filter === f ? 'text-foreground' : 'text-muted-foreground/60')}>
              {f === 'all' ? total : f === 'in_session' ? inSessionCount : activeCount}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground/40">
          <WifiSlashIcon className="w-12 h-12" />
          <p className="text-sm font-semibold">Tidak ada user online saat ini</p>
          <p className="text-xs">Halaman update otomatis saat ada yang online</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredInSession.map((group) => (
            <SessionGroupCard key={group.session_id} group={group} />
          ))}
          <ActiveUsersCard users={filteredActive} />
        </div>
      )}
    </div>
  )
}