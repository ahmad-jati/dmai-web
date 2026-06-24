'use client'

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
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
  ArrowSquareOutIcon,
} from "@phosphor-icons/react"

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDateTime(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const PAGE_SIZE = 10

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
        <div className="border border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
              <div className="w-8 h-3.5 bg-muted/60 rounded" />
              <div className="flex-1 h-3.5 bg-muted rounded" />
              <div className="w-16 h-3.5 bg-muted/60 rounded" />
              <div className="w-24 h-3.5 bg-muted/60 rounded" />
              <div className="w-10 h-3.5 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 bg-muted rounded w-44" />
        <div className="border border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
              <div className="w-8 h-3.5 bg-muted/60 rounded" />
              <div className="flex-1 h-3.5 bg-muted rounded" />
              <div className="w-32 h-3.5 bg-muted/60 rounded" />
              <div className="w-36 h-3.5 bg-muted/60 rounded" />
              <div className="w-20 h-7 bg-muted/40 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pagination UI ───────────────────────────────────────────────────────────

function TablePagination({ page, totalPages, onPageChange, total, pageSize }) {
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
  const [sessions, setSessions] = useState([])
  const [recentCompletions, setRecentCompletions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [recentPage, setRecentPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      // Fetch all sessions ordered by sort_order
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("id, session_name, week_number, sort_order")
        .order("sort_order", { ascending: true })

      // Fetch all completions to count per session (distinct users)
      const { data: completionsData } = await supabase
        .from("session_completions")
        .select("session_id, user_id")

      // Count unique users who completed each session
      const completionMap = {}
      for (const c of completionsData ?? []) {
        if (!completionMap[c.session_id]) completionMap[c.session_id] = new Set()
        completionMap[c.session_id].add(c.user_id)
      }

      const sessionList = (sessionsData ?? []).map((s) => ({
        id: s.id,
        session_name: s.session_name,
        week_number: s.week_number,
        total_completed: completionMap[s.id]?.size ?? 0,
      }))

      setSessions(sessionList)

      // Fetch recent completions
      const { data: recent } = await supabase
        .from("session_completions")
        .select("id, user_id, session_id, session_name, created_at")
        .order("created_at", { ascending: false })
        .limit(200)

      const userIds = [...new Set((recent ?? []).map((r) => r.user_id))]

      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, email, full_name")
        .in("id", userIds)

      const profileMap = new Map()
      for (const p of profiles ?? []) profileMap.set(p.id, p)

      const completions = (recent ?? []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        session_id: r.session_id,
        session_name: r.session_name,
        completed_at: r.created_at,
        full_name: profileMap.get(r.user_id)?.full_name ?? null,
        email: profileMap.get(r.user_id)?.email ?? "—",
      }))

      setRecentCompletions(completions)
      setLoading(false)
    }

    load()
  }, [])

  const handleSearchChange = useCallback((e) => {
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

      {/* ── Session List Table ─────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ClipboardTextIcon className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Daftar Sesi</h3>
          <span className="text-sm text-muted-foreground ml-1">({sessions.length})</span>
        </div>

        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Nama Sesi</TableHead>
                <TableHead className="w-28 text-center">Week</TableHead>
                <TableHead className="w-44 text-center">Total Selesai</TableHead>
                <TableHead className="w-16 text-center">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10 text-sm">
                    Belum ada sesi
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s, i) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => router.push(`/admin/user-responses/session/${s.id}`)}
                  >
                    <TableCell className="text-center text-muted-foreground text-sm">{i + 1}.</TableCell>
                    <TableCell className="font-medium text-sm">{s.session_name}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {s.week_number != null
                        ? `Week ${s.week_number}`
                        : <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                        <UsersIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        {s.total_completed} user
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <CaretRightIcon className="w-4 h-4 text-muted-foreground mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Recent Completions Table ───────────────────────── */}
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

        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Nama User</TableHead>
                <TableHead>Sesi</TableHead>
                <TableHead className="w-48">Diselesaikan</TableHead>
                <TableHead className="w-20 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10 text-sm">
                    {search ? "Tidak ada hasil pencarian" : "Belum ada penyelesaian"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {(recentPage - 1) * PAGE_SIZE + i + 1}.
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {c.full_name ?? <span className="italic text-muted-foreground">—</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">{c.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.session_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDateTime(c.completed_at)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-sm gap-1.5 bg-background hover:bg-lemon text-foreground [&_svg]:size-3.5"
                        onClick={() => router.push(`/admin/user-responses/${c.user_id}`)}
                      >
                        <ArrowSquareOutIcon className="w-3.5 h-3.5" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
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
