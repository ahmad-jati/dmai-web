'use client'

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import {
  ClipboardTextIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  CaretRightIcon,
} from "@phosphor-icons/react"
import { fmtLocalTime, fmtDuration, groupByDay } from "@/lib/session-helper"
import type { SessionSummary, RecentCompletion } from "@/lib/session-helper"

// ─── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 25

// Shared row treatment — every clickable list item across this page looks
// and behaves the same way: full row click, same hover, same trailing caret.
const ROW_CARD =
  "group flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(fullName: string | null, email: string) {
  const source = (fullName ?? "").trim() || email
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground italic border border-dashed border-border rounded-xl">
      {text}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-10 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-6 bg-muted rounded w-52" />
        <div className="h-3.5 bg-muted/60 rounded w-72" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[60px] bg-muted/50 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 bg-muted rounded w-44" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[60px] bg-muted/50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pagination UI ───────────────────────────────────────────────────────────

function ResultsPagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  total: number
  pageSize: number
}) {
  if (totalPages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Menampilkan {from}–{to} dari {total} entri
      </p>
      <Pagination className="justify-end w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className={page === 1 ? "pointer-events-none opacity-40 rounded-sm" : "cursor-pointer rounded-sm hover:bg-muted-foreground/20"}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <PaginationItem key={p}>
              <Button
                variant={p === page ? "default" : "ghost"}
                size="sm"
                className="w-8 h-8 p-0 rounded-sm font-medium text-sm hover:bg-muted-foreground/20"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className={page === totalPages ? "pointer-events-none opacity-40 rounded-sm" : "cursor-pointer rounded-sm hover:bg-muted-foreground/20"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UserResponsesManager() {
  const router = useRouter()

  // ── Cache via ref — survives navigation back to this page ──────────────────
  const cache = useRef<{
    sessions: SessionSummary[]
    recentCompletions: RecentCompletion[]
  } | null>(null)

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [recentCompletions, setRecentCompletions] = useState<RecentCompletion[]>([])
  const [loading, setLoading] = useState(!cache.current)
  const [search, setSearch] = useState("")
  const [recentPage, setRecentPage] = useState(1)

  useEffect(() => {
    // If we already fetched once, reuse cached data — no re-fetch
    if (cache.current) {
      setSessions(cache.current.sessions)
      setRecentCompletions(cache.current.recentCompletions)
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("id, session_name, week_number, sort_order")
        .order("sort_order", { ascending: true })

      const { data: completionsData } = await supabase
        .from("session_completions")
        .select("session_id, user_id")

      const completionMap = new Map<string, Set<string>>()
      for (const c of completionsData ?? []) {
        if (!completionMap.has(c.session_id)) completionMap.set(c.session_id, new Set())
        completionMap.get(c.session_id)!.add(c.user_id)
      }

      const sessionList: SessionSummary[] = (sessionsData ?? []).map((s) => ({
        id: s.id,
        session_name: s.session_name,
        week_number: s.week_number,
        total_completed: completionMap.get(s.id)?.size ?? 0,
      }))

      const { data: recent } = await supabase
        .from("session_completions")
        .select("id, user_id, session_id, session_name, started_at, completed_at")
        .order("completed_at", { ascending: false })
        .limit(200)

      const userIds = [...new Set((recent ?? []).map((r) => r.user_id))]

      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, email, full_name")
        .in("id", userIds)

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      )

      const recentList: RecentCompletion[] = (recent ?? []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        session_id: r.session_id,
        session_name: r.session_name,
        started_at: r.started_at ?? null,
        completed_at: r.completed_at ?? null,
        full_name: profileMap.get(r.user_id)?.full_name ?? null,
        email: profileMap.get(r.user_id)?.email ?? "—",
      }))

      // Store in cache
      cache.current = { sessions: sessionList, recentCompletions: recentList }

      setSessions(sessionList)
      setRecentCompletions(recentList)
      setLoading(false)
    }

    load()
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setRecentPage(1)
  }, [])

  const filteredCompletions = recentCompletions.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (c.full_name ?? "").toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filteredCompletions.length / PAGE_SIZE) || 1
  const paginated = filteredCompletions.slice((recentPage - 1) * PAGE_SIZE, recentPage * PAGE_SIZE)
  const pagedGrouped = groupByDay(paginated, "completed_at")

  if (loading) return <PageSkeleton />

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">User Responses</h2>
        <p className="text-sm text-muted-foreground">
          {sessions.length} sesi tersedia · {recentCompletions.length} total penyelesaian
        </p>
      </div>

      {/* ── Daftar Sesi ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ClipboardTextIcon className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Daftar Sesi</h3>
          <span className="text-sm text-muted-foreground ml-1">({sessions.length})</span>
        </div>

        {sessions.length === 0 ? (
          <EmptyState text="Belum ada sesi" />
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((s, i) => (
              <div
                key={s.id}
                onClick={() => router.push(`/admin/user-responses/session/${s.id}`)}
                className={ROW_CARD}
              >
                {/* Week order is a real sequence, so a numbered badge earns its place here */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground/[0.06] text-xs font-semibold text-foreground/60 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.session_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.week_number != null ? `Week ${s.week_number}` : "Tanpa minggu"}
                    <span className="text-muted-foreground/40"> · </span>
                    {s.total_completed} selesai
                  </p>
                </div>
                <CaretRightIcon className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Penyelesaian Terakhir — grouped by day ──────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Penyelesaian Terakhir</h3>
            <span className="text-sm text-muted-foreground ml-1">({filteredCompletions.length})</span>
          </div>
          <div className="relative w-64">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email..."
              value={search}
              onChange={handleSearchChange}
              className="pl-8 h-8 text-sm rounded-sm"
            />
          </div>
        </div>

        {pagedGrouped.length === 0 ? (
          <EmptyState text={search ? "Tidak ada hasil pencarian" : "Belum ada penyelesaian"} />
        ) : (
          <div className="flex flex-col gap-5">
            {pagedGrouped.map((group) => (
              <div key={`day-${group.label}`} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide px-1">
                  {group.label}
                </p>
                <div className="flex flex-col gap-2">
                  {group.items.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/admin/user-responses/${c.user_id}`)}
                      className={ROW_CARD}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-foreground/[0.06] text-xs font-semibold text-foreground/60 shrink-0">
                        {getInitials(c.full_name, c.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium truncate">
                            {c.full_name ?? <span className="italic text-muted-foreground">Tanpa nama</span>}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">
                          {c.session_name}
                          <span className="text-muted-foreground/40"> · </span>
                          {fmtDuration(c.started_at, c.completed_at)} tes
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:block">
                        {fmtLocalTime(c.completed_at)}
                      </span>
                      <CaretRightIcon className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <ResultsPagination
          page={recentPage}
          totalPages={totalPages}
          onPageChange={setRecentPage}
          total={filteredCompletions.length}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  )
}