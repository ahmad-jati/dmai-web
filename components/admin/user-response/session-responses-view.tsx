'use client'

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import {
  ArrowLeftIcon, EyeIcon,
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

function Skeleton() {
  return (
    <div className="flex flex-col gap-10 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-24 h-8 bg-muted rounded-sm mt-0.5" />
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="h-5 bg-muted rounded w-52" />
          <div className="h-3.5 bg-muted/60 rounded w-40" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="border border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
              <div className="w-8 h-3.5 bg-muted/60 rounded" />
              <div className="flex-1 h-3.5 bg-muted rounded" />
              <div className="w-36 h-3.5 bg-muted/60 rounded" />
              <div className="w-20 h-7 bg-muted/40 rounded-sm ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pagination UI ───────────────────────────────────────────────────────────

function TablePagination({ page, totalPages, onPageChange, total }) {
  if (totalPages <= 1) return null
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
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

// ─── Response Detail Dialog ──────────────────────────────────────────────────

function ResponseDetailDialog({ record, open, onClose }) {
  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Response</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-1">
          {/* User + waktu */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border border-border rounded-sm">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Nama</p>
              <p className="font-semibold text-sm">{record.full_name ?? "—"}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{record.email}</p>
            </div>
            <div className="col-span-2 flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Diselesaikan</p>
              <p className="text-sm">{fmtDateTime(record.completed_at)}</p>
            </div>
          </div>

          {/* Form Responses */}
          {record.form_responses.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
                Form Response ({record.form_responses.length} step)
              </h4>
              <div className="flex flex-col gap-4">
                {record.form_responses.map((step, si) => (
                  <div key={si} className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Step {step.step_number} — {step.step_title ?? "Form"}
                    </p>
                    {step.answers.map((ans, ai) => (
                      <div key={ai} className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-foreground">{ans.label}</p>
                        <div className="bg-muted/40 border border-border rounded-sm px-3 py-2 text-sm">
                          {ans.value != null && ans.value !== ""
                            ? String(ans.value)
                            : <span className="text-muted-foreground italic">Tidak diisi</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body Map Responses */}
          {record.body_map_responses.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
                Body Map Response ({record.body_map_responses.length})
              </h4>
              <div className="flex flex-col gap-3">
                {record.body_map_responses.map((bm, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-muted/30 border border-border rounded-sm">
                    {bm.selected_parts?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-foreground">Bagian tubuh dipilih</p>
                        <div className="flex flex-wrap gap-1">
                          {bm.selected_parts.map((part, pi) => (
                            <span key={pi} className="inline-flex px-2 py-0.5 bg-baby-blue/40 border border-baby-blue rounded text-xs font-medium">
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {bm.sensation && (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-foreground">Sensasi</p>
                        <p className="text-sm capitalize">{bm.sensation}</p>
                      </div>
                    )}
                    {bm.note && (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-foreground">Catatan</p>
                        <div className="bg-muted/40 border border-border rounded-sm px-3 py-2 text-sm">
                          {bm.note}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.form_responses.length === 0 && record.body_map_responses.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6 italic">
              Tidak ada response yang tersimpan
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SessionResponsesView({ sessionId }: {sessionId: string | null}) {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [detailRecord, setDetailRecord] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      // Fetch session info
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, session_name, week_number")
        .eq("id", sessionId)
        .single()

      setSession(sessionData)
      

      // Fetch all completions for this session
      const { data: completionsData } = await supabase
        .from("session_completions")
        .select("id, user_id, session_name, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })

      if (!completionsData || completionsData.length === 0) {
        setCompletions([])
        setLoading(false)
        return
      }

      const userIds = [...new Set(completionsData.map((c) => c.user_id))]
      const completionIds = completionsData.map((c) => c.id)

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, email, full_name")
        .in("id", userIds)

      // Fetch form responses for all these completions
      const { data: formResponsesData } = await supabase
        .from("session_form_responses")
        .select("id, step_id, session_id, responses, completion_id")
        .in("completion_id", completionIds)

      // Fetch body map responses for all these completions
      const { data: bodyMapData } = await supabase
        .from("session_body_map_responses")
        .select("id, step_id, selected_parts, sensation, notes, completion_id")
        .in("completion_id", completionIds)

      // Fetch step titles from session_steps
      const stepIds = [
        ...new Set([
          ...(formResponsesData ?? []).map((r) => r.step_id),
          ...(bodyMapData ?? []).map((r) => r.step_id),
        ])
      ]

      const { data: stepsData } = stepIds.length > 0
        ? await supabase
          .from("session_steps")
          .select("id, title, step_config")
          .in("id", stepIds)
        : { data: [] }

      const profileMap = new Map()
      for (const p of profiles ?? []) profileMap.set(p.id, p)

      const stepMap = new Map()
      for (const s of stepsData ?? []) stepMap.set(s.id, s)

      // Group form responses by completion_id
      const formByCompletion = new Map()
      for (const fr of formResponsesData ?? []) {
        if (!formByCompletion.has(fr.completion_id)) formByCompletion.set(fr.completion_id, [])
        const step = stepMap.get(fr.step_id)
        const stepConfig = step?.step_config ?? {}
        const questions = stepConfig.questions ?? []
        // responses is a jsonb object keyed by question _key
        const answers = questions.map((q) => ({
          label: q.label,
          value: fr.responses?.[q._key] ?? null,
        }))
        formByCompletion.get(fr.completion_id).push({
          step_title: step?.title ?? null,
          answers,
        })
      }

      // Group body map responses by completion_id
      const bodyMapByCompletion = new Map()
      for (const bm of bodyMapData ?? []) {
        if (!bodyMapByCompletion.has(bm.completion_id)) bodyMapByCompletion.set(bm.completion_id, [])
        bodyMapByCompletion.get(bm.completion_id).push({
          selected_parts: bm.selected_parts ?? [],
          sensation: bm.sensation,
          note: bm.notes,
        })
      }

      const merged = completionsData.map((c) => {
        const formSteps = (formByCompletion.get(c.id) ?? [])
          // .sort((a, b) => a.step_number - b.step_number)
        return {
          id: c.id,
          user_id: c.user_id,
          completed_at: c.created_at,
          full_name: profileMap.get(c.user_id)?.full_name ?? null,
          email: profileMap.get(c.user_id)?.email ?? "—",
          form_responses: formSteps,
          body_map_responses: bodyMapByCompletion.get(c.id) ?? [],
        }
      })

      setCompletions(merged)
      setLoading(false)
    }

    load()
  }, [sessionId])

  const handleViewDetail = useCallback((record) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }, [])

  const totalPages = Math.ceil(completions.length / PAGE_SIZE) || 1
  const paginated = completions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) return <Skeleton />

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="sm"
          className="rounded-sm gap-1.5 [&_svg]:size-3.5 mt-0.5 shrink-0"
          onClick={() => router.push("/admin/user-responses")}
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Kembali
        </Button>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-semibold">{session?.session_name ?? "Sesi"}</h2>
          <p className="text-sm text-muted-foreground">
            {session?.week_number != null ? `Week ${session.week_number} · ` : ""}
            {completions.length} penyelesaian
          </p>
        </div>
      </div>

      {/* Completions Table */}
      <div className="flex flex-col gap-3">
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Nama User</TableHead>
                <TableHead className="w-48">Diselesaikan</TableHead>
                <TableHead className="w-24 text-center">Form Steps</TableHead>
                <TableHead className="w-24 text-center">Body Map</TableHead>
                <TableHead className="w-20 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-14 text-sm">
                    Belum ada penyelesaian untuk sesi ini
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {(page - 1) * PAGE_SIZE + i + 1}.
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {c.full_name ?? <span className="italic text-muted-foreground">—</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">{c.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDateTime(c.completed_at)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {c.form_responses.length}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {c.body_map_responses.length}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-sm gap-1.5 bg-background hover:bg-lemon text-foreground [&_svg]:size-3.5"
                        onClick={() => handleViewDetail(c)}
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        Lihat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={completions.length}
        />
      </div>

      <ResponseDetailDialog
        record={detailRecord}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRecord(null) }}
      />
    </div>
  )
}
