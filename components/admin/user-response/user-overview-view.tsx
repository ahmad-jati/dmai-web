'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeftIcon, ClipboardTextIcon, CheckCircleIcon, CalendarCheckIcon, CaretRightIcon,
} from "@phosphor-icons/react"
import { BodyMapRegion } from "@/lib/body-map-region"
import { fmtLocalTime, fmtDuration, groupByDay, fmtDate } from "@/lib/session-helper"
import type { SessionHistoryRecord, UserProfile, FormStep, BodyMapResponse } from "@/lib/session-helper"

// ─── Constants ───────────────────────────────────────────────────────────────

const bodyPartLabelMap = new Map(BodyMapRegion.map((r) => [r.id, r.label_id]))

// Shared row treatment — same card used everywhere data is listed in this app.
const ROW_CARD =
  "group flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer"

const EMOJI_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Sangat buruk" },
  2: { emoji: "😕", label: "Buruk" },
  3: { emoji: "😐", label: "Netral" },
  4: { emoji: "🙂", label: "Baik" },
  5: { emoji: "😊", label: "Sangat baik" },
}

// ─── Answer renderer ─────────────────────────────────────────────────────────

function renderAnswerValue(value: string | number | string[] | null, type?: string) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic text-sm">Tidak diisi</span>
  }

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
          <div key={i} className="h-24 border border-border bg-white rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 bg-muted rounded w-36" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[60px] bg-muted/50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-14 text-sm text-muted-foreground italic border border-dashed border-border rounded-xl">
      {text}
    </div>
  )
}

// ─── Body Map Panel ──────────────────────────────────────────────────────────

