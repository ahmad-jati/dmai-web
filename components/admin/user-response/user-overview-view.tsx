'use client'

import { useEffect, useState } from "react"
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
  ArrowLeftIcon, EyeIcon, ClipboardTextIcon, CheckCircleIcon, CalendarCheckIcon,
} from "@phosphor-icons/react"

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDateTime(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function fmtDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  })
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-10 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-24 h-8 bg-muted rounded-sm mt-0.5" />
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="h-5 bg-muted rounded w-44" />
          <div className="h-3.5 bg-muted/60 rounded w-60" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 border border-border bg-white rounded-sm" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 bg-muted rounded w-36" />
        <div className="border border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
              <div className="w-8 h-3.5 bg-muted/60 rounded" />
              <div className="flex-1 h-3.5 bg-muted rounded" />
              <div className="w-32 h-3.5 bg-muted/60 rounded" />
              <div className="w-20 h-7 bg-muted/40 rounded-sm ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Session Detail Dialog ─────────────────────────────────────────────────

function SessionDetailDialog({ record, open, onClose }) {
  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail — {record.session_name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-1">
          {/* Info sesi */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border border-border rounded-sm">
            <div className="col-span-2 flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Diselesaikan</p>
              <p className="text-sm font-medium">{fmtDateTime(record.completed_at)}</p>
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
                      Step {step.step_number}{step.step_title ? ` — ${step.step_title}` : ""}
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
                    {!bm.selected_parts?.length && !bm.sensation && !bm.note && (
                      <p className="text-sm text-muted-foreground italic">Tidak ada input body map</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.form_responses.length === 0 && record.body_map_responses.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6 italic">
              Tidak ada response yang tersimpan untuk sesi ini
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UserOverviewView({ userId }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sessionHistory, setSessionHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailRecord, setDetailRecord] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      // User profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, created_at")
        .eq("id", userId)
        .single()

      setUser(profile)

      // All completions by this user
      const { data: completionsData } = await supabase
        .from("session_completions")
        .select("id, session_id, session_name, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (!completionsData || completionsData.length === 0) {
        setSessionHistory([])
        setLoading(false)
        return
      }

      const completionIds = completionsData.map((c) => c.id)
      const sessionIds = [...new Set(completionsData.map((c) => c.session_id))]

      // Session week numbers
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("id, week_number")
        .in("id", sessionIds)

      const sessionMeta = new Map()
      for (const s of sessionsData ?? []) sessionMeta.set(s.id, s)

      // Form responses
      const { data: formResponsesData } = await supabase
        .from("session_form_responses")
        .select("completion_id, step_id, step_number, responses")
        .in("completion_id", completionIds)

      // Body map responses
      const { data: bodyMapData } = await supabase
        .from("session_body_map_responses")
        .select("completion_id, step_id, selected_parts, sensation, note")
        .in("completion_id", completionIds)

      // Step titles from session_steps
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

        console.log('===================')
      console.log(formResponsesData)
      console.log('===================')
        console.log('===================')
      console.log(bodyMapData)
      console.log('===================')
        console.log('===================')
      console.log(stepsData)
      console.log('===================')

      const stepMap = new Map()
      for (const s of stepsData ?? []) stepMap.set(s.id, s)

      // Group form responses by completion_id
      const formByCompletion = new Map()
      for (const fr of formResponsesData ?? []) {
        if (!formByCompletion.has(fr.completion_id)) formByCompletion.set(fr.completion_id, [])
        const step = stepMap.get(fr.step_id)
        const questions = step?.step_config?.questions ?? []
        const answers = questions.map((q) => ({
          label: q.label,
          value: fr.responses?.[q._key] ?? null,
        }))
        formByCompletion.get(fr.completion_id).push({
          step_number: fr.step_number,
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
          note: bm.note,
        })
      }

      const history = completionsData.map((c) => {
        const meta = sessionMeta.get(c.session_id)
        const formSteps = (formByCompletion.get(c.id) ?? [])
          .sort((a, b) => a.step_number - b.step_number)
        return {
          id: c.id,
          session_id: c.session_id,
          session_name: c.session_name,
          week_number: meta?.week_number ?? null,
          completed_at: c.created_at ?? null,
          form_responses: formSteps,
          body_map_responses: bodyMapByCompletion.get(c.id) ?? [],
        }
      })

      setSessionHistory(history)
      setLoading(false)
    }

    load()
  }, [userId])

  // Unique sessions completed
  const uniqueSessions = new Set(sessionHistory.map((r) => r.session_id)).size

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
          <h2 className="text-xl font-semibold">{user?.full_name ?? "—"}</h2>
          <p className="text-sm text-muted-foreground">
            {user?.email}
            {user?.created_at ? ` · Terdaftar ${fmtDate(user.created_at)}` : ""}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2 p-4 bg-white border border-border rounded-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ClipboardTextIcon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Sesi Unik</span>
          </div>
          <p className="text-2xl font-bold">{uniqueSessions}</p>
          <p className="text-xs text-muted-foreground">dari {sessionHistory.length} total penyelesaian</p>
        </div>
        <div className="flex flex-col gap-2 p-4 bg-white border border-border rounded-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircleIcon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Selesai</span>
          </div>
          <p className="text-2xl font-bold">{sessionHistory.length}</p>
          <p className="text-xs text-muted-foreground">kali mengikuti sesi</p>
        </div>
        <div className="flex flex-col gap-2 p-4 bg-white border border-border rounded-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarCheckIcon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Terakhir Aktif</span>
          </div>
          <p className="text-sm font-semibold mt-1">
            {sessionHistory[0]?.completed_at
              ? fmtDate(sessionHistory[0].completed_at)
              : "—"}
          </p>
        </div>
      </div>

      {/* Session History Table */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Riwayat Sesi ({sessionHistory.length})
        </h3>

        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Nama Sesi</TableHead>
                <TableHead className="w-28 text-center">Week</TableHead>
                <TableHead className="w-48">Diselesaikan</TableHead>
                <TableHead className="w-24 text-center">Form</TableHead>
                <TableHead className="w-24 text-center">Body Map</TableHead>
                <TableHead className="w-20 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-14 text-sm">
                    Belum ada riwayat sesi
                  </TableCell>
                </TableRow>
              ) : (
                sessionHistory.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-center text-muted-foreground text-sm">{i + 1}.</TableCell>
                    <TableCell className="font-medium text-sm">{r.session_name}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {r.week_number != null ? `Week ${r.week_number}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDateTime(r.completed_at)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {r.form_responses.length}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {r.body_map_responses.length}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-sm gap-1.5 bg-background hover:bg-lemon text-foreground [&_svg]:size-3.5"
                        onClick={() => { setDetailRecord(r); setDetailOpen(true) }}
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
      </div>

      <SessionDetailDialog
        record={detailRecord}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRecord(null) }}
      />
    </div>
  )
}
