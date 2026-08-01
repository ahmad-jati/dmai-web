'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  RepeatIcon, SpeakerSlashIcon, SpeakerHighIcon,
  PauseIcon, PlayIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon,
  RepeatOnceIcon,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useBGMPlayer } from '@/lib/hooks/useBGMPlayer'
import { useNarrationPlayback } from '@/lib/hooks/useNarrationPlayback'
import { useExerciseFullscreen } from '@/lib/hooks/useExerciseFullscreen'
import { usePresence } from '@/lib/hooks/usePresence'
import type { PresencePayload } from '@/lib/hooks/usePresence'
import { markPresenceActive } from '@/lib/hooks/usePresence'
import { SessionLoadingCard } from '@/components/session-loading-card'

import type { BgmTrack } from './stepper-session/bgm-dropdown'
import { SessionHeader } from './stepper-session/session-header'
import { SessionFooter } from './stepper-session/session-footer'

import { StepVideo } from './steps/step-video'
import { StepForm } from './steps/step-form'
import type { FormField } from './steps/step-form'
import { StepBodyMap } from './steps/step-body-map'
import { StepExternalEmbed } from './steps/step-external-embed'
import { StepGame } from './steps/step-game'

import type { StepType } from '@/components/admin/sessions/types'
import type { SessionInstruction } from '@/lib/data-detail-session.client'


// ─── Types ─────────────────────────────────────────────────────────────────────

type Track = BgmTrack

type SubStep = {
  _key: string
  title: string
  description: string
  audio_url: string
  image_url: string
  image_preview: string
  duration_seconds: number
}

type StoredDraft = {
  responses: Record<string, Record<string, unknown>>
  currentStep: number
  savedAt: number
}

type BodyMapResponse = {
  selected_parts: string[]
  sensation: string | null
  note: string
}

type VideoStepConfig = {
  youtube_url: string
  credit: string
}

type ExternalEmbedStepConfig = {
  url: string
  embed_url: string
}

const STALE_MS = 3 * 24 * 60 * 60 * 1000 // 3 hari

// Step types where the BGM should pause while the step is active, and
// resume automatically once the user navigates away from it (Next/Prev).
const BGM_PAUSE_STEP_TYPES: ReadonlySet<StepType> = new Set(['video', 'external_embed'])

function shouldPauseBgmForStepType(stepType: StepType): boolean {
  return BGM_PAUSE_STEP_TYPES.has(stepType)
}

