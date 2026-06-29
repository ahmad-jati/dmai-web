'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePresenceSubscriber } from '@/lib/hooks/usePresence'
import type { PresencePayload } from '@/lib/hooks/usePresence'
import { cn } from '@/lib/utils'
import {
  WifiHighIcon,
  WifiSlashIcon,
  UserIcon,
  ArrowSquareOutIcon,
} from '@phosphor-icons/react'

// ─── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}d lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`
  return `${Math.floor(diff / 3600)}j lalu`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const STEP_TYPE_LABEL: Record<string, string> = {
  narration: 'Panduan Suara',
  pre_form: 'Form Awal',
  post_form: 'Form Akhir',
  video: 'Video',
  body_map: 'Body Map',
  external_embed: 'Aktivitas Eksternal',
  game: 'Mini Game',
}

// ─── Sub-components ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PresencePayload['status'] }) {
  if (status === 'in_session') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Dalam Sesi
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      Browsing
    </span>
  )
}

function Avatar({ email }: { email: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
      <span className="text-sm font-bold text-muted-foreground uppercase">
        {email.charAt(0)}
      </span>
    </div>
  )
}

function UserCard({ user, now }: { user: PresencePayload; now: number }) {
  const diff = Math.floor((now - new Date(user.joined_at).getTime()) / 1000)
  const duration = diff < 60
    ? `${diff}d`
    : diff < 3600
      ? `${Math.floor(diff / 60)}m ${diff % 60}d`
      : `${Math.floor(diff / 3600)}j ${Math.floor((diff % 3600) / 60)}m`

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-background hover:bg-muted/30 transition-colors">
      <Avatar email={user.email} />

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Top row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate">{user.email}</span>
          <StatusBadge status={user.status} />
        </div>

        {/* Session info */}
        {user.status === 'in_session' && user.session_name ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sesi:</span>
              <span className="text-xs font-semibold text-foreground">{user.session_name}</span>
              {user.session_slug && (
                <a
                  href={`/session/${user.session_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <ArrowSquareOutIcon className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {user.step_index !== undefined && (
                <span className="text-xs text-muted-foreground">
                  Tahap <span className="font-semibold text-foreground">{user.step_index + 1}</span>
                </span>
              )}
              {user.step_type && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                  {STEP_TYPE_LABEL[user.step_type] ?? user.step_type}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Menjelajahi aplikasi</span>
        )}
      </div>

      {/* Right side — time info */}
      <div className="flex flex-col items-end gap-1 shrink-0 text-right">
        <span className="text-xs font-medium text-foreground tabular-nums">{formatTime(user.joined_at)}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{duration}</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground/40">
      <WifiSlashIcon className="w-12 h-12" />
      <p className="text-sm font-semibold">Tidak ada user online saat ini</p>
      <p className="text-xs">Halaman akan update otomatis saat ada yang online</p>
    </div>
  )
}

// ─── Stats bar ───────────────────────────────────────────────────────────────────

function StatsBar({ users }: { users: PresencePayload[] }) {
  const inSession = users.filter((u) => u.status === 'in_session').length
  const browsing = users.filter((u) => u.status === 'browsing').length

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="flex flex-col gap-1 p-4 rounded-2xl border border-border bg-background">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Online</span>
        <span className="text-3xl font-bold text-foreground tabular-nums">{users.length}</span>
      </div>
      <div className="flex flex-col gap-1 p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
        <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Dalam Sesi</span>
        <span className="text-3xl font-bold text-foreground tabular-nums">{inSession}</span>
      </div>
      <div className="flex flex-col gap-1 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
        <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Browsing</span>
        <span className="text-3xl font-bold text-foreground tabular-nums">{browsing}</span>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function OnlineActivityPage() {
  const [users, setUsers] = useState<PresencePayload[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [now, setNow] = useState(Date.now())
  const [filter, setFilter] = useState<'all' | 'in_session' | 'browsing'>('all')

  // Tick every second so durations stay live
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleSync = useCallback((incoming: PresencePayload[]) => {
    // Sort: in_session first, then by joined_at desc
    const sorted = [...incoming].sort((a, b) => {
      if (a.status === b.status) return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
      return a.status === 'in_session' ? -1 : 1
    })
    setUsers(sorted)
    setLastUpdated(new Date())
  }, [])

  usePresenceSubscriber(handleSync)

  const filtered = filter === 'all' ? users : users.filter((u) => u.status === filter)

  return (
    <div className="flex flex-col gap-6 p-10 w-full">

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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 shrink-0 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Update {formatTime(lastUpdated.toISOString())}
          </div>
        )}
      </div>

      {/* Stats */}
      <StatsBar users={users} />

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1 w-fit">
        {(['all', 'in_session', 'browsing'] as const).map((f) => (
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
            {f === 'all' ? 'Semua' : f === 'in_session' ? 'Dalam Sesi' : 'Browsing'}
            <span className={cn(
              'ml-1.5 tabular-nums',
              filter === f ? 'text-foreground' : 'text-muted-foreground/60'
            )}>
              {f === 'all' ? users.length : users.filter((u) => u.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* User list */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((user) => (
            <UserCard key={user.user_id} user={user} now={now} />
          ))}
        </div>
      )}
    </div>
  )
}