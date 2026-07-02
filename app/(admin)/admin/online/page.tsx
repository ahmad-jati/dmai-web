'use client'

import { useState, useCallback, useMemo } from 'react'
import { usePresenceSubscriber } from '@/lib/hooks/usePresence'
import type { PresencePayload } from '@/lib/hooks/usePresence'
import { cn } from '@/lib/utils'
import { WifiHighIcon, WifiSlashIcon, FlaskIcon, ArrowClockwiseIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react'
// DEV ONLY — remove this import + the toggle below once you're done testing
import { DUMMY_PRESENCE_USERS } from '@/lib/dummy-presence-data'

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
    <div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-border bg-white hover:bg-muted/20 transition-colors min-w-0">
      <StatusDot status={user.status} />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-foreground truncate">{name}</span>
        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
      </div>
    </div>
  )
}

// Shared layout for both "in a session" groups and the "Online" group —
// same card shell, same grid, same chip rendering.
function UserGroupCard({
  title,
  users,
  dotClassName,
}: {
  title: string
  users: PresencePayload[]
  dotClassName: string
}) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border bg-background border-border">
      <div className="flex items-center gap-2">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClassName)} />
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
          {users.length} user
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  // DEV ONLY — toggle to preview the UI with 400 dummy users. Remove this
  // state + the button below once you're done testing.
  const [showDummy, setShowDummy] = useState(false)

  const handleSync = useCallback((incoming: PresencePayload[]) => {
    setUsers(incoming)
    setLastUpdated(new Date())
  }, [])

  const { refresh } = usePresenceSubscriber(handleSync)

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    refresh()
    setTimeout(() => setIsRefreshing(false), 400)
  }

  const displayedUsers = showDummy ? [...users, ...DUMMY_PRESENCE_USERS] : users

  const { inSession, active } = groupBySession(displayedUsers)
  const total = displayedUsers.length
  const inSessionCount = displayedUsers.filter((u) => u.status === 'in_session').length
  const activeCount = displayedUsers.filter((u) => u.status === 'active').length

  // Apply status filter first
  const statusFilteredInSession = filter === 'active' ? [] : inSession
  const statusFilteredActive = filter === 'in_session' ? [] : active

  // Apply session pill filter (only relevant when looking at in_session groups)
  const sessionFilteredInSession = selectedSessionId
    ? statusFilteredInSession.filter((g) => g.session_id === selectedSessionId)
    : statusFilteredInSession

  // Apply search — matches name or email, applies across both groups
  const query = search.trim().toLowerCase()
  const matchesQuery = (u: PresencePayload) => {
    if (!query) return true
    const name = u.email.split('@')[0].toLowerCase()
    return name.includes(query) || u.email.toLowerCase().includes(query)
  }

  const filteredInSession = sessionFilteredInSession
    .map((g) => ({ ...g, users: g.users.filter(matchesQuery) }))
    .filter((g) => g.users.length > 0)

  const filteredActive = (selectedSessionId && filter !== 'active')
  ? []
  : statusFilteredActive.filter(matchesQuery)

  const isEmpty = filteredInSession.length === 0 && filteredActive.length === 0

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
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-muted-foreground pt-0.5 text-right whitespace-nowrap">
              <span>Terakhir update: </span>
              {formatLocalTime(lastUpdated)}
            </p>
            <button
              onClick={handleManualRefresh}
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shrink-0"
            >
              <ArrowClockwiseIcon
                weight="bold"
                className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')}
              />
            </button>
          </div>
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

      {/* Filter tabs + search + refresh */}
      <div className="flex w-full justify-between items-center gap-3 flex-wrap">
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

        <div className="flex items-center gap-3 ml-auto">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon weight="bold" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="pl-8 pr-7 py-1.5 text-xs rounded-sm border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 w-56"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon weight="bold" className="w-3 h-3" />
              </button>
            )}
          </div>

          
        </div>
      </div>

      {/* Session pills — flex-wrap row, name + active count, click to filter to that session only */}
      {inSession.length > 0 && filter === 'in_session' && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedSessionId(null)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              selectedSessionId === null
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
            )}
          >
            Semua sesi
            <span className={cn('tabular-nums', selectedSessionId === null ? 'text-background/70' : 'text-muted-foreground/60')}>
              {inSession.reduce((sum, g) => sum + g.users.length, 0)}
            </span>
          </button>
          {inSession.map((group) => (
            <button
              key={group.session_id}
              onClick={() => setSelectedSessionId(selectedSessionId === group.session_id ? null : group.session_id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all truncate max-w-60',
                selectedSessionId === group.session_id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
              )}
            >
              <span className="truncate">{group.session_name}</span>
              <span className={cn('tabular-nums shrink-0', selectedSessionId === group.session_id ? 'text-background/70' : 'text-muted-foreground/60')}>
                {group.users.length}
              </span>
            </button>
          ))}
        </div>
      )}

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
            <UserGroupCard
              key={group.session_id}
              title={`Sesi: ${group.session_name}`}
              users={group.users}
              dotClassName="bg-green-500 animate-pulse"
            />
          ))}
          {filteredActive.length > 0 && (
            <UserGroupCard
              title="Online"
              users={filteredActive}
              dotClassName="bg-yellow-400"
            />
          )}
        </div>
      )}

      {/* <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={() => setShowDummy((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
            showDummy
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              : 'text-muted-foreground/50 border-border hover:text-muted-foreground'
          )}
        >
          <FlaskIcon weight="bold" className="w-3.5 h-3.5" />
          {showDummy ? '400 dummy aktif' : 'Tampilkan dummy'}
        </button>
      </div> */}
    </div>
  )
}