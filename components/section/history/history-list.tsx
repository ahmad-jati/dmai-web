'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CalendarIcon, ClockIcon, ArrowDownIcon, ArrowArcRightIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

type CompletionRecord = {
  id: string
  session_name: string
  session_slug: string
  completed_at: string
}

type GroupedDay = {
  label: string        // e.g. "Hari ini", "Kemarin", "Senin, 2 Jun"
  date: string         // YYYY-MM-DD for keying
  items: CompletionRecord[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(iso: string) {
  return iso.slice(0, 10)   // "YYYY-MM-DD"
}

function dayLabel(dateKey: string, todayKey: string, yesterdayKey: string): string {
  if (dateKey === todayKey) return 'Hari ini'
  if (dateKey === yesterdayKey) return 'Kemarin'
  const d = new Date(dateKey + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function groupByDay(items: CompletionRecord[]): GroupedDay[] {
  const todayKey = toDateKey(new Date().toISOString())
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = toDateKey(yesterday.toISOString())

  const map = new Map<string, CompletionRecord[]>()
  for (const item of items) {
    const key = toDateKey(item.completed_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))  // newest first
    .map(([date, dayItems]) => ({
      label: dayLabel(date, todayKey, yesterdayKey),
      date,
      items: dayItems.sort((a, b) =>
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      ),
    }))
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="flex gap-6 items-center w-full">
        <div className="rounded-3xl w-130 bg-foreground/8 h-130 animate-pulse" />
        <div className="flex flex-col gap-6 w-full h-130 overflow-hidden">
        <h2 className="text-xl font-semibold">Riwayat Sesi</h2>
          {Array.from({ length: 3 }).map((_, gi) => (
            <div key={gi} className="flex flex-col gap-3 animate-pulse">
              <div className="h-4 bg-foreground/10 rounded w-24" />
              <div className="grid grid-cols-2 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-background rounded-xl border border-foreground/10" />
                ))}
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}

// ─── History Item Card ────────────────────────────────────────────────────────

function HistoryItemCard({ item }: { item: CompletionRecord }) {
  return (
    <div className="flex items-start justify-between gap-4 bg-background rounded-xl border border-foreground/15 px-4 py-3 hover:border-foreground/30 transition-colors">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="font-semibold text-sm truncate">{item.session_name}</p>
        <Button
          className="[&_svg]:size-3.5 bg-white w-fit px-4 py-2 mt-2 font-medium rounded-full hover:bg-celeste"
          size="sm"
          
        >
          <Link 
            href={`/session/${item.session_slug}`}
            className="flex items-center gap-2"
          >
            Lihat sesi 
            <ArrowRightIcon/>
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
        <ClockIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{formatTime(item.completed_at)}</span>
      </div>
    </div>
  )
}

// ─── Day Group ────────────────────────────────────────────────────────────────

function DayGroup({ group }: { group: GroupedDay }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-semibold text-foreground">{group.label}</p>
        <span className="text-xs text-muted-foreground">({group.items.length} sesi)</span>
      </div>
      <div className="grid grid-cols-2 gap-2 pl-1">
        {group.items.map((item) => (
          <HistoryItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RECENT_DAYS = 10
const OLDER_DAYS = 10   

export function HistoryList() {
  const [recentGroups, setRecentGroups] = useState<GroupedDay[]>([])
  const [olderGroups, setOlderGroups] = useState<GroupedDay[]>([])
  const [showOlder, setShowOlder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [olderFetched, setOlderFetched] = useState(false)
  const [hasOlderData, setHasOlderData] = useState(false)

  // Fetch recent 10 days on mount
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) { setLoading(false); return }

      const since = new Date()
      since.setDate(since.getDate() - RECENT_DAYS)

      const { data } = await supabase
        .from('session_completions')
        .select('id, session_name, session_slug, completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', since.toISOString())
        .order('completed_at', { ascending: false })

      const grouped = groupByDay((data ?? []) as CompletionRecord[])
      setRecentGroups(grouped)

      // Check whether older records exist (beyond 10 days)
      const olderCutoff = new Date()
      olderCutoff.setDate(olderCutoff.getDate() - RECENT_DAYS)
      const { count } = await supabase
        .from('session_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lt('completed_at', olderCutoff.toISOString())

      setHasOlderData((count ?? 0) > 0)
      setLoading(false)
    }
    fetch()
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
      .from('session_completions')
      .select('id, session_name, session_slug, completed_at')
      .eq('user_id', user.id)
      .lt('completed_at', olderEnd.toISOString())
      .gte('completed_at', olderStart.toISOString())
      .order('completed_at', { ascending: false })

    const grouped = groupByDay((data ?? []) as CompletionRecord[])
    setOlderGroups(grouped)
    setOlderFetched(true)
    setShowOlder(true)
    setLoadingOlder(false)
  }

  if (loading) return <HistorySkeleton />

  const totalSessions = recentGroups.reduce((s, g) => s + g.items.length, 0)
    + (showOlder ? olderGroups.reduce((s, g) => s + g.items.length, 0) : 0)

  const isEmpty = recentGroups.length === 0

  return (
    <div className="flex items-center gap-6 w-full">

      <div className="w-130 h-130">
        <Image
          src={'/tropicaline/Being-Still.png'}
          alt="Being Okay (Tropicaline Illustrations)"
          width={2000}
          height={2000}
          priority
          className="w-full h-full object-contain"
        />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3.5 items-start w-full">
        <h2 className="text-xl font-semibold">Riwayat Sesi</h2>

        <div className="h-118 pr-4 pb-8 overflow-y-auto w-full">
          {/* {!isEmpty && (
            <p className="text-sm text-muted-foreground">
              {totalSessions} sesi dalam {RECENT_DAYS} hari terakhir
              {showOlder ? ` + ${OLDER_DAYS} hari sebelumnya` : ''}
            </p>
          )} */}
          
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CalendarIcon className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Belum ada riwayat sesi</p>
            <p className="text-xs text-muted-foreground/70">Selesaikan sesi pertamamu untuk melihat riwayat di sini.</p>
          </div>
        ) : (
          <>
            {/* Recent 10 days */}
            <div className="flex flex-col gap-6">
              {recentGroups.map((group) => (
                <DayGroup key={group.date} group={group} />
              ))}
            </div>

            {/* Older section */}
            {showOlder && olderGroups.length > 0 && (
              <div className="flex flex-col gap-6 pt-2 border-t border-foreground/10">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">
                  {OLDER_DAYS} hari sebelumnya
                </p>
                {olderGroups.map((group) => (
                  <DayGroup key={group.date} group={group} />
                ))}
              </div>
            )}

            {/* Load older button */}
            {hasOlderData && !showOlder && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleLoadOlder}
                  disabled={loadingOlder}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground border border-foreground/20 rounded-full hover:border-foreground/40 hover:bg-foreground/5 transition-all disabled:opacity-50"
                >
                  {loadingOlder ? (
                    <span className="animate-spin w-4 h-4 border-2 border-foreground/30 border-t-foreground/70 rounded-full" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )}
                  {loadingOlder ? 'Memuat...' : `Lihat ${OLDER_DAYS} hari sebelumnya`}
                </button>
              </div>
            )}

            {showOlder && olderGroups.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                Tidak ada riwayat pada periode sebelumnya.
              </p>
            )}
          </>
        )}

        </div>
      </div>

    </div>
  )
}