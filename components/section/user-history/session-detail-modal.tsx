'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  XIcon,
  ClockIcon,
  CheckCircleIcon,
  TimerIcon,
  SpinnerIcon,
  WarningCircleIcon,
  UserIcon,
  ClipboardTextIcon,
} from "@phosphor-icons/react"
import { BodyMapRegion } from "@/lib/body-map-region"
import type { FormField, FormFieldType } from "@/components/steps/step-form"
import { formatWITA, calcDuration } from "./user-history"
import type { CompletionRecord } from "./user-history"

// ─── Constants ────────────────────────────────────────────────────────────────

// Session ID yang punya body map step
const BODY_MAP_SESSION_ID = "7257241d-b628-4cf9-9541-d3862537f931"

const EMOJI_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Sangat buruk" },
  2: { emoji: "😕", label: "Buruk" },
  3: { emoji: "😐", label: "Netral" },
  4: { emoji: "🙂", label: "Baik" },
  5: { emoji: "😊", label: "Sangat baik" },
}

// ID → label lookup dari BodyMapRegion
const BODY_PART_LABEL: Record<string, string> = Object.fromEntries(
  BodyMapRegion.map((r) => [r.id, r.label_id])
)

const REGION_LABEL: Record<string, string> = {
  kepala: "Kepala",
  leher_bahu: "Leher & Bahu",
  dada_perut: "Dada & Perut",
  punggung: "Punggung",
  lengan: "Lengan & Tangan",
  kaki: "Kaki",
}

// ─── Types ────────────────────────────────────────────────────────────────────

type StepConfig = {
  fields?: FormField[]
  questions?: FormField[]
}

type SessionStep = {
  id: string
  step_number: number
  title: string | null
  step_type: string
  step_config: StepConfig | null
}

// Kolom real di session_form_responses
type FormResponseRow = {
  id: string
  step_id: string
  responses: Record<string, string | number | string[]>
  created_at: string
}

// Kolom real di session_body_map_responses
type BodyMapResponseRow = {
  id: string
  step_id: string
  selected_parts: string[]
  sensation: string | null
  note: string | null
  created_at: string
}

// Resolved types setelah join session_steps
type ResolvedFormResponse = {
  id: string
  stepTitle: string
  fields: FormField[]
  responses: Record<string, string | number | string[]>
  createdAt: string
}

type GroupedBodyPart = {
  regionLabel: string
  parts: string[]
}

type ResolvedBodyMapResponse = {
  id: string
  stepTitle: string
  grouped: GroupedBodyPart[]
  sensation: string | null
  note: string | null
  createdAt: string
}

type DetailData = {
  formResponses: ResolvedFormResponse[]
  bodyMapResponses: ResolvedBodyMapResponse[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupBodyParts(partIds: string[]): GroupedBodyPart[] {
  const idSet = new Set(partIds)
  const regionMap = new Map<string, string[]>()

  // Preserve BodyMapRegion order
  for (const entry of BodyMapRegion) {
    if (!idSet.has(entry.id)) continue
    const list = regionMap.get(entry.region) ?? []
    list.push(entry.label_id)
    regionMap.set(entry.region, list)
  }

  // Fallback: any IDs not found in BodyMapRegion
  for (const id of partIds) {
    if (!BODY_PART_LABEL[id]) {
      const list = regionMap.get("lainnya") ?? []
      list.push(id)
      regionMap.set("lainnya", list)
    }
  }

  return Array.from(regionMap.entries()).map(([key, parts]) => ({
    regionLabel: REGION_LABEL[key] ?? key,
    parts,
  }))
}

function getFieldKey(field: FormField): string {
  return field._key ?? field.id ?? field.label
}

// ─── Value Renderers ──────────────────────────────────────────────────────────

function renderValue(
  value: string | number | string[],
  type: FormFieldType,
  field: FormField
): React.ReactNode {
  if (type === "emoji_scale") {
    const num = Number(value)
    const entry = EMOJI_MAP[num]
    if (!entry) return <span className="text-sm text-foreground">{String(value)}</span>
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        <span className="text-xl">{entry.emoji}</span>
        <span className="text-foreground">{entry.label}</span>
      </span>
    )
  }

  if (type === "slider") {
    const max = field.max ?? 100
    const min = field.min ?? 1
    return (
      <span className="text-sm font-semibold text-foreground">
        {String(value)}
        <span className="text-xs font-normal text-muted-foreground ml-1">/ {max} (skala {min}–{max})</span>
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
    <p className="text-sm text-foreground bg-foreground/4 rounded-lg px-3 py-2 leading-relaxed mt-0.5">
      {String(value)}
    </p>
  )
}

// Fallback renderer kalau field definition nggak ketemu di step_config
function renderRawValue(value: string | number | string[]): React.ReactNode {
  // Coba deteksi emoji scale: integer 1–5
  if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5) {
    const entry = EMOJI_MAP[value]
    if (entry) {
      return (
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <span className="text-xl">{entry.emoji}</span>
          <span className="text-foreground">{entry.label}</span>
        </span>
      )
    }
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-0.5">
        {value.map((v) => (
          <span key={v} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-foreground/8 border border-foreground/15">
            {v}
          </span>
        ))}
      </div>
    )
  }

  return (
    <p className="text-sm text-foreground bg-foreground/4 rounded-lg px-3 py-2 leading-relaxed mt-0.5">
      {String(value)}
    </p>
  )
}

