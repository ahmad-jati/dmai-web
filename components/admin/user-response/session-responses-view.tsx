'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  ClockIcon,
  UserIcon,
} from "@phosphor-icons/react"
import { BodyMapRegion } from "@/lib/body-map-region"
import { fmtLocalTime, fmtDuration, groupByDay } from "@/lib/session-helper"
import type { CompletionRecord, SessionInfo, FormStep, BodyMapResponse } from "@/lib/session-helper"
import Link from "next/link"
import { Route } from "next"

// ─── Constants ───────────────────────────────────────────────────────────────

const bodyPartLabelMap = new Map(BodyMapRegion.map((r) => [r.id, r.label_id]))

const EMOJI_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Sangat buruk" },
  2: { emoji: "😕", label: "Buruk" },
  3: { emoji: "😐", label: "Netral" },
  4: { emoji: "🙂", label: "Baik" },
  5: { emoji: "😊", label: "Sangat baik" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(fullName: string | null, email: string) {
  const source = (fullName ?? "").trim() || email
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
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
        <span className="text-xs text-muted-foreground shrink-0 leading-tight">{label}</span>
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
    <div className="flex flex-col gap-1 py-1.5 border-b border-border/50 last:border-0">
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
      <div className="flex gap-4 text-xs">
        {bm.sensation && (
          <span><span className="text-muted-foreground">Sensasi </span><span className="font-medium capitalize">{bm.sensation}</span></span>
        )}
      </div>
      {bm.note && <p className="text-xs text-foreground/80 bg-foreground/4 rounded px-2 py-1.5 leading-relaxed">{bm.note}</p>}
    </div>
  )
}

// ─── Response Panel — right column ───────────────────────────────────────────

