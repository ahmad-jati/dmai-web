'use client'

import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { StepperExercise } from "@/components/stepper-exercise"
import { StepForm } from "@/components/steps/step-form"
import { fetchSessionBySlug, type SessionData } from "@/lib/data-detail-session.client"
import { notFound } from "next/navigation"
import {
  RepeatIcon, HouseIcon, ClockCountdownIcon,
  CalendarCheckIcon, ClipboardTextIcon, UserIcon,
  BookOpenTextIcon,
} from "@phosphor-icons/react"
import { Route } from "next"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { toast } from 'sonner'
import { fmtLocalTime, fmtDuration } from "@/lib/session-helper"
import { BodyMapRegion } from "@/lib/body-map-region"
import type { FormField } from "@/components/steps/step-form"

type Props = {
  params: Promise<{ slug: string }>
}

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

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function ExerciseLoadingSkeleton() {
  return (
    <div className="w-full">
      <div className="fixed inset-0 z-50 flex items-stretch justify-stretch lg:px-28 2md:px-12 lg:py-14 py-8 px-8 bg-background">
        <div className="flex-1 md:rounded-4xl rounded-xl overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Spinner className="text-muted-foreground"/>
            <p className="text-sm text-muted-foreground">Mempersiapkan sesi...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Post Form Screen ──────────────────────────────────────────────────────────

type PostFormScreenProps = {
  session: SessionData
  postFormStepId: string
  postFormFields: FormField[]
  initialValues?: Record<string, unknown>
  onSubmit: (responses: Record<string, unknown>) => void
}

function PostFormScreen({ session, postFormStepId: _, postFormFields, initialValues, onSubmit }: PostFormScreenProps) {
  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center lg:px-28 px-4 lg:py-14 py-8 bg-background overflow-y-auto">
      <div className="flex flex-col items-center w-full max-w-lg rounded-4xl bg-background border border-border overflow-y-auto flex-1 py-8 px-6 gap-6 my-auto">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">Form Setelah Sesi</p>
          <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold">{session.session_name}</h2>
          <p className="text-sm text-muted-foreground">Bagaimana perasaanmu setelah menyelesaikan sesi ini?</p>
        </div>
        <div className="w-full">
          <StepForm
            fields={postFormFields}
            onNext={onSubmit}
            showPrev={false}
            initialValues={initialValues}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Result Screen ─────────────────────────────────────────────────────────────

type ResultScreenProps = {
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

function ResultScreen({
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
          <div className="flex flex-col items-center gap-3 text-center max-w-lg">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">Sesi Selesai 🎉</p>
            <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold">{session.session_name}</h2>
          </div>

          <div className="2xs:rounded-3xl rounded-xl border border-foreground bg-background dark:border-none dark:p-0 p-2 sm:w-80 xs:h-56 w-full h-36">
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
              { icon: <CalendarCheckIcon className="w-4 h-4" weight="fill" />, label: 'Mulai', val: fmtLocalTime(startedAt) },
              { icon: <CalendarCheckIcon className="w-4 h-4" weight="fill" />, label: 'Selesai', val: fmtLocalTime(completedAt) },
              { icon: <ClockCountdownIcon className="w-4 h-4" weight="fill" />, label: 'Durasi', val: duration !== '—' ? duration : 'Tidak diketahui' },
            ].map(({ icon, label, val }) => (
              <div key={label} className="flex flex-col gap-1 flex-1 bg-foreground/4 rounded-2xl p-4 border border-foreground/10">
                <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-xs font-semibold uppercase tracking-wide">{label}</span></div>
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
              Ulangi Sesi
            </Button>

            <Link href={"/homepage" as Route}>
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Phase = 'exercise' | 'post_form' | 'result'

export default function ExercisePage({ params }: Props) {
  const { slug } = use(params)
  const [session, setSession] = useState<SessionData | null | undefined>(undefined)
  const [phase, setPhase] = useState<Phase>('exercise')
  const [key, setKey] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Store all responses + timing across phases
  const [allResponses, setAllResponses] = useState<Record<string, Record<string, unknown>>>({})
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  useEffect(() => {
    fetchSessionBySlug(slug).then((data) => {
      setSession(data ?? null)
      if (data) setSessionId(data.id)
    })
  }, [slug])

  useEffect(() => {
    if (!sessionId) return
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('dmai_form_draft_') && key !== `dmai_form_draft_${sessionId}`) {
        sessionStorage.removeItem(key)
      }
    }
  }, [sessionId])

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setUserId(data?.user?.id ?? null)
    }
    getUser()
  }, [])

  const handleRepeat = () => {
    setKey((k) => k + 1)
    setPhase('exercise')
    setAllResponses({})
    setStartedAt(null)
    setCompletedAt(null)
    setFeedbackOpen(false)
  }

  // Called when stepper finishes all steps (incl. pre_form, narration, body_map, etc.)
  const handleExerciseDone = async (
    _completionId: string,
    _userId: string,
    formResponses: Record<string, Record<string, unknown>>,
    exerciseStartedAt: string | null
  ) => {
    setAllResponses(formResponses)
    setStartedAt(exerciseStartedAt)

    // Check if there's a post_form step
    const postFormStep = session?.instructions?.find(
      (i: { step_type: string }) => i.step_type === 'post_form'
    )

    if (postFormStep) {
      setPhase('post_form')
    } else {
      // No post form — go straight to save + result
      await persistAndShowResult(formResponses, exerciseStartedAt, {})
    }
  }

  // Called after post form is submitted
  const handlePostFormSubmit = async (postFormResponses: Record<string, unknown>) => {
    const postFormStep = session?.instructions?.find(
      (i: { step_type: string }) => i.step_type === 'post_form'
    )
    if (!postFormStep) return

    const updatedResponses = {
      ...allResponses,
      [postFormStep.id]: postFormResponses,
    }
    setAllResponses(updatedResponses)
    await persistAndShowResult(updatedResponses, startedAt, postFormResponses)
  }

  const persistAndShowResult = async (
    formResponses: Record<string, Record<string, unknown>>,
    exerciseStartedAt: string | null,
    _postFormData: Record<string, unknown>
  ) => {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user || !session) {
      toast.error('Gagal menyimpan sesi.', { duration: 4000 })
      setPhase('result')
      setTimeout(() => setFeedbackOpen(true), 400)
      return
    }

    const now = new Date().toISOString()
    setCompletedAt(now)

    const { data: completion, error: completionError } = await supabase
      .from('session_completions')
      .insert({
        user_id: user.id,
        session_id: session.id,
        session_slug: slug,
        session_name: session.session_name,
        started_at: exerciseStartedAt ?? new Date().toISOString(),
        completed_at: now,
      })
      .select('id')
      .single()

    if (completionError || !completion) {
      console.error('completion insert error:', completionError)
      toast.error('Gagal menyimpan sesi.', { duration: 4000 })
      setPhase('result')
      setTimeout(() => setFeedbackOpen(true), 400)
      return
    }

    const completionId = completion.id
    const formEntries = Object.entries(formResponses)

    if (formEntries.length > 0 && session.instructions) {
      const formRows: {
        completion_id: string; user_id: string; session_id: string
        step_id: string; step_number: number; responses: Record<string, unknown>
      }[] = []

      const bodyMapRows: {
        completion_id: string; user_id: string; step_id: string
        selected_parts: string[]; sensation: string | null; note: string
      }[] = []

      for (const [stepId, stepResponses] of formEntries) {
        const stepInstruction = session.instructions.find(
          (i: { id: string; step_type: string }) => i.id === stepId
        )
        if (stepInstruction?.step_type === 'body_map') {
          bodyMapRows.push({
            completion_id: completionId,
            user_id: user.id,
            step_id: stepId,
            selected_parts: (stepResponses.selected_parts as string[]) ?? [],
            sensation: (stepResponses.sensation as string | null)?.toLowerCase() ?? null,
            note: (stepResponses.note as string) ?? '',
          })
        } else {
          formRows.push({
            completion_id: completionId,
            user_id: user.id,
            session_id: session.id,
            step_id: stepId,
            step_number: stepInstruction?.step ?? 0,
            responses: stepResponses,
          })
        }
      }

      const promises: Promise<void>[] = []
      if (formRows.length > 0) {
        promises.push((async () => {
          const { error } = await supabase.from('session_form_responses').insert(formRows)
          if (error) console.error('form responses insert error:', error)
        })())
      }
      if (bodyMapRows.length > 0) {
        promises.push((async () => {
          const { error } = await supabase.from('session_body_map_responses').insert(bodyMapRows)
          if (error) console.error('body map responses insert error:', error)
        })())
      }
      await Promise.all(promises)
      try { sessionStorage.removeItem(`dmai_form_draft_${session.id}`) } catch {}
    }

    toast.success('Sesi selesai! 🎉', {
      description: `Kamu telah menyelesaikan sesi ${session.session_name}.`,
      duration: 4000,
    })

    setTimeout(() => {
      setPhase('result')
      setTimeout(() => setFeedbackOpen(true), 400)
    }, 300)
  }

  if (session === undefined) return <ExerciseLoadingSkeleton />
  if (session === null) notFound()

  // ── Post Form Phase ────────────────────────────────────────────────────────
  if (phase === 'post_form') {
    const postFormStep = session.instructions?.find(
      (i: { step_type: string }) => i.step_type === 'post_form'
    )
    if (!postFormStep) {
      // Shouldn't happen — fallback
      persistAndShowResult(allResponses, startedAt, {})
      return <ExerciseLoadingSkeleton />
    }
    const config = parseConfig(postFormStep.step_config)
    const fields = ((config.questions ?? config.fields ?? []) as FormField[])

    return (
      <PostFormScreen
        session={session}
        postFormStepId={postFormStep.id}
        postFormFields={fields}
        initialValues={allResponses[postFormStep.id]}
        onSubmit={handlePostFormSubmit}
      />
    )
  }

  // ── Result Phase ───────────────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <ResultScreen
        session={session}
        startedAt={startedAt}
        completedAt={completedAt}
        allResponses={allResponses}
        onRepeat={handleRepeat}
        feedbackOpen={feedbackOpen}
        setFeedbackOpen={setFeedbackOpen}
        userId={userId}
        slug={slug}
      />
    )
  }

  // ── Exercise Phase ─────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <StepperExercise
        key={key}
        instructions={session.instructions}
        sessionId={sessionId ?? ''}
        sessionName={session.session_name}
        sessionSlug={session.slug}
        sessionImageCover={session.image_cover}
        onDone={handleExerciseDone}
      />
    </div>
  )
}