function BodyMapPanel({ bm }: { bm: BodyMapResponse }) {
  return (
    <div className="flex flex-col gap-3">
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
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-foreground/70">Sensasi</p>
        {bm.sensation ? (
          <p className="text-sm font-medium text-foreground capitalize">{bm.sensation}</p>
        ) : (
          <span className="text-muted-foreground italic text-sm">Tidak diisi</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-foreground/70">Catatan</p>
        {bm.note ? (
          <div className="bg-foreground/4 rounded-lg px-3 py-2 text-sm text-foreground leading-relaxed">{bm.note}</div>
        ) : (
          <span className="text-muted-foreground italic text-sm">Tidak diisi</span>
        )}
      </div>
    </div>
  )
}

// ─── Form Step Panel ─────────────────────────────────────────────────────────

// ─── Compact Answer Row ──────────────────────────────────────────────────────
// One question per row instead of a label line + value block — keeps the
// dialog short. Short answers (emoji/slider) sit inline, label left value
// right; long answers (text/chips) still stack since they don't fit a line.

function isInlineAnswer(value: string | number | string[] | null) {
  if (value === null || value === undefined || value === "") return true
  if (Array.isArray(value)) return false
  const num = Number(value)
  return !isNaN(num) && String(value).trim() !== ""
}

function CompactAnswerRow({
  label,
  value,
  type,
  delta,
}: {
  label: string
  value: string | number | string[] | null
  type?: string
  delta?: number | null
}) {
  if (isInlineAnswer(value)) {
    return (
      <div className="flex items-center justify-between gap-3 py-2 border-b border-border/60 last:border-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {renderAnswerValue(value, type)}
          {delta != null && delta !== 0 && (
            <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-foreground/8 text-foreground/60">
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-border/60 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      {renderAnswerValue(value, type)}
    </div>
  )
}

function FormStepPanel({ step }: { step: FormStep }) {
  return (
    <div className="flex flex-col">
      {step.answers.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-1">Tidak ada response tersimpan.</p>
      ) : (
        step.answers.map((ans, ai) => (
          <CompactAnswerRow key={ai} label={ans.label} value={ans.value} type={ans.type} />
        ))
      )}
    </div>
  )
}

// ─── Response Stepper ────────────────────────────────────────────────────────
// Same connected-timeline pattern used in the session detail view — keeps the
// "open a record, see its journey" interaction identical across the app.

type StepperNode = {
  title: string
  content: React.ReactNode
}

function ResponseStepper({ nodes }: { nodes: StepperNode[] }) {
  if (nodes.length === 0) return null
  if (nodes.length === 1) {
    return (
      <div className="flex flex-col gap-2.5">
        <p className="text-sm font-semibold text-foreground">{nodes[0].title}</p>
        <div className="rounded-xl border border-foreground/15 bg-background p-4">
          {nodes[0].content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col">
      {nodes.map((node, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-7 h-7 rounded-full border-2 border-foreground/20 bg-background flex items-center justify-center text-xs font-semibold text-foreground/70">
              {i + 1}
            </div>
            {i < nodes.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
          </div>
          <div className={`flex-1 min-w-0 ${i < nodes.length - 1 ? "pb-5" : ""}`}>
            <p className="text-sm font-semibold text-foreground mb-2">{node.title}</p>
            <div className="rounded-xl border border-foreground/15 bg-background p-4">
              {node.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Pre/Post Compare — side by side ─────────────────────────────────────────
// Pre on the left, post on the right, each column labeled. When a question
// shows up in both with a numeric answer, the post side gets a small delta
// badge so the change is visible without a separate summary block.

function buildDeltaMap(preSteps: FormStep[], postSteps: FormStep[]): Map<string, number> {
  const preAnswers = preSteps.flatMap((s) => s.answers)
  const map = new Map<string, number>()
  for (const post of postSteps.flatMap((s) => s.answers)) {
    const pre = preAnswers.find((a) => a.label === post.label)
    if (!pre || pre.value == null || post.value == null) continue
    if (Array.isArray(pre.value) || Array.isArray(post.value)) continue
    const before = Number(pre.value)
    const after = Number(post.value)
    if (isNaN(before) || isNaN(after)) continue
    map.set(post.label, after - before)
  }
  return map
}

function PrePostCompare({ preSteps, postSteps }: { preSteps: FormStep[]; postSteps: FormStep[] }) {
  const deltaMap = buildDeltaMap(preSteps, postSteps)
  const preAnswers = preSteps.flatMap((s) => s.answers)
  const postAnswers = postSteps.flatMap((s) => s.answers)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex flex-col rounded-xl border border-foreground/15 bg-background p-4">
        <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1">
          {preSteps[0]?.step_title ?? "Pre Form"}
        </p>
        {preAnswers.map((ans, ai) => (
          <CompactAnswerRow key={ai} label={ans.label} value={ans.value} type={ans.type} />
        ))}
      </div>
      <div className="flex flex-col rounded-xl border border-foreground/15 bg-background p-4">
        <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1">
          {postSteps[0]?.step_title ?? "Post Form"}
        </p>
        {postAnswers.map((ans, ai) => (
          <CompactAnswerRow
            key={ai}
            label={ans.label}
            value={ans.value}
            type={ans.type}
            delta={deltaMap.get(ans.label) ?? null}
          />
        ))}
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

  // Same pre/post heuristic as the session detail view — a single session
  // completion can itself contain a pre-form step and a post-form step.
  const preSteps = record.form_responses.filter((s) =>
    s.step_title?.toLowerCase().includes("pre") || s.step_number === 1
  )
  const postSteps = record.form_responses.filter((s) =>
    s.step_title?.toLowerCase().includes("post")
  )
  const hasCompare = preSteps.length > 0 && postSteps.length > 0
  const otherSteps = hasCompare
    ? record.form_responses.filter((s) => !preSteps.includes(s) && !postSteps.includes(s))
    : record.form_responses

  const sortedOther = [...otherSteps].sort((a, b) => a.step_number - b.step_number)
  const nodes: StepperNode[] = [
    ...sortedOther.map((step) => ({
      title: step.step_title ?? `Form ${step.step_number}`,
      content: <FormStepPanel step={step} />,
    })),
    ...record.body_map_responses.map((bm, i) => ({
      title: record.body_map_responses.length > 1 ? `Body Map ${i + 1}` : "Body Map",
      content: <BodyMapPanel bm={bm} />,
    })),
  ]

  const hasAnyData = hasCompare || nodes.length > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record.session_name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1">

          {/* Info waktu — satu baris */}
          <div className="flex items-center gap-3 px-1 text-xs text-muted-foreground flex-wrap">
            {record.started_at && (
              <>
                <span>Mulai <span className="font-medium text-foreground">{fmtLocalTime(record.started_at)}</span></span>
                <span className="text-muted-foreground/40">·</span>
              </>
            )}
            <span>Selesai <span className="font-medium text-foreground">{fmtLocalTime(record.completed_at)}</span></span>
            <span className="text-muted-foreground/40">·</span>
            <span>Durasi <span className="font-semibold text-foreground tabular-nums">{fmtDuration(record.started_at, record.completed_at)}</span></span>
          </div>

          {!hasAnyData ? (
            <p className="text-sm text-muted-foreground text-center py-8 italic">
              Tidak ada response yang tersimpan untuk sesi ini.
            </p>
          ) : (
            <>
              {hasCompare && <PrePostCompare preSteps={preSteps} postSteps={postSteps} />}
              {nodes.length > 0 && <ResponseStepper nodes={nodes} />}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UserOverviewView({
  userId,
}: {
  userId: string
}) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [detailRecord, setDetailRecord] =
  useState<SessionHistoryRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState<boolean>(false)

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

      const sessionMeta = new Map((sessionsData ?? []).map((s) => [s.id, s]))

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

      const stepMap = new Map((stepsData ?? []).map((s) => [s.id, s]))

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

      const history = completionsData.map((c) => ({
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
        <div className="flex flex-col gap-2 p-4 bg-white border border-border rounded-xl">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ClipboardTextIcon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Sesi</span>
          </div>
          <p className="text-2xl font-bold">{uniqueSessions}</p>
          <p className="text-xs text-muted-foreground">telah diselesaikan</p>
        </div>
        <div className="flex flex-col gap-2 p-4 bg-white border border-border rounded-xl">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircleIcon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Selesai</span>
          </div>
          <p className="text-2xl font-bold">{sessionHistory.length}</p>
          <p className="text-xs text-muted-foreground">kali mengikuti sesi</p>
        </div>
        <div className="flex flex-col gap-2 p-4 bg-white border border-border rounded-xl">
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

      {/* Session History — grouped by day, click a row to see its response */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Riwayat Sesi ({sessionHistory.length})
        </h3>

        {grouped.length === 0 ? (
          <EmptyState text="Belum ada riwayat sesi" />
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map((group) => (
              <div key={`day-${group.label}`} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide px-1">
                  {group.label}
                </p>
                <div className="flex flex-col gap-2">
                  {group.items.map((r) => {
                    const hasResponse = r.form_responses.length > 0 || r.body_map_responses.length > 0
                    return (
                      <div
                        key={r.id}
                        onClick={() => { setDetailRecord(r); setDetailOpen(true) }}
                        className={ROW_CARD}
                      >
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-foreground/[0.06] text-xs font-semibold text-foreground/60 shrink-0">
                          {r.session_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.session_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.week_number != null ? `Week ${r.week_number}` : "Tanpa minggu"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground/60 shrink-0 hidden sm:block">
                          {hasResponse
                            ? `${r.form_responses.length} form · ${r.body_map_responses.length} body map`
                            : "Tidak ada response"}
                        </span>
                        <CaretRightIcon className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SessionDetailDialog
        record={detailRecord}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRecord(null) }}
      />
    </div>
  )
}