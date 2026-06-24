'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  SpinnerIcon,
  ArrowDownIcon,
  ChartLineUpIcon,
  TimerIcon,
} from "@phosphor-icons/react"
import Image from "next/image"
import { SessionDetailModal } from "./session-detail-modal"

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompletionRecord = {
  id: string
  session_name: string
  session_slug: string
  started_at: string | null
  completed_at: string
  duration_seconds: number | null
}

type GroupedDay = {
  label: string
  date: string
  items: CompletionRecord[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(iso: string) {
  return iso.slice(0, 10)
}

function dayLabel(dateKey: string, todayKey: string, yesterdayKey: string): string {
  if (dateKey === todayKey) return "Hari ini"
  if (dateKey === yesterdayKey) return "Kemarin"
  const d = new Date(dateKey + "T00:00:00")
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}d`
  if (s === 0) return `${m}m`
  return `${m}m ${s}d`
}

function groupByDay(items: CompletionRecord[]): GroupedDay[] {
  const todayKey = toDateKey(new Date().toISOString())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = toDateKey(yesterday.toISOString())

  const map = new Map<string, CompletionRecord[]>()
  for (const item of items) {
    const key = toDateKey(item.completed_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, dayItems]) => ({
      label: dayLabel(date, todayKey, yesterdayKey),
      date,
      items: dayItems.sort(
        (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      ),
    }))
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex lg:gap-6 gap-3 items-start w-full lg:items-center animate-pulse">
      <div className="rounded-3xl lg:w-120 lg:h-120 w-24 h-24 bg-foreground/8 lg:block hidden" />
      <div className="flex flex-col lg:gap-6 gap-4 w-full lg:h-120 h-full overflow-hidden">
        {/* Stats row skeleton */}
        <div className="flex gap-3">
          <div className="h-16 bg-foreground/8 rounded-xl flex-1" />
          <div className="h-16 bg-foreground/8 rounded-xl flex-1" />
        </div>
        <div className="h-5 bg-foreground/10 rounded w-40" />
        {Array.from({ length: 3 }).map((_, gi) => (
          <div key={gi} className="flex flex-col gap-3">
            <div className="h-3.5 bg-foreground/10 rounded w-24" />
            <div className="grid 2xs:grid-cols-2 grid-cols-1 xs:gap-3 gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-18 bg-background rounded-xl border border-foreground/10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 bg-background dark:bg-secondary rounded-xl border border-foreground/15 px-4 py-3 flex-1 min-w-0">
      <div className="text-foreground/50 shrink-0">{icon}</div>
      <div className="flex flex-col min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
        <p className="font-semibold xs:text-p/5 text-sm/4 text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

// ─── Completion Card ──────────────────────────────────────────────────────────

function CompletionCard({
  item,
  onSelect,
}: {
  item: CompletionRecord
  onSelect: (item: CompletionRecord) => void
}) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="flex flex-col gap-2 bg-background rounded-xl border border-foreground/15 px-4 py-3 hover:border-foreground/40 hover:shadow-sm transition-all text-left w-full cursor-pointer group"
    >
      {/* Session name */}
      <p className="font-semibold xs:text-p/5 text-xs/3.5 truncate group-hover:text-foreground/80 transition-colors">
        {item.session_name}
      </p>

      {/* Time row */}
      <div className="flex items-center gap-3 flex-wrap">
        {item.started_at && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <ClockIcon className="w-3 h-3 shrink-0" />
            <span className="text-2xs font-medium">Mulai: {formatTime(item.started_at)}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-muted-foreground">
          <CheckCircleIcon className="w-3 h-3 shrink-0 text-green-500" />
          <span className="text-2xs font-medium">{formatTime(item.completed_at)}</span>
        </div>
        {item.duration_seconds != null && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <TimerIcon className="w-3 h-3 shrink-0" />
            <span className="text-2xs font-medium">{formatDuration(item.duration_seconds)}</span>
          </div>
        )}
      </div>

      <p className="text-2xs text-muted-foreground/60 font-medium group-hover:text-muted-foreground/80 transition-colors">
        Klik untuk lihat detail →
      </p>
    </button>
  )
}

// ─── Day Group ────────────────────────────────────────────────────────────────

function DayGroup({
  group,
  onSelect,
}: {
  group: GroupedDay
  onSelect: (item: CompletionRecord) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="xs:text-p/5 text-sm/4 font-semibold text-foreground">{group.label}</p>
        <span className="xs:text-p/5 text-xs/3.5 text-muted-foreground">
          ({group.items.length} sesi)
        </span>
      </div>
      <div className="grid 2xs:grid-cols-2 grid-cols-1 gap-2 pl-1">
        {group.items.map((item) => (
          <CompletionCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RECENT_DAYS = 10
const OLDER_DAYS = 10

export function UserDashboard() {
  const [recentGroups, setRecentGroups] = useState<GroupedDay[]>([])
  const [olderGroups, setOlderGroups] = useState<GroupedDay[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [showOlder, setShowOlder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [olderFetched, setOlderFetched] = useState(false)
  const [hasOlderData, setHasOlderData] = useState(false)
  const [selectedCompletion, setSelectedCompletion] = useState<CompletionRecord | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) { setLoading(false); return }
      console.log(userData)

      // Fetch recent completions
      const since = new Date()
      since.setDate(since.getDate() - RECENT_DAYS)

      const { data } = await supabase
        .from("session_completions")
        .select("id, session_name, session_slug, started_at, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", since.toISOString())
        .order("completed_at", { ascending: false })

        console.log(data)

      const grouped = groupByDay((data ?? []) as CompletionRecord[])
      setRecentGroups(grouped)

      // Total count all-time
      const { count: allCount } = await supabase
        .from("session_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
      setTotalCount(allCount ?? 0)

      // Check older data
      const olderCutoff = new Date()
      olderCutoff.setDate(olderCutoff.getDate() - RECENT_DAYS)
      const { count } = await supabase
        .from("session_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lt("completed_at", olderCutoff.toISOString())

      setHasOlderData((count ?? 0) > 0)
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleLoadOlder = async () => {
    if (olderFetched) { setShowOlder(true); return }

    setLoadingOlder(true)
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) { setLoadingOlder(false); return }

    const olderEnd = new Date()
    olderEnd.setDate(olderEnd.getDate() - RECENT_DAYS)
    const olderStart = new Date()
    olderStart.setDate(olderStart.getDate() - RECENT_DAYS - OLDER_DAYS)

    const { data } = await supabase
      .from("session_completions")
      .select("id, session_name, session_slug, started_at, completed_at")
      .eq("user_id", user.id)
      .lt("completed_at", olderEnd.toISOString())
      .gte("completed_at", olderStart.toISOString())
      .order("completed_at", { ascending: false })

    const grouped = groupByDay((data ?? []) as CompletionRecord[])
    console.log(data)
    setOlderGroups(grouped)
    setOlderFetched(true)
    setShowOlder(true)
    setLoadingOlder(false)
  }

  if (loading) return <DashboardSkeleton />

  const recentCount = recentGroups.reduce((s, g) => s + g.items.length, 0)
  const isEmpty = recentGroups.length === 0 && totalCount === 0

  return (
    <>
      <div className="flex items-start gap-1 w-full">
        <div className="flex flex-col gap-4 items-start w-full lg:h-120 h-full">
          <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold">Dashboard</h2>

          {/* Stats row */}
          <div className="flex gap-3 w-full">
            <StatCard
              icon={<ChartLineUpIcon className="w-5 h-5" />}
              label="Total Sesi Selesai"
              value={`${totalCount} sesi`}
            />
            <StatCard
              icon={<CalendarIcon className="w-5 h-5" />}
              label={`${RECENT_DAYS} Hari Terakhir`}
              value={`${recentCount} sesi`}
            />
          </div>

          <div className="pr-2 lg:pb-8 overflow-y-auto w-full flex-1">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <CalendarIcon className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  Belum ada sesi yang diselesaikan
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Selesaikan sesi pertamamu untuk melihat progres di sini.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Recent */}
                <div className="flex flex-col gap-5">
                  {recentGroups.map((group) => (
                    <DayGroup key={group.date} group={group} onSelect={setSelectedCompletion} />
                  ))}
                </div>

                {/* Older */}
                {showOlder && olderGroups.length > 0 && (
                  <div className="flex flex-col gap-5 mt-2 border-t border-foreground/10">
                    <p className="xs:text-p/5 text-sm/4 text-muted-foreground pt-2">
                      {OLDER_DAYS} hari sebelumnya
                    </p>
                    {olderGroups.map((group) => (
                      <DayGroup key={group.date} group={group} onSelect={setSelectedCompletion} />
                    ))}
                  </div>
                )}

                {hasOlderData && !showOlder && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleLoadOlder}
                      disabled={loadingOlder}
                      className="flex items-center gap-2 max-w-80 w-full justify-center rounded-xl border border-foreground/20 bg-white dark:bg-primary dark:text-background py-2.5 px-4 text-sm font-medium hover:bg-foreground/5 dark:hover:bg-primary/80 transition-colors disabled:opacity-60 [&_svg]:size-4"
                    >
                      {loadingOlder ? (
                        <SpinnerIcon className="animate-spin" />
                      ) : (
                        <ArrowDownIcon />
                      )}
                      {loadingOlder ? "Memuat..." : `Lihat ${OLDER_DAYS} hari sebelumnya`}
                    </button>
                  </div>
                )}

                {showOlder && olderGroups.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    Tidak ada riwayat pada periode sebelumnya.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCompletion && (
        <SessionDetailModal
          completion={selectedCompletion}
          onClose={() => setSelectedCompletion(null)}
        />
      )}
    </>
  )
}
