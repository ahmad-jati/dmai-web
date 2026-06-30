'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  ArrowLeftIcon,
  ClipboardTextIcon,
  CheckCircleIcon,
  CalendarCheckIcon,
  ClockIcon,
} from "@phosphor-icons/react"
import { BodyMapRegion } from "@/lib/body-map-region"
import { fmtLocalTime, fmtDuration, groupByDay, fmtDate } from "@/lib/session-helper"
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

// ─── Answer renderers ─────────────────────────────────────────────────────────

function renderAnswerValue(value: string | number | string[] | null, type?: string) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic text-xs">—</span>
  }
  const num = Number(value)
  const isNumeric = !Array.isArray(value) && !isNaN(num) && String(value).trim() !== ""
  const isEmoji = type === "emoji_scale" || (!type && isNumeric && Number.isInteger(num) && num >= 1 && num <= 5)
  const isSlider = type === "slider" || (!type && isNumeric && !isEmoji)

  if (isEmoji) {
    const entry = EMOJI_MAP[num]
    if (entry) return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium">
        <span className="text-lg leading-none">{entry.emoji}</span>
        <span>{entry.label}</span>
      </span>
    )
  }
  if (isSlider) return (
    <span className="text-sm font-semibold">
      {String(value)}<span className="text-xs font-normal text-muted-foreground ml-1">/ 100</span>
    </span>
  )
  if (Array.isArray(value)) return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {value.map((v) => (
        <span key={v} className="px-2 py-0.5 rounded-full text-xs bg-foreground/8 border border-foreground/12">{v}</span>
      ))}
    </div>
  )
  return <p className="text-sm leading-relaxed">{String(value)}</p>
}

function isInlineAnswer(value: string | number | string[] | null) {
  if (value === null || value === undefined || value === "") return true
  if (Array.isArray(value)) return false
  return !isNaN(Number(value)) && String(value).trim() !== ""
}