function FormResponseCard({ response }: { response: ResolvedFormResponse }) {
  console.log(response)
  return (
    <div className="flex flex-col gap-3 bg-background rounded-xl border border-foreground/15 p-4">
      <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
        {response.stepTitle}
      </p>

      {Object.keys(response.responses).length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Tidak ada response tersimpan.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.entries(response.responses).map(([key, value]) => {
            if (value === undefined || value === null || value === "") return null
            // Cari field definition buat label & type, fallback ke raw key
            const field = response.fields.find((f) => getFieldKey(f) === key)
            return (
              <div key={key} className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  {field?.label ?? key}
                </p>
                {field
                  ? renderValue(value, field.type, field)
                  : renderRawValue(value)
                }
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BodyMapCard({ response }: { response: ResolvedBodyMapResponse }) {
  return (
    <div className="flex flex-col gap-3 bg-background rounded-xl border border-foreground/15 p-4">
      <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
        {response.stepTitle}
      </p>

      {response.grouped.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Tidak ada bagian tubuh dipilih.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {response.grouped.map(({ regionLabel, parts }) => (
            <div key={regionLabel} className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {regionLabel}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parts.map((part) => (
                  <span
                    key={part}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-foreground/8 border border-foreground/15"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {response.sensation && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground">Sensasi</p>
          <span className="inline-flex self-start px-2.5 py-1 rounded-full text-xs font-medium bg-foreground text-background">
            {response.sensation}
          </span>
        </div>
      )}

      {response.note && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground">Catatan</p>
          <p className="text-sm text-foreground bg-foreground/4 rounded-lg px-3 py-2 leading-relaxed">
            {response.note}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function SessionDetailModal({
  completion,
  onClose,
}: {
  completion: CompletionRecord
  onClose: () => void
}) {
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const duration = calcDuration(completion.started_at, completion.completed_at)
  const isBodyMapSession = completion.session_id === BODY_MAP_SESSION_ID

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(false)
      try {
        const supabase = createClient()

        // Fetch form + body map responses in parallel
        const [formRes, bodyMapRes] = await Promise.all([
          supabase
            .from("session_form_responses")
            .select("id, step_id, responses, created_at")
            .eq("completion_id", completion.id)
            .order("created_at", { ascending: true }),
          isBodyMapSession
            ? supabase
                .from("session_body_map_responses")
                .select("id, step_id, selected_parts, sensation, note, created_at")
                .eq("completion_id", completion.id)
                .order("created_at", { ascending: true })
            : Promise.resolve({ data: [] }),
        ])

        const formRows = (formRes.data ?? []) as FormResponseRow[]
        const bodyMapRows = (bodyMapRes.data ?? []) as BodyMapResponseRow[]

        // Collect unique step_ids to fetch in one query
        const stepIds = [
          ...formRows.map((r) => r.step_id),
          ...bodyMapRows.map((r) => r.step_id),
        ].filter(Boolean)

        let stepsById = new Map<string, SessionStep>()

        if (stepIds.length > 0) {
          const { data: stepsData } = await supabase
            .from("session_steps")
            .select("id, step_number, title, step_type, step_config")
            .in("id", [...new Set(stepIds)])

          stepsById = new Map(
            ((stepsData ?? []) as SessionStep[]).map((s) => [s.id, s])
          )
        }

        // Resolve form responses with field labels from step_config
        const resolvedForms: ResolvedFormResponse[] = formRows.map((row) => {
          const step = stepsById.get(row.step_id)
          const fields: FormField[] = step?.step_config?.questions ?? step?.step_config?.fields ?? []
          const stepTitle = step?.title
            ? `${step.title}`
            : `Step ${formRows.indexOf(row) + 1}`

          return {
            id: row.id,
            stepTitle,
            fields,
            responses: row.responses,
            createdAt: row.created_at,
          }
        })

        // Resolve body map responses with grouped region labels
        const resolvedBodyMaps: ResolvedBodyMapResponse[] = bodyMapRows.map((row) => {
          const step = stepsById.get(row.step_id)
          const stepTitle = step?.title
            ? `${step.title}`
            : "Body Map"

          return {
            id: row.id,
            stepTitle,
            grouped: groupBodyParts(row.selected_parts ?? []),
            sensation: row.sensation,
            note: row.note ?? null,
            createdAt: row.created_at,
          }
        })

        setData({ formResponses: resolvedForms, bodyMapResponses: resolvedBodyMaps })
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completion.id])

  const hasNoData =
    !loading && !error && data &&
    data.formResponses.length === 0 &&
    data.bodyMapResponses.length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative bg-background dark:bg-secondary w-full max-w-lg max-h-[86vh] rounded-2xl border border-foreground/20 shadow-xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-foreground/10 shrink-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            {/* <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Detail Sesi
            </p> */}
            <h3 className="font-semibold text-h2/5.5 text-foreground">
              {completion.session_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 hover:bg-foreground/8 transition-colors text-muted-foreground hover:text-foreground [&_svg]:w-4 [&_svg]:h-4"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-2 border-b border-foreground/10 shrink-0 bg-foreground/2">
          {duration !== "—" && (
            <div className="flex items-start gap-2.5 p-3 text-sm text-foreground/90">
              <TimerIcon className="w-4 h-4 shrink-0 text-foreground mt-0.5" />
              <p className="leading-tight">
                Kamu mengakses sesi ini selama <span className="font-bold text-foreground text-base mx-0.5">{duration}</span> 
                dari <span className="font-medium whitespace-nowrap">{formatWITA(completion.started_at)}</span> sampai <span className="font-medium whitespace-nowrap">{formatWITA(completion.completed_at)}</span>.
              </p>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <SpinnerIcon className="w-5 h-5 animate-spin" />
              <span className="text-sm">Memuat data...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <WarningCircleIcon className="w-6 h-6 text-destructive/60" />
              <p className="text-sm text-muted-foreground">Gagal memuat detail sesi.</p>
            </div>
          )}

          {hasNoData && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <ClipboardTextIcon className="w-6 h-6 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Tidak ada input yang direkam</p>
              <p className="text-xs text-muted-foreground/70">
                Sesi ini tidak memiliki form atau body map response.
              </p>
            </div>
          )}

          {data && !hasNoData && (
            <div className="flex flex-col gap-6">

              {/* Body Map — hanya sesi tertentu */}
              {data.bodyMapResponses.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Body Map</p>
                    {/* <span className="text-xs text-muted-foreground">
                      ({data.bodyMapResponses.length} respons)
                    </span> */}
                  </div>
                  {data.bodyMapResponses.map((r) => (
                    <BodyMapCard key={r.id} response={r} />
                  ))}
                </div>
              )}

              {/* Form */}
              {data.formResponses.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <ClipboardTextIcon className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Form</p>
                    {/* <span className="text-xs text-muted-foreground">
                      ({data.formResponses.length} respons)
                    </span> */}
                  </div>
                  {data.formResponses.map((r) => (
                    <FormResponseCard key={r.id} response={r} />
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}