function ResponsePanel({ record }: { record: CompletionRecord }) {
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
      <div className="py-4 flex items-center justify-center h-full text-sm text-muted-foreground italic">
        Tidak ada response tersimpan
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {hasCompare && <PrePostColumns preSteps={preSteps} postSteps={postSteps} />}
      {sortedOther.map((step, i) => (
        <div key={i} className="flex flex-col rounded-lg border border-foreground/12 p-3">
          <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">
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
        <div className="h-5 bg-muted rounded w-48" />
      </div>
      <div className="flex border border-border rounded-xl overflow-hidden h-[600px]">
        <div className="w-60 border-r border-border flex flex-col gap-2 p-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-lg" />)}
        </div>
        <div className="w-56 border-r border-border p-3 flex flex-col gap-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted/60 rounded w-1/2" />
        </div>
        <div className="flex-1 p-3 flex flex-col gap-3">
          <div className="h-32 bg-muted/40 rounded-lg" />
          <div className="h-20 bg-muted/40 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SessionResponsesView({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [completions, setCompletions] = useState<CompletionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, session_name, week_number")
        .eq("id", sessionId)
        .single()
      setSession(sessionData)

      const { data: completionsData } = await supabase
        .from("session_completions")
        .select("id, user_id, session_name, started_at, completed_at")
        .eq("session_id", sessionId)
        .order("completed_at", { ascending: false })

      if (!completionsData?.length) { setCompletions([]); setLoading(false); return }

      const userIds = [...new Set(completionsData.map((c) => c.user_id))]
      const completionIds = completionsData.map((c) => c.id)

      const [{ data: profiles }, { data: formResponsesData }, { data: bodyMapData }] = await Promise.all([
        supabase.from("user_profiles").select("id, email, full_name").in("id", userIds),
        supabase.from("session_form_responses").select("id, step_id, step_number, session_id, responses, completion_id").in("completion_id", completionIds),
        supabase.from("session_body_map_responses").select("id, step_id, selected_parts, sensation, note, completion_id").in("completion_id", completionIds),
      ])

      const stepIds = [...new Set([
        ...(formResponsesData ?? []).map((r) => r.step_id),
        ...(bodyMapData ?? []).map((r) => r.step_id),
      ])]

      const { data: stepsData } = stepIds.length > 0
        ? await supabase.from("session_steps").select("id, title, step_config").in("id", stepIds)
        : { data: [] }

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
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

      const merged: CompletionRecord[] = completionsData.map((c) => ({
        id: c.id,
        user_id: c.user_id,
        started_at: c.started_at,
        completed_at: c.completed_at,
        full_name: profileMap.get(c.user_id)?.full_name ?? null,
        email: profileMap.get(c.user_id)?.email ?? "—",
        form_responses: formByCompletion.get(c.id) ?? [],
        body_map_responses: bodyMapByCompletion.get(c.id) ?? [],
      }))

      setCompletions(merged)
      // Auto-select first record
      if (merged.length > 0) setSelectedId(merged[0].id)
      setLoading(false)
    }
    load()
  }, [sessionId])

  const selected = completions.find((c) => c.id === selectedId) ?? null
  const grouped = groupByDay(completions, "completed_at")

  if (loading) return <Skeleton />

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex flex-col items-start gap-3">
        <Button
          variant="link" 
          size="sm"
          className="rounded-sm gap-1.5 [&_svg]:size-3.5 shrink-0"
          onClick={() => router.push("/admin/user-responses")}
        >
          <ArrowLeftIcon />
          Kembali
        </Button>
        <div className="pl-7">
          <h2 className="text-xl font-semibold leading-tight">{session?.session_name ?? "Sesi"}</h2>
          <p className="text-xs text-muted-foreground">{completions.length} penyelesaian</p>
        </div>
      </div>

      {/* 3-column panel */}
      <div className="flex border border-border rounded-xl overflow-hidden bg-background" style={{ height: "calc(100vh - 160px)", minHeight: 480 }}>

        {/* ── Col 1: User list ─────────────────────────────────────────── */}
        <div className="w-70 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Peserta ({completions.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {grouped.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-8">Belum ada penyelesaian</p>
            ) : (
              grouped.map((group) => (
                <div key={group.label}>
                  <div className="px-3 py-1.5 bg-muted/20 border-b border-border/50 sticky top-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
                  </div>
                  {group.items.map((c) => {
                    const isActive = c.id === selectedId
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-border/40 transition-colors hover:bg-muted/40 ${isActive ? "bg-muted/40" : ""}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-2xs font-bold shrink-0 bg-muted-foreground/50 text-background`}>
                          {getInitials(c.full_name, c.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate text-foreground`}>
                            {c.full_name ?? <span className="italic opacity-60">Tanpa nama</span>}
                          </p>
                          <p className={`text-xs truncate text-muted-foreground`}>
                            {fmtLocalTime(c.completed_at)}
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

        {/* ── Col 3: Response content ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <div className="w-full shrink-0 border-r border-border flex flex-col">
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Info Peserta</p>
            </div>
            <div className="">
              {!selected ? (
                <p className="text-xs text-muted-foreground italic text-center py-8">Pilih peserta</p>
              ) : (
                <div className="p-3 flex items-center justify-between">
                  <Link
                    href={`/admin/user-responses/${selected.user_id}` as Route}
                    className="flex items-center gap-2 pt-2 pb-1 group hover:cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-foreground/8 flex items-center justify-center text-sm font-bold text-foreground/60">
                      {getInitials(selected.full_name, selected.email)}
                    </div>
                    <div className="text-center">
                      <p className="flex items-center  text-sm group-hover:underline underline-offset-2 font-semibold leading-tight">
                        {selected.full_name ?? "—"}
                        <span className="hidden group-hover:inline ml-2">
                          <ArrowSquareOutIcon />
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground break-all">{selected.email}</p>
                    </div>
                  </Link>

                  {/* Time meta */}
                  <div className="flex flex-row gap-10 rounded-lg bg-muted/30 px-4 py-2.5 text-xs">
                    <div className="flex flex-col justify-between">
                      <span className="text-muted-foreground">Mulai</span>
                      <span className="font-medium">{fmtLocalTime(selected.started_at)}</span>
                    </div>
                    <div className="flex flex-col justify-between">
                      <span className="text-muted-foreground">Selesai</span>
                      <span className="font-medium">{fmtLocalTime(selected.completed_at)}</span>
                    </div>
                    <div className="flex flex-col justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">Durasi</span>
                      <span className="font-semibold tabular-nums">{fmtDuration(selected.started_at, selected.completed_at)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</p>
          </div>
          <div className="">
            {!selected ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
                Pilih peserta untuk melihat response
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