function CompactAnswerRow({
  label, value, type, delta,
}: {
  label: string
  value: string | number | string[] | null
  type?: string
  delta?: number | null
}) {
  if (isInlineAnswer(value)) {
    return (
      <div className="flex flex-col items-start justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
        <span className="text-sm font-medium text-muted-foreground shrink-0 leading-tight">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {renderAnswerValue(value, type)}
          {delta != null && delta !== 0 && (
            <span className="text-xs font-semibold px-1 py-0.5 rounded bg-foreground/8 text-foreground/60 tabular-nums">
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1 py-1.5 border-b border-border/50 last:border-0 font-medium">
      <span className="text-xs text-muted-foreground">{label}</span>
      {renderAnswerValue(value, type)}
    </div>
  )
}

// ─── Pre/Post side-by-side ────────────────────────────────────────────────────

function buildDeltaMap(preSteps: FormStep[], postSteps: FormStep[]): Map<string, number> {
  const preAnswers = preSteps.flatMap((s) => s.answers)
  const map = new Map<string, number>()
  for (const post of postSteps.flatMap((s) => s.answers)) {
    const pre = preAnswers.find((a) => a.label === post.label)
    if (!pre || pre.value == null || post.value == null) continue
    if (Array.isArray(pre.value) || Array.isArray(post.value)) continue
    const before = Number(pre.value), after = Number(post.value)
    if (!isNaN(before) && !isNaN(after)) map.set(post.label, after - before)
  }
  return map
}

function PrePostColumns({ preSteps, postSteps }: { preSteps: FormStep[]; postSteps: FormStep[] }) {
  const deltaMap = buildDeltaMap(preSteps, postSteps)
  const preAnswers = preSteps.flatMap((s) => s.answers)
  const postAnswers = postSteps.flatMap((s) => s.answers)
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col rounded-lg border border-foreground/12 p-3">
        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">
          {preSteps[0]?.step_title ?? "Pre Form"}
        </p>
        {preAnswers.map((ans, i) => (
          <CompactAnswerRow key={i} label={ans.label} value={ans.value} type={ans.type} />
        ))}
      </div>
      <div className="flex flex-col rounded-lg border border-foreground/12 p-3">
        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">
          {postSteps[0]?.step_title ?? "Post Form"}
        </p>
        {postAnswers.map((ans, i) => (
          <CompactAnswerRow
            key={i} label={ans.label} value={ans.value} type={ans.type}
            delta={deltaMap.get(ans.label) ?? null}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Body Map section ────────────────────────────────────────────────────────

function BodyMapSection({ bm }: { bm: BodyMapResponse }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-foreground/12 p-3">
      <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Body Map</p>
      {bm.selected_parts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bm.selected_parts.map((part, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-foreground/8 border border-foreground/12">
              {bodyPartLabelMap.get(part) ?? part}
            </span>
          ))}
        </div>
      )}
      {bm.sensation && (
        <p className="text-xs"><span className="text-muted-foreground">Sensasi </span><span className="font-medium capitalize">{bm.sensation}</span></p>
      )}
      {bm.note && <p className="text-xs text-foreground/80 bg-foreground/4 rounded px-2 py-1.5 leading-relaxed">{bm.note}</p>}
    </div>
  )
}

// ─── Response Panel — right column ───────────────────────────────────────────

function ResponsePanel({ record }: { record: SessionHistoryRecord }) {
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
  const hasAny = hasCompare || sortedOther.length > 0 || record.body_map_responses.length > 0

  if (!hasAny) {
    return (
      <div className="flex py-4 items-center justify-center h-full text-sm text-muted-foreground italic">
        Tidak ada response tersimpan
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {hasCompare && <PrePostColumns preSteps={preSteps} postSteps={postSteps} />}
      {sortedOther.map((step, i) => (
        <div key={i} className="flex flex-col rounded-lg bg-white border border-foreground/12 p-3">
          <p className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">
            {step.step_title ?? `Form ${step.step_number}`}
          </p>
          {step.answers.map((ans, ai) => (
            <CompactAnswerRow key={ai} label={ans.label} value={ans.value} type={ans.type} />
          ))}
        </div>
      ))}
      {record.body_map_responses.map((bm, i) => (
        <BodyMapSection key={i} bm={bm} />
      ))}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 bg-muted rounded-sm" />
        <div className="flex flex-col gap-1">
          <div className="h-5 bg-muted rounded w-36" />
          <div className="h-3 bg-muted/60 rounded w-52" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted/50 rounded-xl border border-border" />)}
      </div>
      <div className="flex border border-border rounded-xl overflow-hidden h-[500px]">
        <div className="w-56 border-r border-border p-3 flex flex-col gap-2">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-11 bg-muted/50 rounded-lg" />)}
        </div>
        <div className="w-48 border-r border-border p-3 flex flex-col gap-2">
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted/60 rounded w-1/2" />
        </div>
        <div className="flex-1 p-3 flex flex-col gap-3">
          <div className="h-28 bg-muted/40 rounded-lg" />
          <div className="h-20 bg-muted/40 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function getInitials(fullName: string | null, email: string) {
  const source = (fullName ?? "").trim() || email
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UserOverviewView({ userId }: { userId: string }) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

      if (!completionsData?.length) { setSessionHistory([]); setLoading(false); return }

      const completionIds = completionsData.map((c) => c.id)
      const sessionIds = [...new Set(completionsData.map((c) => c.session_id))]

      const [{ data: sessionsData }, { data: formResponsesData }, { data: bodyMapData }] = await Promise.all([
        supabase.from("sessions").select("id, week_number").in("id", sessionIds),
        supabase.from("session_form_responses").select("completion_id, step_id, step_number, responses").in("completion_id", completionIds),
        supabase.from("session_body_map_responses").select("completion_id, step_id, selected_parts, sensation, note").in("completion_id", completionIds),
      ])

      const sessionMeta = new Map((sessionsData ?? []).map((s) => [s.id, s]))

      const stepIds = [...new Set([
        ...(formResponsesData ?? []).map((r) => r.step_id),
        ...(bodyMapData ?? []).map((r) => r.step_id),
      ])]

      const { data: stepsData } = stepIds.length > 0
        ? await supabase.from("session_steps").select("id, title, step_config").in("id", stepIds)
        : { data: [] }

      const stepMap = new Map((stepsData ?? []).map((s) => [s.id, s]))

      const formByCompletion = new Map<string, FormStep[]>()
      for (const fr of formResponsesData ?? []) {
        if (!formByCompletion.has(fr.completion_id)) formByCompletion.set(fr.completion_id, [])
        const step = stepMap.get(fr.step_id)
        const questions: { _key: string; label: string; type?: string }[] = step?.step_config?.questions ?? []
        formByCompletion.get(fr.completion_id)!.push({
          step_number: fr.step_number,
          step_title: step?.title ?? null,
          answers: questions.map((q) => ({
            label: q.label,
            value: (fr.responses as Record<string, string | number | string[] | null>)?.[q._key] ?? null,
            type: q.type,
          })),
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
      if (history.length > 0) setSelectedId(history[0].id)
      setLoading(false)
    }
    load()
  }, [userId])

  const selected = sessionHistory.find((r) => r.id === selectedId) ?? null
  const grouped = groupByDay(sessionHistory, "completed_at")
  const uniqueSessions = new Set(sessionHistory.map((r) => r.session_id)).size

  if (loading) return <Skeleton />

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-3">
          <Button
            variant="link" 
            size="sm"
            className="rounded-sm gap-1.5 [&_svg]:size-3.5 mt-0.5 shrink-0"
            onClick={() => router.push("/admin/user-responses")}
          >
            <ArrowLeftIcon />
            Kembali
          </Button>
        </div>
        <div className="pl-7 min-w-0 flex flex-row-reverse items-center gap-4">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-muted text-background`}>
            {getInitials(user?.full_name ?? null, user?.email ?? '')}
          </div>
          <div>
            <h2 className="text-xl text-right font-semibold leading-tight truncate">{user?.full_name ?? "—"}</h2>
            <p className="text-xs text-muted-foreground">
              {user?.email}{user?.created_at ? ` · Terdaftar ${fmtDate(user.created_at)}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* 3-column panel */}
      <div className="flex border border-border rounded-xl overflow-hidden bg-background" style={{ height: "calc(100vh - 124px)", minHeight: 440 }}>

        {/* ── Col 1: Session list ───────────────────────────────────────── */}
        <div className="w-66 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Riwayat ({sessionHistory.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {grouped.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-8">Belum ada riwayat</p>
            ) : (
              grouped.map((group) => (
                <div key={group.label}>
                  <div className="px-3 py-1.5 bg-muted border-b border-border/50 sticky top-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
                  </div>
                  {group.items.map((r) => {
                    const isActive = r.id === selectedId
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-border/40 transition-colors hover:bg-muted/40 ${isActive ? "bg-muted/40" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate text-foreground`}>
                            {r.session_name}
                          </p>
                          <p className={`text-xs truncate text-muted-foreground`}>
                            {fmtLocalTime(r.completed_at)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Col 2: Response content ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detail Sesi</p>
          </div>
          <div className="h-fit">
            {!selected ? (
              <p className="text-xs text-muted-foreground italic text-center py-8">Pilih sesi</p>
            ) : (
              <div className="p-3 flex flex-col gap-3">
                <div className="pt-1">
                  <p className="text-xl font-semibold leading-tight">{selected.session_name}</p>
                </div>
                <div className={`flex gap-10 rounded-lg text-sm`}>
                  {selected.started_at && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground shrink-0">Mulai</span>
                      <span className="font-medium text-right">{fmtLocalTime(selected.started_at)}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground shrink-0">Selesai</span>
                    <span className="font-medium text-right">{fmtLocalTime(selected.completed_at)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground shrink-0">
                      Durasi
                    </span>
                    <span className="font-medium tabular-nums">{fmtDuration(selected.started_at, selected.completed_at)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground shrink-0">
                      Form Response
                    </span>
                    <span className="font-medium text-foreground">{selected.form_responses.length}</span>
                  </div>
                  {
                    selected.body_map_responses.length>0 && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground">Body maps</span>
                        <span className="">{selected.body_map_responses.length}</span>
                      </div>
                    )
                  }
                </div>
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</p>
          </div>
          <div className="">
            {!selected ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
                Pilih sesi untuk melihat response
              </div>
            ) : (
              <ResponsePanel record={selected} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}