type Props = {
  instructions: SessionInstruction[]
  sessionName: string
  sessionSlug: string
  sessionId: string
  sessionImageCover: string
  onDone: (completionId: string, userId: string, responses: Record<string, Record<string, unknown>>, startedAt: string | null) => void
  onBack?: () => void
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isNarrationStep(type: StepType) {
  return type === 'narration'
}

function parseConfig(config: unknown): Record<string, unknown> {
  if (!config) return {}
  if (typeof config === 'string') {
    try { return JSON.parse(config) } catch { return {} }
  }
  if (typeof config === 'object') return config as Record<string, unknown>
  return {}
}

function getSubSteps(config: Record<string, unknown>): SubStep[] {
  const raw = config.sub_steps
  if (!Array.isArray(raw)) return []
  return raw as SubStep[]
}

function getVideoConfig(config: Record<string, unknown>): VideoStepConfig {
  return {
    youtube_url: typeof config.youtube_url === 'string' ? config.youtube_url : '',
    credit: typeof config.credit === 'string' ? config.credit : '',
  }
}

function getExternalEmbedConfig(config: Record<string, unknown>): ExternalEmbedStepConfig {
  return {
    url: typeof config.url === 'string' ? config.url : '',
    embed_url: typeof config.embed_url === 'string' ? config.embed_url : '',
  }
}

function getFormFields(config: Record<string, unknown>): FormField[] {
  const raw = config.fields ?? config.questions
  if (!Array.isArray(raw)) return []
  return raw as FormField[]
}

// Resolve image: prefer image_url (supabase), fall back to image_preview (blob/local)
function resolveImage(sub: SubStep): string {
  return sub.image_url || sub.image_preview || ''
}

const STEP_TYPE_LABEL: Record<StepType, string> = {
  narration: 'Panduan Suara',
  pre_form: 'Form Sebelum Sesi',
  form: 'Form Saat Sesi',
  post_form: 'Form Setelah Sesi',
  video: 'Video',
  body_map: 'Body Map',
  external_embed: 'Aktivitas',
  game: 'Mini Game',
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function StepperExercise({ instructions, sessionName, sessionSlug, sessionId, sessionImageCover, onDone, onBack }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [narrationKey, setNarrationKey] = useState(0)
  const [formResponses, setFormResponses] = useState<Record<string, Record<string, unknown>>>({})
  const [isFinishing, setIsFinishing] = useState(false)

  // localStorage keys for this session
  const localStorageKey = `dmai_form_draft_${sessionId}`
  const startedAtKey = `dmai_started_at_${sessionId}`

  // Sub-step index — for narration steps with multiple sub_steps
  const [currentSubStep, setCurrentSubStep] = useState(0)

  useExerciseFullscreen()

  const bgm = useBGMPlayer()
  const narration = useNarrationPlayback()

  const {
    isBGMStopped, load: bgmLoad, play: bgmPlay, pause: bgmPause,
    resume: bgmResume, stop: bgmStop, switchTrack: bgmSwitchTrack,
  } = bgm
  const { playNarration, pauseNarration, resumeNarration, stopNarration, fadeMute } = narration

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bgmStartedRef = useRef(false)
  const prevIsPlayingRef = useRef(isPlaying)
  const narrationStartedRef = useRef(false)
  const isMutedRef = useRef(isMuted)
  const isFinishingRef = useRef(false)

  // ── Presence — user resolved once on mount ───────────────────────────────────
  const [presenceUserId, setPresenceUserId] = useState<string | null>(null)
  const [presenceEmail, setPresenceEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setPresenceUserId(data.user.id)
        setPresenceEmail(data.user.email ?? '')
      }
    })
  }, [])

  // post_form is now included as a regular step inside the stepper
  const activeInstructions = instructions

  const step = activeInstructions[currentStep]
  const totalSteps = activeInstructions.length
  const isTimed = isNarrationStep(step.step_type)
  const isLastStep = currentStep === totalSteps - 1
  const showPrev = currentStep > 0

  const stepConfig = parseConfig(step.step_config)
  const subSteps = isTimed ? getSubSteps(stepConfig) : []
  const hasSubSteps = subSteps.length > 0
  const activeSubStep = hasSubSteps ? subSteps[currentSubStep] : null

  const activeDuration = activeSubStep?.duration_seconds ?? step.duration_seconds

  const activeImage = activeSubStep ? resolveImage(activeSubStep) : (sessionImageCover)

  const activeTitle = activeSubStep?.title || step.title
  const activeDescription = activeSubStep?.description || step.description

  const circumference = 2 * Math.PI * 44
  const progress = isTimed ? Math.min((elapsed / activeDuration) * 100, 100) : 0
  const strokeDashoffset = circumference * (1 - progress / 100)
  const formResponsesRef = useRef<Record<string, Record<string, unknown>>>({})
  const currentStepRef = useRef(0)

  // ── Presence payload — built after step is declared ───────────────────────────
  const presencePayload: PresencePayload | null = presenceUserId && presenceEmail
    ? {
        user_id: presenceUserId,
        email: presenceEmail,
        status: 'in_session',
        session_id: sessionId,
        session_name: sessionName,
        session_slug: sessionSlug,
        joined_at: new Date().toISOString(),
      }
    : null

  usePresence(presencePayload)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(localStorageKey)
      if (saved) {
        const parsed: StoredDraft = JSON.parse(saved)
        if (Date.now() - parsed.savedAt > STALE_MS) {
          localStorage.removeItem(localStorageKey)
          localStorage.removeItem(startedAtKey)
        } else {
          setFormResponses(parsed.responses)
          formResponsesRef.current = parsed.responses
          if (typeof parsed.currentStep === 'number') {
            setCurrentStep(parsed.currentStep)
            currentStepRef.current = parsed.currentStep
          }
        }
      }
    } catch {}
  }, [localStorageKey, startedAtKey])

  useEffect(() => {
    try {
      if (!localStorage.getItem(startedAtKey)) {
        localStorage.setItem(startedAtKey, new Date().toISOString())
      }
    } catch {}
  }, [startedAtKey])

  const persistDraft = useCallback(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify({
        responses: formResponsesRef.current,
        currentStep: currentStepRef.current,
        savedAt: Date.now(),
      }))
    } catch {}
  }, [localStorageKey])

  const handleFormResponse = useCallback((stepId: string, responses: Record<string, unknown>) => {
    formResponsesRef.current = { ...formResponsesRef.current, [stepId]: responses }
    setFormResponses((prev) => ({ ...prev, [stepId]: responses }))
    persistDraft()
  }, [persistDraft])

  useEffect(() => {
    currentStepRef.current = currentStep
    persistDraft()
  }, [currentStep, persistDraft])

  const persistFormResponses = useCallback(async (
    completionId: string,
    userId: string,
    responses: Record<string, Record<string, unknown>>
  ) => {
    const supabase = createClient()
    const entries = Object.entries(responses)
    if (entries.length === 0) return

    const formRows: {
      completion_id: string;
      user_id: string;
      session_id: string
      step_id: string;
      step_number: number;
      responses: Record<string, unknown>
    }[] = []

    const bodyMapRows: {
      completion_id: string;
      user_id: string;
      step_id: string
      selected_parts: string[];
      sensation: string | null;
      note: string
    }[] = []

    for (const [stepId, stepResponses] of entries) {
      const stepInstruction = instructions.find((i) => i.id === stepId)
      if (stepInstruction?.step_type === 'body_map') {
        const bodyMapResponse = stepResponses as Partial<BodyMapResponse>
        bodyMapRows.push({
          completion_id: completionId,
          user_id: userId,
          step_id: stepId,
          selected_parts: bodyMapResponse.selected_parts ?? [],
          sensation: bodyMapResponse.sensation?.toLowerCase() ?? null,
          note: bodyMapResponse.note ?? '',
        })
      } else {
        formRows.push({
          completion_id: completionId,
          user_id: userId,
          session_id: sessionId,
          step_id: stepId,
          step_number: stepInstruction?.step ?? 0,
          responses: stepResponses,
        })
      }
    }

    const promises: Promise<void>[] = []

    if (formRows.length > 0) {
      promises.push(
        (async () => {
          const { error } = await supabase
            .from('session_form_responses')
            .insert(formRows)

          if (error) {
            console.error('[FormResponses] persist error:', error)
          }
        })()
      )
    }

    if (bodyMapRows.length > 0) {
      promises.push(
        (async () => {
          const { error } = await supabase
            .from('session_body_map_responses')
            .insert(bodyMapRows)

          if (error) {
            console.error('[BodyMapResponses] persist error:', error)
          }
        })()
      )
    }

    await Promise.all(promises)
    try { localStorage.removeItem(localStorageKey) } catch {}
    try { localStorage.removeItem(startedAtKey) } catch {}
  }, [instructions, sessionId, localStorageKey, startedAtKey])

  const handleBack = () => {
    if (onBack) onBack()
    else router.push(`/sesi/${sessionSlug}`)
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    narrationStartedRef.current = false

    if (isTimed && hasSubSteps && currentSubStep < subSteps.length - 1) {
      setCurrentSubStep((s) => s + 1)
      setElapsed(0)
      return
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setCurrentSubStep(0)
      setElapsed(0)
    } else {
      if (isFinishingRef.current) return // guard: prevent double-fire (double click/tap) from creating two completions
      isFinishingRef.current = true
      setIsFinishing(true)

      setIsPlaying(false)
      bgmStop()
      markPresenceActive() // explicit reset — don't rely on unmount, parent may keep this mounted
      const responseSnapshot = formResponsesRef.current
      let startedAt: string | null = null
      try {
        startedAt = localStorage.getItem(startedAtKey)
        localStorage.removeItem(startedAtKey)
      } catch {}
      setTimeout(() => onDone('', '', responseSnapshot, startedAt), 600)
    }
  }, [currentStep, totalSteps, onDone, bgmStop, isTimed, hasSubSteps, currentSubStep, subSteps.length, startedAtKey])

  const goPrev = useCallback(() => {
    if (isFinishingRef.current) return // guard: don't allow navigating back once the session is finishing/submitting
    narrationStartedRef.current = false
    setIsLooping(false)

    if (isTimed && hasSubSteps && currentSubStep > 0) {
      setCurrentSubStep((s) => s - 1)
      setElapsed(0)
      return
    }

    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
      setCurrentSubStep(0)
      setElapsed(0)
    }
  }, [currentStep, isTimed, hasSubSteps, currentSubStep])

  // ── 1. Fetch BGM ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('background_music')
          .select('id, title, composer, audio_url, duration_seconds')
          .order('created_at')
        if (!error && data && data.length > 0) {
          setTracks(data as Track[])
          await bgmLoad(data[0].audio_url)
        }
      } catch (err) {
        console.error('[BGM] init error:', err)
      } finally {
        setTimeout(() => setIsReady(true), 1500)
      }
    }
    init()
  }, [bgmLoad])

  // ── 2. BGM: auto-plays across every step, pauses on video/external_embed ────
  // Resumes automatically once currentStep/step type changes away from the
  // pause list — i.e. when the user hits Next/Prev out of a video or embed step.
  useEffect(() => {
    if (!isReady) return

    const pauseForThisStep = shouldPauseBgmForStepType(step.step_type)

    if (pauseForThisStep) {
      bgmPause()
      return
    }

    if (!bgmStartedRef.current) {
      const tryPlay = async () => {
        try { await bgmPlay(); bgmStartedRef.current = true } catch {}
      }
      tryPlay()

      const onGesture = async () => {
        if (bgmStartedRef.current) return
        try { await bgmPlay(); bgmStartedRef.current = true } catch {}
      }
      document.addEventListener('click', onGesture, { once: true })
      document.addEventListener('touchstart', onGesture, { once: true })
      return () => {
        document.removeEventListener('click', onGesture)
        document.removeEventListener('touchstart', onGesture)
      }
    }

    if (!isBGMStopped) bgmResume()
  }, [isReady, step.step_type, currentStep, bgmPlay, bgmPause, bgmResume, isBGMStopped])

  // ── 3. Sync play/pause button (narration only — the only step with a timer/control) ──
  useEffect(() => {
    if (!isTimed) return
    if (isPlaying === prevIsPlayingRef.current) return
    prevIsPlayingRef.current = isPlaying

    if (!isPlaying) {
      bgmPause()
      pauseNarration()
    } else {
      if (!isBGMStopped) bgmResume()
      resumeNarration()
    }
  }, [isPlaying, isTimed, isBGMStopped, bgmPause, bgmResume, pauseNarration, resumeNarration])

  // ── 4. Narration audio ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !isTimed) return

    const audioUrl = activeSubStep?.audio_url
    if (!audioUrl) return

    narrationStartedRef.current = true
    playNarration(audioUrl, isMutedRef.current)
    return () => stopNarration()
  }, [currentStep, currentSubStep, narrationKey, isReady, isTimed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isTimed) stopNarration()
  }, [currentStep, isTimed, stopNarration])

  // ── 5. Mute fade ────────────────────────────────────────────────────────────
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return }
    isMutedRef.current = isMuted
    fadeMute(isMuted)
  }, [isMuted]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 6. Timer ────────────────────────────────────────────────────────────────
  const handleTimerEnd = useCallback(() => {
    if (isLooping) { setElapsed(0); setNarrationKey((k) => k + 1) }
    else goNext()
  }, [isLooping, goNext])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && isReady && isTimed)
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, isReady, isTimed])

  useEffect(() => {
    if (isTimed && elapsed >= activeDuration) handleTimerEnd()
  }, [elapsed, activeDuration, handleTimerEnd, isTimed])

  useEffect(() => {
    setElapsed(0); setIsPlaying(true); setNarrationKey(0)
    narrationStartedRef.current = false
  }, [currentStep, currentSubStep])

  // ── Time helpers ─────────────────────────────────────────────────────────────
  const currentSeconds = Math.min(elapsed, activeDuration)
  const displayMins = String(Math.floor(currentSeconds / 60)).padStart(2, '0')
  const displaySecs = String(currentSeconds % 60).padStart(2, '0')
  const totalMins = Math.floor(activeDuration / 60)
  const totalSecs = activeDuration % 60
  const totalTime = `${totalMins}:${totalSecs.toString().padStart(2, '0')}`

  const handleSelectTrack = useCallback((index: number) => {
    const track = tracks[index]
    if (!track) return
    setCurrentTrackIndex(index)
    bgmSwitchTrack(track.audio_url)
  }, [tracks, bgmSwitchTrack])

  if (!isReady) return <SessionLoadingCard sessionName={sessionName} sessionImageCover={sessionImageCover} label="Mempersiapkan sesi…" />

  // ── Sub-step indicator (for narration with multiple sub_steps) — text, not dots ──
  // Plain function, not a component — see renderNonNarrationContent note above for why.
  const renderSubStepIndicator = (variant: 'onImage' | 'plain' = 'onImage') => {
    if (!hasSubSteps || subSteps.length <= 1) return null
    return (
      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums shrink-0',
        variant === 'onImage'
          ? 'text-white/90 bg-black/35 backdrop-blur-sm'
          : 'text-foreground border border-border dark:border-background')}>
        {currentSubStep + 1}/{subSteps.length}
      </span>
    )
  }

  console.log(isFinishing)
  // console.log(currentStep === 0 && (!hasSubSteps || currentSubStep === 0))

  // ════════════════════════════════════════════════════════
  // NARRATION LAYOUT
  // ════════════════════════════════════════════════════════
  if (isTimed) {
    return (
      <>
        {/* ── MOBILE narration ── */}
        <div className="2md:hidden fixed inset-0 z-55 p-4 overflow-y-auto flex flex-col">
          <SessionHeader
            onBack={handleBack}
            currentStep={currentStep}
            totalSteps={totalSteps}
            tracks={tracks}
            currentTrackIndex={currentTrackIndex}
            isBGMStopped={isBGMStopped}
            onSelectTrack={handleSelectTrack}
            onStop={bgmStop}
          />

          <div className="flex flex-col w-full rounded-2xl bg-white dark:bg-white/14 border border-border shadow-sm flex-1 p-4 gap-3">

            <div className="flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">{STEP_TYPE_LABEL[step.step_type]}</span>
              {renderSubStepIndicator('plain')}
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden bg-muted aspect-video shrink-0">
              {activeImage && (
                <Image src={activeImage} alt={activeTitle} fill unoptimized priority className="object-cover object-center" />
              )}
            </div>

            <div className="flex flex-col gap-1.5 overflow-y-auto h-[calc(40svh-64px)] bg-gray-100 p-3 rounded-xl">
              <p className='text-sm font-semibold text-muted-foreground'>Teks Narasi</p>
              <p className="text-base/5 font-semibold text-foreground text-pretty">{activeTitle}</p>
              {activeDescription && (
                <p className="text-sm/5 text-muted-foreground text-pretty">{activeDescription}</p>
              )}
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center justify-between gap-3 shrink-0 my-2">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="3"
                      strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <button onClick={() => setIsPlaying((p) => !p)}
                    className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center bg-celeste transition-all hover:cursor-pointer hover:scale-105 active:scale-95">
                    {isPlaying ? <PauseIcon weight="fill" className="w-4 h-4" /> : <PlayIcon weight="fill" className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-xs font-medium tabular-nums">
                  <span className="text-foreground font-semibold">{displayMins}:{displaySecs}</span>
                  <span className="mx-1.5 text-muted-foreground/40">/</span>
                  <span className="text-muted-foreground">{totalTime}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 items-end gap-1.5">
                <Button
                  onClick={() => setIsLooping((l) => !l)}
                  variant="ghost"
                  size={'sm'}
                  className={cn(
                    "[&_svg]:size-3.5 rounded-sm text-xs h-7! border-none",
                    isLooping
                      ? 'bg-celeste hover:bg-celeste/80'
                      : 'bg-gray-200 dark:bg-background/20 hover:dark:bg-background/60 hover:bg-muted/60'
                  )}
                >
                  {isLooping ? (
                    <RepeatOnceIcon weight="fill" />
                  ) : (
                    <RepeatIcon weight="fill" />
                  )}
                  Ulangi step ini
                </Button>

                <Button
                  onClick={() => setIsMuted((m) => !m)}
                  variant="ghost"
                  size={'sm'}
                  className={cn(
                    "[&_svg]:size-3.5 rounded-sm text-xs h-7!",
                    isMuted
                      ? 'bg-celeste hover:bg-celeste/80'
                      : 'bg-gray-200 dark:bg-background/20 hover:dark:bg-background/60 hover:bg-muted/60'
                  )}
                >
                  {isMuted ? (
                    <SpeakerSlashIcon weight="fill" />
                  ) : (
                    <SpeakerHighIcon weight="fill" />
                  )}
                  {isMuted ? "Tanpa narasi" : "Dengan narasi"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 shrink-0">
              <Button
                onClick={goPrev}
                // disabled={isFinishing || (currentStep === 0 && (!hasSubSteps || currentSubStep === 0))}
                variant="ghost"
                className="hover:bg-foreground/90 hover:text-background dark:bg-transparent hover:dark:bg-foreground hover:dark:text-background 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground rounded-sm text-sm 2md:h-9 h-8!
                border border-foreground
                "
              >
                <ArrowLeftIcon weight="bold" />
                Sebelumnya
              </Button>

              {isLastStep && (!hasSubSteps || currentSubStep === subSteps.length - 1) ? (
                <Button
                  onClick={goNext}
                  disabled={isFinishing}
                  className="bg-foreground/90 hover:bg-foreground/80 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-background hover:dark:text-background hover:dark:bg-foreground dark:bg-foreground rounded-sm text-sm 2md:h-9 h-8!"
                >
                  Selesai
                  <CheckIcon weight="bold" />
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  className="bg-foreground/90 hover:bg-foreground/80 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-background hover:dark:text-background hover:dark:bg-foreground dark:bg-foreground 2md:rounded-lg rounded-sm text-sm 2md:h-9 h-8!"
                >
                  Berikutnya
                  <ArrowRightIcon weight="bold" />
                </Button>
              )}
            </div>
          </div>

          <SessionFooter sessionName={sessionName} />
        </div>

        {/* ── DESKTOP narration ── */}
        <div className="hidden 2md:flex flex-col gap-2 fixed inset-0 z-55 lg:px-28 px-12 py-8 overflow-y-auto">
          <SessionHeader
            onBack={handleBack}
            currentStep={currentStep}
            totalSteps={totalSteps}
            tracks={tracks}
            currentTrackIndex={currentTrackIndex}
            isBGMStopped={isBGMStopped}
            onSelectTrack={handleSelectTrack}
            onStop={bgmStop}
          />

          <div className="flex flex-col w-full rounded-4xl bg-white dark:bg-white/14 border border-border shadow-sm flex-1 overflow-hidden p-6 gap-6">

            <div className="flex gap-6 flex-1 min-h-0">

              <div className="flex-1 relative rounded-3xl overflow-hidden bg-muted">
                {activeImage && (
                  <Image
                    src={activeImage}
                    alt={activeTitle}
                    fill
                    unoptimized
                    priority
                    className="object-cover object-center"
                  />
                )}
              </div>

              <div className="w-90 shrink-0 flex flex-col gap-4">

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">{STEP_TYPE_LABEL[step.step_type]}</span>
                  {renderSubStepIndicator('plain')}
                </div>

                <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto bg-gray-100 dark:bg-background/40 p-3 rounded-xl">
                  <p className='text-sm font-semibold text-muted-foreground'>Teks Narasi</p>
                  <p className="sm:text-xl/5.5 text-lg/4 font-semibold text-foreground max-w-2xl">{activeTitle}</p>
                  {activeDescription && (
                    <p className="text-sm/5 text-muted-foreground text-pretty">{activeDescription}</p>
                  )}
                </div>

                <div className="flex justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
                        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="3"
                          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                          transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                      </svg>
                      <button onClick={() => setIsPlaying((p) => !p)}
                        className="relative z-10 w-13 h-13 rounded-full flex items-center justify-center bg-celeste dark:bg-background/40 transition-all hover:cursor-pointer hover:scale-105 active:scale-95">
                        {isPlaying ? <PauseIcon weight="fill" className="w-6 h-6" /> : <PlayIcon weight="fill" className="w-6 h-6" />}
                      </button>
                    </div>

                    <p className="text-sm font-medium tabular-nums">
                      <span className="text-foreground font-semibold">{displayMins}:{displaySecs}</span>
                      <span className="mx-1.5 text-muted-foreground/40">/</span>
                      <span className="text-muted-foreground">{totalTime}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 items-end gap-2">
                    <Button
                      onClick={() => setIsLooping((l) => !l)}
                      variant="ghost"
                      size={'sm'}
                      className={cn(
                        "[&_svg]:size-3.5 rounded-sm text-xs h-7!",
                        isLooping
                          ? 'bg-celeste dark:bg-background hover:bg-celeste/80'
                          : 'bg-gray-200 dark:bg-background/20 hover:dark:bg-background/60 hover:bg-muted/60'
                          )}
                    >
                      {isLooping ? (
                        <RepeatOnceIcon weight="fill" />
                      ) : (
                        <RepeatIcon weight="fill" />
                      )}
                      Ulangi step ini
                    </Button>

                    <Button
                      onClick={() => setIsMuted((m) => !m)}
                      variant="ghost"
                      size={'sm'}
                      className={cn(
                        "2md:[&_svg]:size-4 [&_svg]:size-3.5 rounded-sm text-sm h-7.5!",
                        isMuted
                          ? 'bg-celeste hover:bg-celeste/80'
                          : 'bg-gray-200 dark:bg-background/20 hover:dark:bg-background/60 hover:bg-muted/60'
                      )}
                    >
                      {isMuted ? (
                        <SpeakerSlashIcon weight="fill" />
                      ) : (
                        <SpeakerHighIcon weight="fill" />
                      )}
                      {isMuted ? "Tanpa narasi" : "Dengan narasi"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 shrink-0">
              <Button
                onClick={goPrev}
                disabled={isFinishing}
                variant="ghost"
                className="hover:bg-foreground/80 hover:text-background dark:bg-transparent hover:dark:bg-foreground hover:dark:text-background 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground rounded-sm text-sm 2md:h-9 h-8!
                border border-foreground
                "
              >
                <ArrowLeftIcon weight="bold" />
                Sebelumnya
              </Button>

              {isLastStep && (!hasSubSteps || currentSubStep === subSteps.length - 1) ? (
                <Button
                  onClick={goNext}
                  disabled={isFinishing}
                  className="bg-foreground/90 hover:bg-foreground/80 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-background hover:dark:text-background hover:dark:bg-foreground dark:bg-foreground rounded-sm text-sm 2md:h-9 h-8!"
                >
                  Selesai
                  <CheckIcon weight="bold" />
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  className="bg-foreground/90 hover:bg-foreground/80 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-background hover:dark:text-background hover:dark:bg-foreground dark:bg-foreground  rounded-sm text-sm 2md:h-9 h-8!  disabled:text-red-400!"
                >
                  Berikutnya
                  <ArrowRightIcon weight="bold" />
                </Button>
              )}
            </div>
          </div>

          <div className="w-full flex justify-center lg:px-30 px-14">
            <SessionFooter sessionName={sessionName} />
          </div>
        </div>

      </>
    )
  }

  // ════════════════════════════════════════════════════════
  // NON-NARRATION LAYOUT — BGM keeps playing except on video/external_embed
  // ════════════════════════════════════════════════════════

  const renderNonNarrationContent = () => {
    const config = parseConfig(step.step_config)
    switch (step.step_type) {
      case 'video': {
        const videoConfig = getVideoConfig(config)
        return (
          <StepVideo
            youtubeUrl={videoConfig.youtube_url}
            youtubeKredit={videoConfig.credit}
            onNext={goNext}
            onPrev={showPrev ? goPrev : undefined}
          />
        )
      }
      case 'pre_form': {
        const fields = getFormFields(config)
        return (
          <StepForm
            fields={fields}
            onNext={(responses) => { handleFormResponse(step.id, responses); goNext() }}
            onPrev={showPrev ? goPrev : undefined}
            showPrev={showPrev}
            initialValues={formResponses[step.id]}
            onDraftChange={(draft) => handleFormResponse(step.id, draft)}
          />
        )
      }
      case 'form': {
        const fields = getFormFields(config)
        return (
          <StepForm
            fields={fields}
            onNext={(responses) => { handleFormResponse(step.id, responses); goNext() }}
            onPrev={showPrev ? goPrev : undefined}
            showPrev={showPrev}
            initialValues={formResponses[step.id]}
            onDraftChange={(draft) => handleFormResponse(step.id, draft)}
          />
        )
      }
      case 'post_form': {
        const fields = getFormFields(config)
        return (
          <StepForm
            fields={fields}
            onNext={(responses) => { handleFormResponse(step.id, responses); goNext() }}
            onPrev={showPrev ? goPrev : undefined}
            showPrev={showPrev}
            initialValues={formResponses[step.id]}
            isLastForm={isLastStep}
            onDraftChange={(draft) => handleFormResponse(step.id, draft)}
          />
        )
      }
      case 'body_map':
        return (
          <StepBodyMap
            onNext={(response) => { handleFormResponse(step.id, response as Record<string, unknown>); goNext() }}
            onPrev={showPrev ? goPrev : undefined}
            initialValues={formResponses[step.id] as BodyMapResponse | undefined}
            onDraftChange={(draft) => handleFormResponse(step.id, draft as Record<string, unknown>)}
          />
        )
      case 'external_embed': {
        const embedConfig = getExternalEmbedConfig(config)
        return (
          <StepExternalEmbed
            url={embedConfig.url || embedConfig.embed_url}
            onNext={goNext}
            onPrev={showPrev ? goPrev : undefined}
          />
        )
      }
      case 'game':
        return (
          <StepGame
            onNext={goNext}
            onPrev={showPrev ? goPrev : undefined}
            duration={step.duration_seconds ?? undefined}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* MOBILE non-narration */}
      <div className="2md:hidden fixed inset-0 p-4 overflow-y-auto flex flex-col">
        <SessionHeader
          onBack={handleBack}
          currentStep={currentStep}
          totalSteps={totalSteps}
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          isBGMStopped={isBGMStopped}
          onSelectTrack={handleSelectTrack}
          onStop={bgmStop}
        />

        <div className='flex w-full md:rounded-4xl rounded-2xl bg-white dark:bg-white/14 border border-border shadow-sm flex-1'>
         <div className='flex flex-col items-center w-full p-6 gap-6'>
            {step.title && (
              <div className="flex flex-col items-center gap-1.5 w-full text-center xs:max-w-2xl">
                <p className="text-base/4.5 font-semibold text-foreground">{step.title}</p>
                {step.description && (
                  <p className="text-sm/4 text-muted-foreground">{step.description}</p>
                )}
              </div>
            )}

            <div className="flex-1 flex flex-col justify-start w-full">
              {renderNonNarrationContent()}
            </div>
          </div>
        </div>

        <SessionFooter sessionName={sessionName} />
      </div>

      {/* DESKTOP non-narration */}
      <div className="hidden 2md:flex flex-col gap-2 fixed inset-0 lg:px-28 px-12 py-8 overflow-y-auto">
        <SessionHeader
          onBack={handleBack}
          currentStep={currentStep}
          totalSteps={totalSteps}
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          isBGMStopped={isBGMStopped}
          onSelectTrack={handleSelectTrack}
          onStop={bgmStop}
        />

        <div className="flex w-full rounded-4xl bg-white dark:bg-white/14 border border-border shadow-sm flex-1">
          <div className="flex flex-col items-center py-6 px-6 w-full gap-6 flex-1">
            {step.title && (
              <div className="flex flex-col items-center gap-1.5 w-full text-center">
                <p className="sm:text-2xl/6.5 text-xl/5.5 font-semibold text-foreground max-w-2xl">{step.title}
                </p>
                {step.description && (
                  <p className="sm:text-p/5 xs:text-sm/4 text-xs/3.5 text-muted-foreground max-w-3xl">{step.description}</p>
                )}
              </div>
            )}

            <div className="flex items-start justify-start w-full flex-1">
              {renderNonNarrationContent()}
            </div>

          </div>

        </div>

        <div className="w-full flex justify-center lg:px-30 px-14">
          <SessionFooter sessionName={sessionName} />
        </div>
      </div>
    </>
  )
}