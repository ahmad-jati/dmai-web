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
import type { CompletionRecord } from "./user-dashboard"

// ─── Types ────────────────────────────────────────────────────────────────────

type FormResponse = {
  id: string
  step_id: string
  session_id: string
  responses: Record<string, unknown>
}

type BodyMapResponse = {
  id: string
  step_id: string
  selected_parts: string[]
  sensation: Record<string, number> | null
  notes: string | null
}

type DetailData = {
  formResponses: FormResponse[]
  bodyMapResponses: BodyMapResponse[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s} detik`
  if (s === 0) return `${m} menit`
  return `${m} menit ${s} detik`
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Body Map Display ─────────────────────────────────────────────────────────

function BodyMapCard({ response }: { response: BodyMapResponse }) {
  const regions = response.selected_parts ?? []
  const intensity = response.sensation ?? {}

  return (
    <div className="flex flex-col gap-3 bg-background rounded-xl border border-foreground/15 p-4">
      <div className="flex items-center gap-2">
        <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-semibold text-foreground">
          {response.step_title ? `Step: ${response.step_title}` : `Step ${response.step_number}`}
        </p>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDatetime(response.submitted_at)}
        </span>
      </div>

      {regions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Tidak ada region dipilih.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-medium">Region yang dipilih:</p>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => {
              const lvl = intensity[region]
              return (
                <span
                  key={region}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-foreground/8 border border-foreground/15"
                >
                  {region}
                  {lvl != null && (
                    <span className="text-muted-foreground">· {lvl}/10</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {response.notes && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">Catatan:</p>
          <p className="text-sm text-foreground bg-foreground/4 rounded-lg px-3 py-2 leading-relaxed">
            {response.notes}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Form Response Display ────────────────────────────────────────────────────

function FormResponseCard({ response }: { response: FormResponse }) {
  const entries = Object.entries(response.responses ?? {})

  return (
    <div className="flex flex-col gap-3 bg-background rounded-xl border border-foreground/15 p-4">
      <div className="flex items-center gap-2">
        <ClipboardTextIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-semibold text-foreground">
          {response.step_title ? `Step: ${response.step_title}` : `Step ${response.step_number}`}
        </p>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDatetime(response.submitted_at)}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Tidak ada input.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-muted-foreground">{humanizeKey(key)}</p>
              {Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1.5">
                  {value.map((v, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-xs bg-foreground/8 border border-foreground/15 font-medium"
                    >
                      {String(v)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground bg-foreground/4 rounded-lg px-3 py-2 leading-relaxed">
                  {String(value)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    // Close on Escape
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true)
      setError(false)
      try {
        const supabase = createClient()

        const [formRes, bodyMapRes] = await Promise.all([
          supabase
            .from("session_form_responses")
            .select("id, step_id, session_id, responses")
            .eq("completion_id", completion.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("session_body_map_responses")
            .select("id, step_id, selected_parts, sensation, notes")
            .eq("completion_id", completion.id)
            .order("created_at", { ascending: true }),
        ])

        console.log(formRes)
        console.log(bodyMapRes)

        setData({
          formResponses: (formRes.data ?? []) as FormResponse[],
          bodyMapResponses: (bodyMapRes.data ?? []) as BodyMapResponse[],
        })
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [completion.id])

  const hasNoData =
    !loading &&
    !error &&
    data &&
    data.formResponses.length === 0 &&
    data.bodyMapResponses.length === 0

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div className="relative bg-background dark:bg-secondary w-full max-w-lg max-h-[90vh] rounded-2xl border border-foreground/20 shadow-xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-foreground/10 shrink-0">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Detail Sesi
            </p>
            <h3 className="font-semibold text-base/5 text-foreground truncate">
              {completion.session_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 hover:bg-foreground/8 transition-colors [&_svg]:size-4 text-muted-foreground hover:text-foreground"
          >
            <XIcon />
          </button>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-foreground/10 shrink-0">
          {completion.started_at && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ClockIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-medium">
                Mulai: {formatDatetime(completion.started_at)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircleIcon className="w-3.5 h-3.5 shrink-0 text-green-500" />
            <span className="text-xs font-medium">
              Selesai: {formatDatetime(completion.completed_at)}
            </span>
          </div>
          {completion.duration_seconds != null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TimerIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-medium">
                Durasi: {formatDuration(completion.duration_seconds)}
              </span>
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
              <p className="text-sm font-medium text-muted-foreground">
                Tidak ada input yang direkam
              </p>
              <p className="text-xs text-muted-foreground/70">
                Sesi ini tidak memiliki form atau body map response.
              </p>
            </div>
          )}

          {data && !hasNoData && (
            <div className="flex flex-col gap-6">
              {/* Body Map Responses */}
              {data.bodyMapResponses.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Body Map</p>
                    <span className="text-xs text-muted-foreground">
                      ({data.bodyMapResponses.length} respons)
                    </span>
                  </div>
                  {data.bodyMapResponses.map((r) => (
                    <BodyMapCard key={r.id} response={r} />
                  ))}
                </div>
              )}

              {/* Form Responses */}
              {data.formResponses.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <ClipboardTextIcon className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Form Responses</p>
                    <span className="text-xs text-muted-foreground">
                      ({data.formResponses.length} respons)
                    </span>
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
