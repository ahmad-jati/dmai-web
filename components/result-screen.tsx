'use client'

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { RepeatIcon, HouseIcon } from "@phosphor-icons/react"
import { Route } from "next"
import { fmtLocalTime, fmtDuration } from "@/lib/session-helper"
import { BodyMapRegion } from "@/lib/body-map-region"
import type { FormField } from "@/components/steps/step-form"
import type { SessionData } from "@/lib/data-detail-session.client"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseConfig(config: unknown): Record<string, unknown> {
  if (!config) return {}
  if (typeof config === 'string') { try { return JSON.parse(config) } catch { return {} } }
  if (typeof config === 'object') return config as Record<string, unknown>
  return {}
}

const EMOJI_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Sangat buruk" },
  2: { emoji: "😕", label: "Buruk" },
  3: { emoji: "😐", label: "Netral" },
  4: { emoji: "🙂", label: "Baik" },
  5: { emoji: "😊", label: "Sangat baik" },
}

const REGION_LABEL: Record<string, string> = {
  kepala: "Kepala", leher_bahu: "Leher & Bahu", dada_perut: "Dada & Perut",
  punggung: "Punggung", lengan: "Lengan & Tangan", kaki: "Kaki",
}

function groupBodyParts(partIds: string[]): { regionLabel: string; parts: string[] }[] {
  const idSet = new Set(partIds)
  const regionMap = new Map<string, string[]>()
  for (const entry of BodyMapRegion) {
    if (!idSet.has(entry.id)) continue
    const list = regionMap.get(entry.region) ?? []
    list.push(entry.label_id)
    regionMap.set(entry.region, list)
  }
  return Array.from(regionMap.entries()).map(([key, parts]) => ({
    regionLabel: REGION_LABEL[key] ?? key, parts,
  }))
}

function renderAnswerValue(value: unknown, field?: FormField): React.ReactNode {
  if (value === null || value === undefined || value === '') return null
  if (field?.type === 'emoji_scale') {
    const num = Number(value)
    const entry = EMOJI_MAP[num]
    if (entry) return <span className="inline-flex items-center gap-2 text-sm font-medium"><span className="text-xl">{entry.emoji}</span><span>{entry.label}</span></span>
  }
  if (field?.type === 'slider') {
    const max = field.max ?? 100
    const min = field.min ?? 1
    return <span className="text-sm font-semibold">{String(value)}<span className="text-xs font-normal text-muted-foreground ml-1">/ {max} (skala {min}–{max})</span></span>
  }
  if (Array.isArray(value)) {
    return <div className="flex flex-wrap gap-1.5">{(value as string[]).map((v) => <span key={v} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-foreground/8 border border-foreground/15">{v}</span>)}</div>
  }
  // try emoji scale detection for raw number
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) {
    const entry = EMOJI_MAP[value]
    if (entry) return <span className="inline-flex items-center gap-2 text-sm font-medium"><span className="text-xl">{entry.emoji}</span><span>{entry.label}</span></span>
  }
  return <p className="text-sm bg-foreground/4 rounded-lg px-3 py-2 leading-relaxed">{String(value)}</p>
}

// ─── Result Screen ─────────────────────────────────────────────────────────────

export type ResultScreenProps = {
  session: SessionData
  startedAt: string | null
  completedAt: string | null
  allResponses: Record<string, Record<string, unknown>>
  onRepeat: () => void
  feedbackOpen: boolean
  setFeedbackOpen: (v: boolean) => void
  userId: string | null
  slug: string
}

export function ResultScreen({
  session, startedAt, completedAt, allResponses, onRepeat,
  feedbackOpen, setFeedbackOpen, userId, slug,
}: ResultScreenProps) {
  const duration = fmtDuration(startedAt, completedAt)

  // Separate pre and post form step ids
  const preFormStep = session.instructions?.find(
    (i: { step_type: string }) => i.step_type === 'pre_form'
  )
  const postFormStep = session.instructions?.find(
    (i: { step_type: string }) => i.step_type === 'post_form'
  )
  const bodyMapStep = session.instructions?.find(
    (i: { step_type: string }) => i.step_type === 'body_map'
  )

  const preResponses = preFormStep ? allResponses[preFormStep.id] : undefined
  const postResponses = postFormStep ? allResponses[postFormStep.id] : undefined
  const bodyMapResponses = bodyMapStep ? allResponses[bodyMapStep.id] : undefined

  // Get questions from step config
  function getFields(step: { step_config?: unknown } | undefined): FormField[] {
    if (!step) return []
    const config = parseConfig(step.step_config)
    return ((config.questions ?? config.fields ?? []) as FormField[])
  }


  return (
    <>
      <div className="w-full md:rounded-5xl rounded-xl border border-foreground md:p-8 xs:p-6 p-4 bg-celeste">
        <div className="flex flex-col items-center gap-7">
          {/* Hero */}
          <div className="flex flex-col items-center gap-1 text-center max-w-lg">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">Kamu telah menyelesaikan sesi</p>
            <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold">{session.session_name}</h2>
          </div>

          <div className="2xs:rounded-3xl rounded-xl border border-foreground bg-background dark:border-none dark:p-0 p-2 sm:w-100 sm:h-60 xs:h-56 w-full h-36">
            <Image
              src={session.image_cover}
              alt=""
              width={2000}
              height={2000}
              priority
              className="w-full h-full object-cover 2xs:rounded-xl rounded-md bg-muted-foreground/10"
              unoptimized
            />
          </div>

          {/* Timestamp card */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-2xl">
            {[
              {label: 'Mulai', val: fmtLocalTime(startedAt) },
              {label: 'Selesai', val: fmtLocalTime(completedAt) },
              {label: 'Durasi', val: duration !== '—' ? `${duration} menit` : 'Tidak diketahui' },
            ].map(({label, val }) => (
              <div key={label} className="flex flex-col gap-1 flex-1 bg-foreground/4 rounded-2xl p-4 border border-foreground/10">
                <div className="flex items-center gap-1.5 text-muted-foreground"><span className="text-xs font-semibold uppercase tracking-wide">{label}</span></div>
                <p className="text-sm font-medium text-foreground">{val}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex xs:flex-row flex-col items-center xs:gap-3 gap-2 w-full max-w-xs">
            <Button
              onClick={onRepeat}
              variant="link"
              className="w-full flex items-center gap-2 sm:[&_svg]:size-4 [&_svg]:size-3.5"
            >
              <RepeatIcon weight="fill" />
              Ulangi sesi ini
            </Button>

            <Link href={"/beranda" as Route}>
              <Button
                variant="link"
                className="w-full flex items-center gap-2 sm:[&_svg]:size-4 [&_svg]:size-3.5"
              >
                <HouseIcon weight="fill" />
                Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}