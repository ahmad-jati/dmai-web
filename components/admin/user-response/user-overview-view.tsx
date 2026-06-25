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
import { BodyMapRegion } from "@/lib/body-map-region"
import { fmtLocalTime, fmtDuration, groupByDay, fmtDate, fmtClock } from "@/lib/session-helper"
import type { SessionHistoryRecord, UserProfile, FormStep, BodyMapResponse } from "@/lib/session-helper"

// ─── Constants ───────────────────────────────────────────────────────────────
const bodyPartLabelMap = new Map(BodyMapRegion.map((r) => [r.id, r.label_id]))

const EMOJI_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Sangat buruk" },
  2: { emoji: "😕", label: "Buruk" },
  3: { emoji: "😐", label: "Netral" },
  4: { emoji: "🙂", label: "Baik" },
  5: { emoji: "😊", label: "Sangat baik" },
}

function renderAnswerValue(
  value: string | number | string[] | null,
  type?: string,
): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic">Tidak diisi</span>
  }

  // Deteksi explicit dari type field, fallback auto-detect kalau type undefined
  const num = Number(value)
  const isNumeric = !Array.isArray(value) && !isNaN(num) && String(value).trim() !== ""
  const isEmoji = type === "emoji_scale" || (!type && isNumeric && Number.isInteger(num) && num >= 1 && num <= 5)
  const isSlider = type === "slider" || (!type && isNumeric && !isEmoji)

  if (isEmoji) {
    const entry = EMOJI_MAP[num]
    if (entry) {
      return (
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <span className="text-xl">{entry.emoji}</span>
          <span className="text-foreground">{entry.label}</span>
        </span>
      )
    }
  }

  if (isSlider) {
    return (
      <span className="text-sm font-semibold text-foreground">
        {String(value)}
        <span className="text-xs font-normal text-muted-foreground ml-1">/ 100</span>
      </span>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-0.5">
        {value.map((v) => (
          <span
            key={v}
            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-foreground/8 border border-foreground/15"
          >
            {v}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-foreground/4 rounded-lg px-3 py-2 text-sm text-foreground leading-relaxed">
      {String(value)}
    </div>
  )
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

function SessionDetailDialog({
  record,
  open,
  onClose,
}: {
  record: SessionHistoryRecord | null
  open: boolean
  onClose: () => void
}) {
  if (!record) return null

  const hasNoData = record.form_responses.length === 0 && record.body_map_responses.length === 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail — {record.session_name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-1">
          {/* Info sesi */}
          <div className="flex flex-col gap-2 p-4 bg-foreground/2 border border-foreground/10 rounded-xl">
            {record.started_at && (
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Mulai</p>
                <p className="text-sm font-medium">{fmtLocalTime(record.started_at)}</p>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Selesai</p>
              <p className="text-sm font-medium">{fmtLocalTime(record.completed_at)}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Durasi</p>
              <p className="text-sm font-semibold tabular-nums">{fmtDuration(record.started_at, record.completed_at)}</p>
            </div>
          </div>

          {hasNoData && (
            <p className="text-sm text-muted-foreground text-center py-6 italic">
              Tidak ada response yang tersimpan untuk sesi ini
            </p>
          )}

          {/* Form Responses */}
          {record.form_responses.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ClipboardTextIcon className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Form</p>
                {/* <span className="text-xs text-muted-foreground">
                  ({record.form_responses.length} step)
                </span> */}
              </div>
              <div className="flex flex-col gap-3">
                {record.form_responses.map((step, si) => (
                  <div key={si} className="flex flex-col gap-3 bg-background rounded-xl border border-foreground/15 p-4">
                    <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                      {step.step_title ? `${step.step_title}` : ""}
                    </p>
                    {step.answers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Tidak ada response tersimpan.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {step.answers.map((ans, ai) => (
                          <div key={ai} className="flex flex-col gap-1">
                            <p className="text-xs font-medium text-foreground/70">{ans.label}</p>
                            {renderAnswerValue(ans.value, ans.type)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body Map Responses */}
          {record.body_map_responses.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Body Map</p>
                {/* <span className="text-xs text-muted-foreground">
                  ({record.body_map_responses.length} respons)
                </span> */}
              </div>
              <div className="flex flex-col gap-3">
                {record.body_map_responses.map((bm, i) => (
                  <div key={i} className="flex flex-col gap-3 bg-background rounded-xl border border-foreground/15 p-4">
                    <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                      Respons {i + 1}
                    </p>
                    {bm.selected_parts.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-medium text-foreground/70">Bagian tubuh dipilih</p>
                        <div className="flex flex-wrap gap-1.5">
                          {bm.selected_parts.map((part, pi) => (
                            <span
                              key={pi}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-foreground/8 border border-foreground/15"
                            >
                              {bodyPartLabelMap.get(part) ?? part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {bm.sensation && (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-foreground/70">Sensasi</p>
                        <p className="text-sm font-medium text-foreground capitalize">{bm.sensation}</p>
                      </div>
                    )}
                    {bm.note && (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-foreground/70">Catatan</p>
                        <div className="bg-foreground/4 rounded-lg px-3 py-2 text-sm text-foreground leading-relaxed">
                          {bm.note}
                        </div>
                      </div>
                    )}
                    {!bm.selected_parts.length && !bm.sensation && !bm.note && (
                      <p className="text-xs text-muted-foreground italic">Tidak ada input body map.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UserOverviewView({ userId }: { userId: string }) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [detailRecord, setDetailRecord] = useState<SessionHistoryRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, created_at")
        .eq("id", userId)
        .single()

      setUser(profile)

      const { data: completionsData } = await supabase
        .from("session_completions")
        .select("id, session_id, session_name, started_at, completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })

      if (!completionsData || completionsData.length === 0) {
        setSessionHistory([])
        setLoading(false)
        return
      }

      const completionIds = completionsData.map((c) => c.id)
      const sessionIds = [...new Set(completionsData.map((c) => c.session_id))]

      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("id, week_number")
        .in("id", sessionIds)

      const sessionMeta = new Map(
        (sessionsData ?? []).map((s) => [s.id, s])
      )

      const { data: formResponsesData } = await supabase
        .from("session_form_responses")
        .select("completion_id, step_id, step_number, responses")
        .in("completion_id", completionIds)

      const { data: bodyMapData } = await supabase
        .from("session_body_map_responses")
        .select("completion_id, step_id, selected_parts, sensation, note")
        .in("completion_id", completionIds)

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

      const stepMap = new Map(
        (stepsData ?? []).map((s) => [s.id, s])
      )

      const formByCompletion = new Map<string, FormStep[]>()
      for (const fr of formResponsesData ?? []) {
        if (!formByCompletion.has(fr.completion_id)) formByCompletion.set(fr.completion_id, [])
        const step = stepMap.get(fr.step_id)
        const questions: { _key: string; label: string; type?: string }[] = step?.step_config?.questions ?? []
        const answers = questions.map((q) => ({
          label: q.label,
          value: (fr.responses as Record<string, string | number | string[] | null>)?.[q._key] ?? null,
          type: q.type,
        }))
        formByCompletion.get(fr.completion_id)!.push({
          step_number: fr.step_number,
          step_title: step?.title ?? null,
          answers,
        })
      }

      const bodyMapByCompletion = new Map<string, BodyMapResponse[]>()
      for (const bm of bodyMapData ?? []) {
        if (!bodyMapByCompletion.has(bm.completion_id)) bodyMapByCompletion.set(bm.completion_id, [])
        bodyMapByCompletion.get(bm.completion_id)!.push({
          selected_parts: bm.selected_parts ?? [],
          sensation: bm.sensation,
          note: bm.note,
        })
      }

      const history: SessionHistoryRecord[] = completionsData.map((c) => ({
        id: c.id,
        session_id: c.session_id,
        session_name: c.session_name,
        week_number: sessionMeta.get(c.session_id)?.week_number ?? null,
        started_at: c.started_at ?? null,
        completed_at: c.completed_at ?? null,
        form_responses: formByCompletion.get(c.id) ?? [],
        body_map_responses: bodyMapByCompletion.get(c.id) ?? [],
      }))

      setSessionHistory(history)
      setLoading(false)
    }

    load()
  }, [userId])

  const uniqueSessions = new Set(sessionHistory.map((r) => r.session_id)).size
  const grouped = groupByDay(sessionHistory, "completed_at")

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
            <span className="text-xs font-medium uppercase tracking-wide">Sesi</span>
          </div>
          <p className="text-2xl font-bold">{uniqueSessions}</p>
          <p className="text-xs text-muted-foreground">telah diselesaikan</p>
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

      {/* Session History Table — grouped by day */}
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
                <TableHead className="w-20 text-center">Week</TableHead>
                <TableHead className="w-40">Mulai</TableHead>
                <TableHead className="w-40">Selesai</TableHead>
                <TableHead className="w-20 text-center">Durasi</TableHead>
                <TableHead className="w-16 text-center">Form</TableHead>
                <TableHead className="w-20 text-center">Body Map</TableHead>
                <TableHead className="w-20 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-14 text-sm">
                    Belum ada riwayat sesi
                  </TableCell>
                </TableRow>
              ) : (
                grouped.map((group) => {
                  return (
                    <>
                      <TableRow key={`day-${group.label}`} className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={9} className="py-1.5 px-4">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {group.label}
                          </span>
                        </TableCell>
                      </TableRow>
                      {group.items.map((r, i) => {
                        const globalIdx = sessionHistory.indexOf(r)
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="text-center text-muted-foreground text-sm">
                              {globalIdx + 1}.
                            </TableCell>
                            <TableCell className="font-medium text-sm">{r.session_name}</TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {r.week_number != null ? `Week ${r.week_number}` : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtClock(r.started_at)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtClock(r.completed_at)}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {fmtDuration(r.started_at, r.completed_at)}
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
                        )
                      })}
                    </>
                  )
                })
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