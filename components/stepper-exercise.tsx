'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  RepeatIcon, SpeakerSlashIcon, SpeakerHighIcon,
  PauseIcon, PlayIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon,
  RepeatOnceIcon, MusicNotesIcon, CaretDownIcon,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useBGMPlayer } from '@/lib/hooks/useBGMPlayer'
import { useNarrationPlayback } from '@/lib/hooks/useNarrationPlayback'
import { useExerciseFullscreen } from '@/lib/hooks/useExerciseFullscreen'
import { Spinner } from '@/components/ui/spinner'

import { StepVideo } from './steps/step-video'
import { StepForm } from './steps/step-form'
import { StepBodyMap } from './steps/step-body-map'
import { StepExternalEmbed } from './steps/step-external-embed'
import { StepGame } from './steps/step-game'

import type { StepType } from '@/components/admin/sessions/types'
import type { SessionInstruction } from '@/lib/data-detail-session.client'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Track = {
  id: string
  title: string
  composer: string | null
  audio_url: string
  duration_seconds: number | null
}

type SubStep = {
  _key: string
  title: string
  description: string
  audio_url: string
  image_url: string
  image_preview: string
  duration_seconds: number
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
  console.log(config)
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

// Resolve image: prefer image_url (supabase), fall back to image_preview (blob/local)
function resolveImage(sub: SubStep): string {
  return sub.image_url || sub.image_preview || ''
}

const STEP_TYPE_LABEL: Record<StepType, string> = {
  narration: 'Panduan Suara',
  pre_form: 'Form Sebelum Sesi',
  post_form: 'Form Setelah Sesi',
  video: 'Video',
  body_map: 'Body Map',
  external_embed: 'Aktivitas',
  game: 'Mini Game',
}

// ─── Loading Screen ─────────────────────────────────────────────────────────────

function LoadingScreen({ sessionName, sessionImageCover }: { sessionName: string; sessionImageCover: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 lg:px-28 px-12 lg:py-14 py-8 bg-background">
      <p className="text-p text-muted-foreground -mb-2 text-center font-semibold">DMAI - Session</p>
      <h1 className="md:text-h1/8 text-2xl/7 text-center font-semibold">{sessionName}</h1>
      <div className="relative md:w-100 w-60 h-60 2xs:rounded-3xl rounded-xl overflow-hidden">
        <Image 
          src={sessionImageCover} 
          alt={sessionName} 
          fill 
          unoptimized 
          priority 
          className="object-cover object-center w-full h-full" 
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-black/50 to-transparent" />
      </div>
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Spinner className="text-muted-foreground" />
        <p className="text-sm font-medium tracking-wide">Mempersiapkan sesi…</p>
      </div>
    </div>
  )
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
  const [showMusicTray, setShowMusicTray] = useState(false)
  const [formResponses, setFormResponses] = useState<Record<string, Record<string, unknown>>>({})

  // sessionStorage keys for this session
  const sessionStorageKey = `dmai_form_draft_${sessionId}`
  const startedAtKey = `dmai_started_at_${sessionId}`

  // Sub-step index — for narration steps with multiple sub_steps
  const [currentSubStep, setCurrentSubStep] = useState(0)

  useExerciseFullscreen()

  const bgmButtonRef = useRef<HTMLButtonElement>(null)
  const bgmButtonMobileRef = useRef<HTMLButtonElement>(null)
  const [trayRect, setTrayRect] = useState<DOMRect | null>(null)
  const [trayMobile, setTrayMobile] = useState(false)

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

  // Exclude post_form steps — they have a dedicated place outside the stepper
  const activeInstructions = instructions.filter((i) => i.step_type !== 'post_form')

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

  const activeImage = activeSubStep ? resolveImage(activeSubStep) : (step.image || sessionImageCover)

  const activeTitle = activeSubStep?.title || step.title
  const activeDescription = activeSubStep?.description || step.description

  const circumference = 2 * Math.PI * 44
  const progress = isTimed ? Math.min((elapsed / activeDuration) * 100, 100) : 0
  const strokeDashoffset = circumference * (1 - progress / 100)
  const currentTrack = tracks[currentTrackIndex]
  const formResponsesRef = useRef<Record<string, Record<string, unknown>>>({})

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(sessionStorageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setFormResponses(parsed)
        formResponsesRef.current = parsed
      }
    } catch {}
  }, [sessionStorageKey])

  // Record started_at once when the stepper first mounts for this session.
  // We only write if the key doesn't exist yet, so resuming after a refresh
  // keeps the original start time instead of resetting it.
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(startedAtKey)) {
        sessionStorage.setItem(startedAtKey, new Date().toISOString())
      }
    } catch {}
  }, [startedAtKey])

  const handleFormResponse = useCallback((stepId: string, responses: Record<string, unknown>) => {
    formResponsesRef.current = { ...formResponsesRef.current, [stepId]: responses }
    setFormResponses((prev) => {
      const next = { ...prev, [stepId]: responses }
      try { sessionStorage.setItem(sessionStorageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }, [sessionStorageKey])

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
        bodyMapRows.push({
          completion_id: completionId,
          user_id: userId,
          step_id: stepId,
          selected_parts: (stepResponses.selected_parts as string[]) ?? [],
          sensation: (stepResponses.sensation as string | null)?.toLowerCase() ?? null,
          note: (stepResponses.note as string) ?? '',
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
          const { data, error } = await supabase
            .from('session_form_responses')
            .insert(formRows)

          console.log(data)
          if (error) {
            console.error('[FormResponses] persist error:', error)
          }
        })()
      )
    }

    if (bodyMapRows.length > 0) {
      promises.push(
        (async () => {
          const { data, error } = await supabase
            .from('session_body_map_responses')
            .insert(bodyMapRows)

            console.log(data)
          if (error) {
            console.error('[BodyMapResponses] persist error:', error)
          }
        })()
      )
    }

    await Promise.all(promises)
    try { sessionStorage.removeItem(sessionStorageKey) } catch {}
    try { sessionStorage.removeItem(startedAtKey) } catch {}
  }, [instructions, sessionId, sessionStorageKey, startedAtKey])

  const handleBack = () => {
    if (onBack) onBack()
    else router.push(`/session/${sessionSlug}`)
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
      setIsPlaying(false)
      bgmStop()
      const responseSnapshot = formResponsesRef.current
      let startedAt: string | null = null
      try {
        startedAt = sessionStorage.getItem(startedAtKey)
        sessionStorage.removeItem(startedAtKey)
      } catch {}
      setTimeout(() => onDone('', '', responseSnapshot, startedAt), 600)
    }
  }, [currentStep, totalSteps, onDone, bgmStop, isTimed, hasSubSteps, currentSubStep, subSteps.length, startedAtKey])

  const goPrev = useCallback(() => {
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

  const jumpToStep = (i: number) => {
    setIsLooping(false)
    narrationStartedRef.current = false
    setCurrentStep(i)
    setCurrentSubStep(0)
    setElapsed(0)
  }

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
        setTimeout(() => setIsReady(true), 5000)
      }
    }
    init()
  }, [bgmLoad])

  // ── 2. BGM: play on narration, pause on others ──────────────────────────────
  useEffect(() => {
    if (!isReady) return
    if (isTimed) {
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
      } else {
        if (!isBGMStopped) bgmResume()
      }
    } else {
      bgmPause()
    }
  }, [isReady, isTimed, currentStep, bgmPlay, bgmPause, bgmResume, isBGMStopped])

  // ── 3. Sync play/pause button ───────────────────────────────────────────────
  useEffect(() => {
    if (!isTimed || !bgmStartedRef.current) return
    if (isPlaying === prevIsPlayingRef.current) return
    prevIsPlayingRef.current = isPlaying
    if (!isPlaying) {
      bgmPause(); pauseNarration()
    } else {
      if (!isBGMStopped) bgmResume()
      if (narrationStartedRef.current) resumeNarration()
    }
  }, [isPlaying, isTimed, isBGMStopped, bgmPause, bgmResume, pauseNarration, resumeNarration])

  // ── 4. Narration audio ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !isTimed) return

    const audioUrl = activeSubStep?.audio_url || step.audio
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

  // ── BGM display ──────────────────────────────────────────────────────────────
  const bgmLabel = isBGMStopped ? 'Tanpa Musik' : currentTrack?.title ?? 'Musik Latar'
  const bgmSublabel = (!isBGMStopped && currentTrack?.composer) ? currentTrack.composer : null

  const openMusicTray = (ref: React.RefObject<HTMLButtonElement | null>, isMobile: boolean) => {
    if (ref.current) { setTrayRect(ref.current.getBoundingClientRect()); setTrayMobile(isMobile) }
    setShowMusicTray((v) => !v)
  }

  if (!isReady) return <LoadingScreen sessionName={sessionName} sessionImageCover={sessionImageCover} />

  // ── Music Tray ───────────────────────────────────────────────────────────────
  const MusicTray = () => {
    if (!trayRect) return null
    const style: React.CSSProperties = {
      position: 'fixed',
      top: trayRect.bottom + 8,
      right: window.innerWidth - trayRect.right,
      zIndex: 9999,
      width: 240,
    }
    return (
      <>
        <div className="fixed inset-0 z-50" onClick={() => setShowMusicTray(false)} />
        <div style={style}
          className="bg-background/90 dark:bg-foreground/90 text-foreground/80 dark:text-background/80 border border-muted-foreground 2md:rounded-2xl rounded-lg p-2.5 flex flex-col gap-0.5 w-full animate-in slide-in-from-top-1 duration-150">
          <span className="text-xs font-bold tracking-[0.18em] uppercase px-2 pb-1.5">Musik Latar</span>
          {tracks.map((track, index) => (
            <button key={track.id}
              onClick={() => { setCurrentTrackIndex(index); bgmSwitchTrack(track.audio_url); setShowMusicTray(false) }}
              className={cn('flex items-center gap-2.5 w-full px-2.5 py-2 2md:rounded-xl rounded-md text-left transition-all duration-150 ease-out',
                index === currentTrackIndex && !isBGMStopped ? 'bg-muted-foreground/40' : 'text-foreground hover:bg-muted-foreground/40')}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/40" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground dark:text-background">{track.title}</span>
                {track.composer && <span className="text-xs text-foreground dark:text-background">{track.composer}</span>}
              </div>
            </button>
          ))}
          <div className="m-1 px-2 bg-muted-foreground/25 dark:bg-background/20 min-w-0 h-0.5" />
          <button onClick={() => { bgmStop(); setShowMusicTray(false) }}
            className={cn('flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-all duration-150 ease-out',
              isBGMStopped ? 'bg-muted-foreground/40 text-foreground' : 'text-foreground hover:bg-muted-foreground/40')}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/40" />
            <span className="text-xs font-semibold text-foreground dark:text-background">Tanpa Musik</span>
          </button>
        </div>
      </>
    )
  }

  // ── Sub-step dots (for narration with multiple sub_steps) ────────────────────
  const SubStepDots = ({ dark = false }: { dark?: boolean }) => {
    if (!hasSubSteps || subSteps.length <= 1) return null
    return (
      <div className="flex items-center gap-1.5">
        {subSteps.map((_, i) => (
          <span key={i} className={cn('block h-0.5 rounded-full transition-all duration-300',
            dark
              ? i === currentSubStep ? 'w-5 bg-background/80' : i < currentSubStep ? 'w-2.5 bg-background/40' : 'w-2.5 bg-background/20'
              : i === currentSubStep ? 'w-5 bg-foreground/80' : i < currentSubStep ? 'w-2.5 bg-foreground/40' : 'w-2.5 bg-foreground/20'
          )} />
        ))}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // NARRATION LAYOUT — full bleed image, BGM active
  // ════════════════════════════════════════════════════════
  if (isTimed) {
    return (
      <>
        {/* ── MOBILE narration ── */}
        <div className="2md:hidden fixed inset-0 z-55 flex 2xs:justify-start justify-center flex-col 2xs:gap-3 gap-6 bg-background p-6 overflow-y-auto">

          {/* Top bar: back + BGM */}
          <div className="flex items-center gap-3 shrink-0">
            <Button onClick={handleBack} variant="default"
              className="2xs:rounded-xl xs:rounded-lg rounded-sm [&_svg]:size-4 px-1 py-1.5 xs:h-full h-fit border-muted-foreground">
              <ArrowLeftIcon weight="bold" />
            </Button>
            <button ref={bgmButtonMobileRef} onClick={() => openMusicTray(bgmButtonMobileRef, true)}
              className="flex items-center justify-between xs:gap-4 gap-2 flex-1 2xs:rounded-xl rounded-lg bg-background border border-muted-foreground p-3">
              <MusicNotesIcon weight="fill" className={cn('w-3.5 h-3.5 shrink-0', isBGMStopped ? 'text-foreground/40' : 'text-foreground')} />
              <div className="flex flex-col items-start flex-1 gap-1 min-w-0 text-left overflow-hidden">
                <span className="text-xs/3 font-semibold text-foreground">{bgmLabel}</span>
                {bgmSublabel && <span className="text-xs/3 font-medium text-muted-foreground">{bgmSublabel}</span>}
              </div>
              <CaretDownIcon weight="bold" className={cn('w-3 h-3 shrink-0 text-foreground transition-transform duration-200', showMusicTray && trayMobile && 'rotate-180')} />
            </button>
          </div>

          {/* Cover image */}
          <div className="flex justify-center items-center shrink-0 2xs:flex-1 sm:px-16 px-0 min-h-fit bg-amber-50 mt-2 2xs:rounded-3xl rounded-xl">
            <div className="relative w-full 2xs:h-full h-56 2xs:rounded-3xl rounded-xl overflow-hidden">
              {activeImage ? (
                <Image src={activeImage} alt={activeTitle} fill unoptimized priority className="object-cover object-center w-full h-full" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/60 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-black/50 to-transparent" />
            </div>
          </div>

          {/* Step label + title */}
          <div className="flex flex-col gap-1 text-center pt-1 shrink-0 2xs:h-32 h-40 overflow-y-auto my-2">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">
              Tahap {currentStep + 1} / {totalSteps}
            </span>
            {/* Step title (from step row) */}
            <p className="text-xs font-bold text-muted-foreground/70">{step.title}</p>
            <SubStepDots dark={false} />
            <div className="flex flex-col gap-2 items-center xs:px-6">
              <p className="sm:text-h2/7 text-lg/5.5 font-semibold text-foreground text-center">{activeTitle}</p>
              {activeDescription && (
                <p className="xs:text-p/4.5 text-p/4.5 text-muted-foreground text-center text-pretty">{activeDescription}</p>
              )}
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center 2xs:justify-between justify-center 2xs:gap-6 gap-3 w-full shrink-0">
            <Button onClick={() => setIsLooping((l) => !l)} variant="ghost" size="sm"
              className={cn('[&_svg]:size-5 p-2 text-xs xs:text-sm font-medium',
                isLooping ? 'text-foreground hover:bg-foreground/10' : 'text-muted-foreground hover:bg-foreground/10')}>
              {isLooping ? <RepeatOnceIcon weight="fill" /> : <RepeatIcon weight="fill" />}
            </Button>

            <div className="flex-1 flex flex-row 2xs:gap-13 gap-3 justify-center items-center">
              <Button onClick={goPrev} disabled={currentStep === 0 && (!hasSubSteps || currentSubStep === 0)}
                size="sm" variant="default"
                className="[&_svg]:size-5 flex items-center justify-center gap-1.5 sm:px-3 px-2 py-2 text-xs xs:text-sm text-muted-foreground rounded-full bg-transparent hover:bg-foreground/10 border-none disabled:cursor-not-allowed 2xs:w-fit w-6">
                <ArrowLeftIcon weight="bold" />
                <span className="2xs:inline hidden">Sebelumnya</span>
              </Button>

              {/* Progress ring */}
              <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(94, 94, 94, 0.2)" strokeWidth="3" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(94, 94, 94)" strokeOpacity="0.75" strokeWidth="3"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <button onClick={() => setIsPlaying((p) => !p)}
                  className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center bg-background text-muted-foreground transition-all hover:cursor-pointer hover:scale-105 active:scale-95">
                  {isPlaying ? <PauseIcon weight="fill" className="w-6 h-6" /> : <PlayIcon weight="fill" className="w-6 h-6" />}
                </button>
              </div>

              <Button onClick={goNext} variant="default" size="sm"
                className="[&_svg]:size-5 flex items-center justify-center gap-1.5 sm:px-3 px-2 py-2 text-xs xs:text-sm text-muted-foreground rounded-full bg-transparent border-none hover:bg-foreground/10 2xs:w-fit w-6">
                <span className="2xs:inline hidden">Berikutnya</span>
                <ArrowRightIcon weight="bold" />
              </Button>
            </div>

            <Button onClick={() => setIsMuted((m) => !m)} size="sm" variant="ghost"
              className={cn('[&_svg]:size-5 p-2 text-xs xs:text-sm font-medium',
                isMuted ? 'text-foreground hover:bg-foreground/10' : 'text-muted-foreground hover:bg-foreground/10')}>
              {isMuted ? <SpeakerSlashIcon weight="fill" /> : <SpeakerHighIcon weight="fill" />}
            </Button>
          </div>

          {/* Timer */}
          <p className="xs:text-sm text-xs text-center font-medium text-muted-foreground/60 shrink-0">
            <span className="text-foreground/80 font-medium">{displayMins}:{displaySecs}</span>
            <span className="mx-1 text-muted-foreground/30">/</span>
            <span>{totalTime}</span>
          </p>

          <p className="xs:text-p text-sm text-muted-foreground/40 text-center font-semibold">DMAI - {sessionName} Session</p>
        </div>

        {/* ── DESKTOP narration ── */}
        <div className="hidden 2md:flex fixed inset-0 z-55 items-stretch justify-stretch lg:px-28 px-12 lg:py-14 py-8 bg-transparent">
          <div className="flex flex-col  items-center w-full rounded-4xl relative overflow-y-auto flex-1">

            {/* Background image */}
            <div className="absolute inset-0 z-0">
              {activeImage ? (
                <Image src={activeImage} alt={activeTitle} fill unoptimized priority className="object-cover object-center rounded-4xl" />
              ) : (
                <div className="absolute inset-0 bg-muted rounded-4xl" />
              )}
              <div className="absolute inset-0 rounded-4xl bg-black/25" />
              <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/50 to-transparent rounded-t-4xl" />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/50 to-transparent rounded-b-4xl" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-between h-full w-full py-8 px-6">

              {/* Top bar */}
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex-1 flex justify-start">
                  <Button onClick={handleBack} variant="link"
                    className="flex items-center justify-center text-background dark:text-foreground">
                    <ArrowLeftIcon weight="bold" className="w-4 h-4" /> Kembali
                  </Button>
                </div>

                {/* Step dots */}
                <div className="flex flex-col items-center gap-3">
                  <span className="text-xs text-background/80 font-semibold tracking-[0.2em] uppercase">
                    Tahap {currentStep + 1} / {totalSteps} · {step.title && (
                      <span className="text-xs text-background/60 font-semibold">{step.title}</span>
                    )}
                  </span>
                  <div className='flex items-center gap-3'>
                    {activeInstructions.map((_, i) => (
                      <button key={i} onClick={() => jumpToStep(i)}
                        className="flex flex-col items-center gap-1 group transition-all duration-200 ease-out cursor-pointer">
                        <span className={cn('block h-1 rounded-full transition-all duration-300',
                          i === currentStep ? 'w-8 bg-background/90' : i < currentStep ? 'w-4 bg-background/55' : 'w-4 bg-background/30')} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* BGM pill */}
                <div className="flex-1 flex justify-end">
                  <button ref={bgmButtonRef} onClick={() => openMusicTray(bgmButtonRef, false)}
                    className="flex items-center gap-3 px-4 py-2 2md:rounded-2xl rounded-lg bg-background/90 dark:bg-foreground/90 text-foreground/80 dark:text-background/80 hover:bg-popover/90 border border-foreground hover:cursor-pointer transition-all duration-150 ease-out w-60">
                    <MusicNotesIcon weight="fill" className={cn('w-3.5 h-3.5 shrink-0', isBGMStopped ? 'opacity-40' : 'opacity-100')} />
                    <div className="flex flex-1 flex-col min-w-0 text-left">
                      <span className="text-xs font-semibold leading-tight truncate max-w-42">{bgmLabel}</span>
                      {bgmSublabel && <span className="text-xs leading-tight truncate max-w-42 font-medium">{bgmSublabel}</span>}
                    </div>
                    <CaretDownIcon weight="bold" className={cn('w-4 h-4 shrink-0 transition-transform duration-200', showMusicTray && !trayMobile && 'rotate-180')} />
                  </button>
                </div>
              </div>

              {/* Middle */}
              <div className="flex flex-1 flex-col justify-center items-center gap-4 text-center">
                
                {/* <SubStepDots dark={true} /> */}

                <p className="xs:text-p/5 text-sm/4 tracking-wide font-medium -mt-2">
                  <span className="text-white/90">{displayMins}:{displaySecs}</span>
                  <span className="text-white/30 mx-1">/</span>
                  <span className="text-white/50">{totalTime}</span>
                </p>

                {/* Progress ring */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="2.5"
                      strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <button onClick={() => setIsPlaying((p) => !p)}
                    className="relative z-10 w-17.5 h-17.5 rounded-full flex items-center justify-center bg-background dark:bg-foreground text-muted-foreground dark:text-background transition-all hover:cursor-pointer hover:scale-105 active:scale-95">
                    {isPlaying ? <PauseIcon weight="fill" className="w-7 h-7" /> : <PlayIcon weight="fill" className="w-7 h-7" />}
                  </button>
                </div>

                <span className="text-xs text-background/80 font-semibold tracking-[0.2em] uppercase">
                  Langkah {currentSubStep + 1 } / {subSteps.length} 
                </span>

                {/* Sub-step title + description */}
                <div className="flex flex-col gap-1 text-center pt-1 shrink-0 max-w-xl sm:max-w-lg h-auto max-h-30 min-h-12  overflow-y-auto justify-start">
                  <div className="flex flex-col gap-2 items-center xs:px-6">
                    <p className="sm:text-h2/7 text-xl/5.5 font-semibold text-background dark:text-foreground text-center">{activeTitle}</p>
                    {activeDescription && (
                      <p className="xs:text-p/5 text-sm/4 text-background dark:text-foreground text-center">{activeDescription}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom controls */}
              <div className="flex flex-col items-center gap-3.5 px-3">
                <div className="flex items-center justify-center gap-2 bg-background/90 dark:bg-foreground/90 rounded-full px-2 py-1.5 w-full">
                  <Button onClick={goPrev} disabled={currentStep === 0 && (!hasSubSteps || currentSubStep === 0)}
                    size="sm" variant="ghost"
                    className="[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground dark:text-background disabled:opacity-30 disabled:cursor-not-allowed font-medium rounded-full bg-transparent hover:bg-foreground/10 hover:dark:bg-background/10">
                    <ArrowLeftIcon weight="bold" /> Sebelumnya
                  </Button>

                  <Button onClick={() => setIsLooping((l) => !l)} variant="ghost" size="sm"
                    className={cn('[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full bg-transparent',
                      isLooping ? 'text-muted-foreground dark:text-background border border-muted-foreground bg-foreground/10' : 'text-muted-foreground dark:text-background hover:bg-foreground/10 hover:dark:bg-background/10')}>
                    {isLooping ? <RepeatOnceIcon weight="fill" /> : <RepeatIcon weight="fill" />}
                    Ulangi
                  </Button>

                  <Button onClick={() => setIsMuted((m) => !m)} size="sm" variant="ghost"
                    className={cn('[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full bg-transparent',
                      isMuted ? 'text-muted-foreground dark:text-background border border-muted-foreground bg-foreground/10' : 'text-muted-foreground dark:text-background hover:bg-foreground/10 hover:dark:bg-background/10')}>
                    {isMuted ? <SpeakerSlashIcon weight="fill" /> : <SpeakerHighIcon weight="fill" />}
                    {isMuted ? 'Tanpa Instruksi Suara' : 'Dengan Instruksi Suara'}
                  </Button>

                  {isLastStep && (!hasSubSteps || currentSubStep === subSteps.length - 1) ? (
                    <Button onClick={goNext} variant="ghost" size="sm"
                      className="[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground dark:text-background font-medium rounded-full bg-transparent hover:bg-foreground/10 hover:dark:bg-background/10">
                      Selesai <CheckIcon weight="bold" />
                    </Button>
                  ) : (
                    <Button onClick={goNext} variant="ghost" size="sm"
                      className="[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground dark:text-background font-medium rounded-full bg-transparent hover:bg-foreground/10 hover:dark:bg-background/10">
                      Berikutnya <ArrowRightIcon weight="bold" />
                    </Button>
                  )}
                </div>
                <p className="lg:text-p text-sm text-white/40 text-center font-semibold">DMAI - {sessionName} Session</p>
              </div>

            </div>
          </div>
        </div>

        {showMusicTray && <MusicTray />}
      </>
    )
  }

  // ════════════════════════════════════════════════════════
  // NON-NARRATION LAYOUT — clean shell, BGM paused
  // ════════════════════════════════════════════════════════

  const NonNarrationContent = () => {
    const config = parseConfig(step.step_config)
    console.log(config)
    switch (step.step_type) {
      case 'video':
        return (
          <StepVideo
            youtubeUrl={(config.youtube_url as string) ?? ''}
            youtubeKredit={(config.credit as string) ?? ''}
            onNext={goNext}
            onPrev={showPrev ? goPrev : undefined}
          />
        )
      case 'pre_form': {
        const fields = (config.fields ?? config.questions ?? []) as unknown[]
        return (
          <StepForm
            fields={fields as never}
            onNext={(responses) => { handleFormResponse(step.id, responses); goNext() }}
            onPrev={showPrev ? goPrev : undefined}
            showPrev={showPrev}
            initialValues={formResponses[step.id]}
          />
        )
      }
      case 'post_form': {
        const fields = (config.fields ?? config.questions ?? []) as unknown[]
        return (
          <StepForm
            fields={fields as never}
            onNext={(responses) => { handleFormResponse(step.id, responses); goNext() }}
            onPrev={showPrev ? goPrev : undefined}
            showPrev={showPrev}
            initialValues={formResponses[step.id]}
            isLastForm={isLastStep}
          />
        )
      }
      case 'body_map':
        return (
          <StepBodyMap
            onNext={(response) => { handleFormResponse(step.id, response as Record<string, unknown>); goNext() }}
            onPrev={showPrev ? goPrev : undefined}
            initialValues={formResponses[step.id] as { selected_parts: string[]; sensation: string | null; note: string } | undefined}
            onDraftChange={(draft) => handleFormResponse(step.id, draft as Record<string, unknown>)}
          />
        )
      case 'external_embed':
        return (
          <StepExternalEmbed
            url={(config.url as string) ?? (config.embed_url as string) ?? ''}
            label={(config.label as string) ?? 'Buka Aktivitas'}
            onNext={goNext}
            onPrev={showPrev ? goPrev : undefined}
          />
        )
      case 'game':
        return <StepGame onNext={goNext} onPrev={showPrev ? goPrev : undefined} />
      default:
        return null
    }
  }

  // Step dots for non-narration
  const StepDots = () => (
    <div className="sm:flex hidden items-center gap-3 shrink-0">
      {activeInstructions.map((_, i) => (
        <button key={i} onClick={() => jumpToStep(i)}
          className={cn('block h-1 rounded-full transition-all duration-300 cursor-pointer',
            i === currentStep ? 'w-8 bg-foreground/90' : i < currentStep ? 'w-4 bg-foreground/50' : 'w-4 bg-foreground/20')} />
      ))}
    </div>
  )

  return (
    <>
      {/* MOBILE non-narration */}
      <div className="2md:hidden fixed inset-0 z-55 flex flex-col bg-background p-4 gap-3 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <Button onClick={handleBack} variant="ghost" size="sm"
            className="[&_svg]:size-4 gap-1.5 rounded-full px-3 text-foreground hover:bg-foreground/10">
            <ArrowLeftIcon weight="bold" /> Kembali
          </Button>
          <StepDots />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground">
              Tahap {currentStep + 1} / {totalSteps}
            </span>
            <span className="text-xs font-bold text-foreground">{STEP_TYPE_LABEL[step.step_type]}</span>
          </div>
          {/* <div className="w-20" /> */}
        </div>


        {/* Step title */}
        {step.title && (
          <p className="text-base font-semibold text-foreground text-center shrink-0">{step.title}</p>
        )}
        {step.description && (
          <p className="text-sm text-muted-foreground text-center shrink-0">{step.description}</p>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center py-2">
          <NonNarrationContent />
        </div>

        <p className="text-xs text-muted-foreground/40 text-center font-semibold shrink-0">DMAI - {sessionName} Session</p>
      </div>

      {/* DESKTOP non-narration */}
      <div className="hidden 2md:flex fixed inset-0 z-55 items-stretch justify-stretch lg:px-28 px-12 lg:py-14 py-8 bg-muted/30 overflow-y-auto">
        <div className="flex flex-col items-center w-full rounded-4xl bg-background border border-border overflow-y-auto h-fit flex-1">
          <div className="flex flex-col items-center justify-between h-full w-full py-8 px-8 gap-6">
            {/* Top bar */}
            <div className="flex items-center justify-between w-full gap-4 shrink-0">
              <Button 
                onClick={handleBack} 
                variant="ghost" 
                size="sm"
                className="[&_svg]:size-4 gap-1.5 rounded-full px-3 text-foreground hover:bg-foreground/10"
              >
                <ArrowLeftIcon weight="bold" /> 
                Kembali
              </Button>
              <div className="flex flex-col items-center justify-center gap-2.5 w-full">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground">
                  Tahap {currentStep + 1} / {totalSteps} · {STEP_TYPE_LABEL[step.step_type]}
                </span>
                <StepDots />
              </div>
              <div className="w-24" />
            </div>

            {/* Step title */}
            {step.title && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <p className="sm:text-h2/7 text-xl/5.5 font-semibold text-foreground text-center max-w-2xl">{step.title}</p>
                {step.description && (
                  <p className="sm:text-p/5 xs:text-sm/4 text-xs/3.5text-muted-foreground text-center max-w-lg">{step.description} </p>
                )}
              </div>
            )}
   
            {/* Content */}
            <div className="flex-1 w-full flex items-start justify-center overflow-y-auto min-h-96">
              <NonNarrationContent />
            </div>

            <p className="text-sm text-muted-foreground/40 font-semibold shrink-0">DMAI - {sessionName} Session</p>
          </div>
        </div>
      </div>
    </>
  )
}