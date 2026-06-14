'use client'

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ChatCenteredTextIcon } from "@phosphor-icons/react"

// ─── Types ─────────────────────────────────────────────────────────────────

type MoodValue = "sangat_baik" | "baik" | "netral" | "kurang_baik" | "buruk"

type FeedbackRecord = {
  id: string
  created_at: string
  user_id: string
  session_slug: string
  session_name: string
  mood: MoodValue
  note: string | null
  user_email?: string
  user_full_name?: string
}

type MoodStat = {
  mood: MoodValue
  count: number
}

type SessionStat = {
  session_name: string
  session_slug: string
  count: number
  moods: Partial<Record<MoodValue, number>>
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MOOD_CONFIG: Record<MoodValue, { label: string; emoji: string; color: string; barColor: string }> = {
  buruk:       { label: "Buruk",       emoji: "😞", color: "bg-red-100 text-red-700 border-red-200",       barColor: "bg-red-400" },
  kurang_baik: { label: "Kurang Baik", emoji: "😔", color: "bg-amber-100 text-amber-700 border-amber-200", barColor: "bg-amber-400" },
  netral:      { label: "Netral",      emoji: "😐", color: "bg-gray-100 text-gray-600 border-gray-200",    barColor: "bg-gray-300" },
  baik:        { label: "Baik",        emoji: "🙂", color: "bg-blue-100 text-blue-700 border-blue-200",    barColor: "bg-blue-400" },
  sangat_baik: { label: "Sangat Baik", emoji: "😄", color: "bg-emerald-100 text-emerald-700 border-emerald-200", barColor: "bg-emerald-400" },
}

// Display order: bad → good (left to right: buruk … sangat_baik)
const MOOD_DISPLAY_ORDER: MoodValue[] = ["buruk", "kurang_baik", "netral", "baik", "sangat_baik"]

// Kept for the per-session table columns (same display order)
const ALL_MOODS = MOOD_DISPLAY_ORDER

function MoodBadge({ mood }: { mood: MoodValue }) {
  const cfg = MOOD_CONFIG[mood]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 w-fit rounded-full border text-xs font-medium ${cfg.color}`}>
      <span>{cfg.emoji}</span>
      {cfg.label}
    </span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

// ─── Skeleton ────────────────────────────────────────────────────────────────

function FeedbackSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-48" />
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-white border border-border rounded-md" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
      <div className="h-64 bg-white border border-border rounded-md" />
    </div>
  )
}

// ─── Mood Stats Bar with percentage labels ─────────────────────────────────────

function MoodStatsBar({ stats, total }: { stats: MoodStat[]; total: number }) {
  if (total === 0) return null

  const segments = MOOD_DISPLAY_ORDER.map((mood) => {
    const found = stats.find((s) => s.mood === mood)
    const count = found?.count ?? 0
    const pct = (count / total) * 100
    return { mood, count, pct }
  })

  return (
    <div className="flex flex-col gap-1.5">
      {/* Bar */}
      <div className="flex rounded-full overflow-hidden h-4 w-full bg-muted">
        {segments.map(({ mood, pct }) => (
          <div
            key={mood}
            style={{ width: `${pct}%` }}
            className={`${MOOD_CONFIG[mood].barColor} transition-all relative`}
            title={`${MOOD_CONFIG[mood].label}: ${Math.round(pct)}%`}
          />
        ))}
      </div>
      {/* Percentage labels below bar */}
      <div className="flex w-full">
        {segments.map(({ mood, pct }) => (
          <div
            key={mood}
            style={{ width: `${pct}%` }}
            className="flex justify-center"
          >
            {pct >= 8 && (
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                {pct.toFixed(0)}%
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-5 gap-3 w-full mt-1">
        {segments.map(({ mood, count, pct }) => (
          <div key={mood} className="flex items-center w-full justify-center gap-2 ">
            <div className={`w-2.5 h-2.5 rounded-full ${MOOD_CONFIG[mood].barColor}`} />
            <span className="text-xs text-muted-foreground">
              {MOOD_CONFIG[mood].emoji} {MOOD_CONFIG[mood].label} ({count} · {pct.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Feedback Detail Dialog ──────────────────────────────────────────────────

function FeedbackDetailDialog({
  record,
  open,
  onClose,
}: {
  record: FeedbackRecord | null
  open: boolean
  onClose: () => void
}) {
  if (!record) return null
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Feedback</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Sesi</p>
            <p className="font-semibold">{record.session_name}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Pengguna</p>
            <p className="font-medium">{record.user_full_name ?? "—"}</p>
            <p className="text-sm text-muted-foreground font-medium">{record.user_email}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Perasaan</p>
            <MoodBadge mood={record.mood} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Catatan</p>
            <div className="bg-muted/40 border border-border rounded-md p-3 text-sm leading-relaxed">
              {record.note? `${record.note}` : "-"}
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Waktu</p>
            <p className="text-sm font-medium">{fmtDate(record.created_at)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FeedbackManager() {
  const [records, setRecords] = useState<FeedbackRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSession, setFilterSession] = useState<string>("all")
  const [filterMood, setFilterMood] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailRecord, setDetailRecord] = useState<FeedbackRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data: feedback, error } = await supabase
        .from("session_feedback")
        .select("*")
        .order("created_at", { ascending: false })

      if (error || !feedback) {
        console.error(error)
        setLoading(false)
        return
      }

      const userIds = [...new Set(feedback.map((f) => f.user_id))]
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, email, full_name")
        .in("id", userIds)

      const profileMap = new Map<string, { email: string; full_name: string | null }>()
      for (const p of profiles ?? []) {
        profileMap.set(p.id, { email: p.email, full_name: p.full_name })
      }

      const merged: FeedbackRecord[] = feedback.map((f) => ({
        ...f,
        user_email: profileMap.get(f.user_id)?.email,
        user_full_name: profileMap.get(f.user_id)?.full_name ?? undefined,
      }))

      setRecords(merged)
      setLoading(false)
    }
    load()
  }, [])

  // Derived stats
  const moodStats: MoodStat[] = MOOD_DISPLAY_ORDER.map((mood) => ({
    mood,
    count: records.filter((r) => r.mood === mood).length,
  }))

  const sessionStats: SessionStat[] = Object.values(
    records.reduce<Record<string, SessionStat>>((acc, r) => {
      if (!acc[r.session_slug]) {
        acc[r.session_slug] = { session_name: r.session_name, session_slug: r.session_slug, count: 0, moods: {} }
      }
      acc[r.session_slug].count++
      acc[r.session_slug].moods[r.mood] = (acc[r.session_slug].moods[r.mood] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b.count - a.count)

  const uniqueSessions = sessionStats.map((s) => ({ slug: s.session_slug, name: s.session_name }))

  const filtered = records.filter((r) => {
    if (filterSession !== "all" && r.session_slug !== filterSession) return false
    if (filterMood !== "all" && r.mood !== filterMood) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleFilterChange = useCallback((key: "session" | "mood", val: string) => {
    setPage(1)
    if (key === "session") setFilterSession(val)
    else setFilterMood(val)
  }, [])

  const handlePageSizeChange = useCallback((val: string) => {
    setPageSize(Number(val))
    setPage(1)
  }, [])

  if (loading) return <FeedbackSkeleton />

  const totalFeedback = records.length
  const withNote = records.filter((r) => r.note).length

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Feedback Pengguna</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalFeedback} total feedback · {withNote} dengan catatan
        </p>
      </div>

      {/* ── Mood Overview Cards ── */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ringkasan Mood</h3>
        <div className="grid grid-cols-5 gap-3">
          {MOOD_DISPLAY_ORDER.map((mood) => {
            const count = moodStats.find((s) => s.mood === mood)?.count ?? 0
            const cfg = MOOD_CONFIG[mood]
            const pct = totalFeedback > 0 ? ((count / totalFeedback) * 100).toFixed(1) : "0"
            return (
              <div
                key={mood}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-border rounded-md"
              >
                <span className="text-3xl">{cfg.emoji}</span>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground text-center font-medium leading-tight">{cfg.label}</p>
                <p className="text-xs text-muted-foreground">{pct}%</p>
              </div>
            )
          })}
        </div>
        {/* <MoodStatsBar stats={moodStats} total={totalFeedback} /> */}
      </div>

      {/* ── Per Session ── */}
      {sessionStats.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Per Sesi</h3>
          <div className="border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nama Sesi</TableHead>
                  <TableHead className="w-24 text-center">Total</TableHead>
                  {ALL_MOODS.map((m) => (
                    <TableHead key={m} className="text-center w-16" title={MOOD_CONFIG[m].label}>
                      {MOOD_CONFIG[m].emoji}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionStats.map((s) => (
                  <TableRow key={s.session_slug}>
                    <TableCell className="font-medium text-sm">{s.session_name}</TableCell>
                    <TableCell className="text-center font-semibold">{s.count}</TableCell>
                    {ALL_MOODS.map((m) => (
                      <TableCell key={m} className="text-center text-sm text-muted-foreground">
                        {s.moods[m] ?? 0}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Detail Table ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Semua Feedback ({filtered.length})
          </h3>
          {/* Filters + rows per page */}
          <div className="flex items-center gap-2">
            <Select value={filterSession} onValueChange={(v) => handleFilterChange("session", v)}>
              <SelectTrigger className="w-44 h-8 text-sm rounded-md">
                <SelectValue placeholder="Semua sesi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sesi</SelectItem>
                {uniqueSessions.map((s) => (
                  <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMood} onValueChange={(v) => handleFilterChange("mood", v)}>
              <SelectTrigger className="w-36 h-8 text-sm rounded-md">
                <SelectValue placeholder="Semua mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mood</SelectItem>
                {MOOD_DISPLAY_ORDER.map((m) => (
                  <SelectItem key={m} value={m}>
                    {MOOD_CONFIG[m].emoji} {MOOD_CONFIG[m].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Tampilkan</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-fit h-8 text-sm rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">baris</span>
            </div>
          </div>
        </div>

        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Sesi</TableHead>
                <TableHead className="w-32">Mood</TableHead>
                <TableHead className="w-40">Waktu</TableHead>
                <TableHead className="w-20 text-center">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                    Belum ada feedback
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {(page - 1) * pageSize + i + 1}.
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{r.user_full_name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground">{r.user_email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{r.session_name}</TableCell>
                    <TableCell><MoodBadge mood={r.mood} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-sm gap-1.5 hover:bg-celeste [&_svg]:size-3.5"
                        onClick={() => { setDetailRecord(r); setDetailOpen(true) }}
                      >
                        <ChatCenteredTextIcon className="w-3.5 h-3.5" />
                        Lihat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination footer: showing X–Y of Z + page nav */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0
              ? "Tidak ada data"
              : `Menampilkan ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} dari ${filtered.length} entri`}
          </p>

          {totalPages > 1 && (
            <Pagination className="justify-end w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-40 rounded-md" : "cursor-pointer rounded-md hover:bg-muted-foreground/20"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <Button
                      variant={p === page ? "default" : "ghost"}
                      size="sm"
                      className="w-8 h-8 p-0 rounded-md font-medium text-sm hover:bg-muted-foreground/20"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-40 rounded-md" : "cursor-pointer rounded-md hover:bg-muted-foreground/20"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>

      <FeedbackDetailDialog
        record={detailRecord}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRecord(null) }}
      />
    </div>
  )
}