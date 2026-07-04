'use client'

import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { StepperExercise } from "@/components/stepper-exercise"
import { fetchSessionBySlug, type SessionData } from "@/lib/data-detail-session.client"
import { notFound } from "next/navigation"
import { RepeatIcon, HouseIcon } from "@phosphor-icons/react"
import { Route } from "next"
import { createClient } from "@/lib/supabase/client"
import { SessionLoadingCard } from "@/components/session-loading-card"
import { toast } from 'sonner'
import { fmtLocalTime, fmtDuration } from "@/lib/session-helper"
import { cn } from "@/lib/utils"

type Props = {
  params: Promise<{ slug: string }>
}

// ─── Result Screen ─────────────────────────────────────────────────────────────
type ResultScreenProps = {
  session: SessionData
  startedAt: string | null
  completedAt: string | null
  allResponses: Record<string, Record<string, unknown>>
  onRepeat: () => void
  userId: string | null
  slug: string
}

function ResultScreen({
  session, startedAt, completedAt, onRepeat
}: ResultScreenProps) {
  const duration = fmtDuration(startedAt, completedAt)

  return (
    <div className="w-full md:rounded-5xl rounded-xl border border-foreground md:p-8 xs:p-6 p-4 bg-celeste">
      <div className="flex flex-col items-center justify-center gap-7  w-full">
        <div className="flex flex-col items-center gap-1 text-center max-w-lg">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Kamu telah menyelesaikan sesi</p>
          <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold">{session.session_name}</h2>
        </div>

        <div className="2xs:rounded-3xl rounded-xl border border-foreground bg-background dark:border-none dark:p-0 p-2 sm:w-100 sm:h-60 xs:h-76 w-full h-46">
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

        <div className="grid xs:grid-cols-3 grid-cols-1  gap-3 w-full max-w-2xl ">
          {[
            {label: 'Mulai', val: fmtLocalTime(startedAt) },
            {label: 'Selesai', val: fmtLocalTime(completedAt) },
            {label: 'Durasi', val: duration !== '—' ? `${duration} menit` : 'Tidak diketahui' },
          ].map(({label, val }, i) => (
            <div
              key={label}
              className={cn(
                'flex flex-col sm:items-start items-center gap-1 flex-1 bg-foreground/4 rounded-2xl p-4 border border-foreground/10 w-full',
                i === 2 && 'col-span-1'
              )}
            >
              <div className="flex items-center gap-1.5 text-muted-foreground"><span className="text-xs font-semibold uppercase tracking-wide">{label}</span></div>
              <p className="text-sm font-medium text-foreground xs:text-left text-center">{val}</p>
            </div>
          ))}
        </div>

        <div className="flex xs:flex-row flex-col-reverse items-center justify-center xs:gap-3 gap-2 w-full max-w-xs">
          <Button
            onClick={onRepeat}
            variant="link"
            className="w-fit flex items-center gap-2 sm:[&_svg]:size-4 [&_svg]:size-3.5"
          >
            <RepeatIcon weight="fill" />
            Ulangi sesi ini
          </Button>

          <Link href={"/beranda" as Route}>
            <Button 
              variant="ghost" 
              className="w-fit flex items-center gap-2 sm:[&_svg]:size-4 [&_svg]:size-3.5 bg-foreground text-background hover:bg-foreground/80 rounded-lg h-8"
            >
              <HouseIcon weight="fill" />
              Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Phase = 'exercise' | 'result'

export default function ExercisePage({ params }: Props) {
  const { slug } = use(params)
  const [session, setSession] = useState<SessionData | null | undefined>(undefined)
  const [phase, setPhase] = useState<Phase>('exercise')
  const [key, setKey] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const [allResponses, setAllResponses] = useState<Record<string, Record<string, unknown>>>({})
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  const [reminderOpen, setReminderOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setUserId(data?.user?.id ?? null)
    }
    getUser()
  }, [])

  useEffect(() => {
    fetchSessionBySlug(slug, userId ?? undefined).then((data) => {
      setSession(data ?? null)
      if (data) setSessionId(data.id)
    })
  }, [slug, userId])

  useEffect(() => {
    if (!sessionId) return
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('dmai_form_draft_') && key !== `dmai_form_draft_${sessionId}`) {
        sessionStorage.removeItem(key)
      }
    }
  }, [sessionId])

  useEffect(() => {
    if (phase !== 'result') return
    if (!session?.access?.show_reminder) return

    const t = setTimeout(() => setReminderOpen(true), 500)
    return () => clearTimeout(t)
  }, [session, phase])

  const handleRepeat = () => {
    setKey((k) => k + 1)
    setPhase('exercise')
    setAllResponses({})
    setStartedAt(null)
    setCompletedAt(null)
    setReminderOpen(false)
  }

  const handleExerciseDone = async (
    _completionId: string,
    _userId: string,
    formResponses: Record<string, Record<string, unknown>>,
    exerciseStartedAt: string | null
  ) => {
    setAllResponses(formResponses)
    setStartedAt(exerciseStartedAt)
    await persistAndShowResult(formResponses, exerciseStartedAt)
  }

  const persistAndShowResult = async (
    formResponses: Record<string, Record<string, unknown>>,
    exerciseStartedAt: string | null,
  ) => {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user || !session) {
      toast.error('Gagal menyimpan sesi', {
        description: 'Progres kamu mungkin gak tersimpan. Coba lagi atau hubungi Admin kalau masalah berlanjut.',
        duration: 5000,
      })
      setPhase('result')
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
        status: 'completed',
      })
      .select('id')
      .single()

    if (completionError || !completion) {
      console.error('completion insert error:', completionError)
      toast.error('Gagal menyimpan sesi', {
        description: 'Progres kamu mungkin gak tersimpan. Coba lagi atau hubungi Admin kalau masalah berlanjut.',
        duration: 5000,
      })
      setPhase('result')
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

    const refreshed = await fetchSessionBySlug(slug, user.id)
    if (refreshed) setSession(refreshed)

    setTimeout(() => {
      setPhase('result')
    }, 300)
  }

  if (session === undefined) return <SessionLoadingCard label="Memuat sesi…" />
  if (session === null) notFound()

  // ── Result Phase ───────────────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div className="w-full">
        <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
          <DialogContent className="max-w-sm!">
            <DialogHeader>
              <DialogTitle>Pengingat</DialogTitle>
              <DialogDescription>
                Kamu bisa akses sesi ini <span className="font-semibold text-foreground">{session.access?.remaining_access ?? 0} kali</span> lagi sampai minggu depan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                onClick={() => setReminderOpen(false)}
                size={'sm'}
                variant={'secondary'}
              >
                Mengerti
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ResultScreen
          session={session}
          startedAt={startedAt}
          completedAt={completedAt}
          allResponses={allResponses}
          onRepeat={handleRepeat}
          userId={userId}
          slug={slug}
        />
      </div>
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