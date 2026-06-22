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
import { useBGMPlayer } from '@/lib/hooks/useBGMPlayer'
import { useNarrationPlayback } from '@/lib/hooks/useNarrationPlayback'
import { useExerciseFullscreen } from '@/lib/hooks/useExerciseFullscreen'
import { Spinner } from '@/components/ui/spinner'

// Step components
import { StepNarration } from './steps/step-narration'
import { StepVideo } from './steps/step-video'
import { StepForm } from './steps/step-form'
import { StepBodyMap } from './steps/step-body-map'
import { StepExternalEmbed } from './steps/step-external-embed'
import { StepGame } from './steps/step-game'

// Types — imported from shared sources
import type { StepType } from '@/components/admin/sessions/types'
import type { SessionInstruction } from '@/lib/data-detail-session.client'

type Track = {
  id: string
  title: string
  composer: string | null
  audio_url: string
  duration_seconds: number | null
}

type Props = {
  instructions: SessionInstruction[]
  sessionName: string
  sessionSlug: string
  sessionImageCover: string
  onDone: () => void
  onBack?: () => void
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Step types that use the timer + narration audio (stepper-controlled flow)
const TIMED_TYPES: StepType[] = ['narration']

// Step types where the user manually advances (no auto-timer)
const MANUAL_TYPES: StepType[] = ['form', 'video', 'body_map', 'external_embed', 'game']

function isManualStep(type: StepType) {
  return MANUAL_TYPES.includes(type)
}

// ─── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen({ sessionName, sessionImageCover, firstStep }: {
  sessionName: string
  sessionImageCover: string
  firstStep: SessionInstruction
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 lg:px-28 px-12 lg:py-14 py-8 bg-celeste">
      <p className="text-p text-muted-foreground -mb-2 text-center font-semibold">DMAI - Session</p>
      <h1 className="md:text-h1/8 text-2xl/7 text-center font-semibold">{sessionName}</h1>
      <div className="relative md:w-100 w-60 aspect-square 2xs:rounded-3xl rounded-xl overflow-hidden">
        <Image
          src={sessionImageCover}
          alt={firstStep.title}
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

// ─── Step Content Router ───────────────────────────────────────────────────────

function StepContent({
  step,
  isMobile,
  onManualNext,
  onFormResponse,
}: {
  step: SessionInstruction
  isMobile: boolean
  onManualNext: () => void
  onFormResponse: (stepId: string, responses: Record<string, unknown>) => void
}) {
  const config = step.step_config ?? {}

  switch (step.step_type) {
    case 'narration':
      return (
        <StepNarration
          title={step.title}
          description={step.description}
          image={step.image}
          isMobile={isMobile}
        />
      )

    case 'video':
      return (
        <StepVideo
          youtubeUrl={(config as { youtube_url?: string }).youtube_url ?? ''}
          onNext={onManualNext}
        />
      )

    case 'form':
      return (
        <StepForm
          fields={(config as { fields?: unknown[] }).fields as never ?? []}
          onNext={(responses) => {
            onFormResponse(step.id, responses)
            onManualNext()
          }}
        />
      )

    case 'body_map':
      return (
        <StepBodyMap
          onNext={(response) => {
            onFormResponse(step.id, response as Record<string, unknown>)
            onManualNext()
          }}
        />
      )

    case 'external_embed':
      return (
        <StepExternalEmbed
          url={(config as { url?: string }).url ?? ''}
          label={(config as { label?: string }).label ?? 'Buka Aktivitas'}
          onNext={onManualNext}
        />
      )

    case 'game':
      return (
        <StepGame onNext={onManualNext} />
      )

    default:
      return null
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StepperExercise({
  instructions,
  sessionName,
  sessionSlug,
  sessionImageCover,
  onDone,
  onBack,
}: Props) {
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

  // Stored form responses across the session
  const [formResponses, setFormResponses] = useState<Record<string, Record<string, unknown>>>({})

  useExerciseFullscreen()

  const bgmButtonRef = useRef<HTMLButtonElement>(null)
  const bgmButtonMobileRef = useRef<HTMLButtonElement>(null)
  const [trayRect, setTrayRect] = useState<DOMRect | null>(null)
  const [trayMobile, setTrayMobile] = useState(false)

  const bgm = useBGMPlayer()
  const narration = useNarrationPlayback()

  const { isBGMStopped, load: bgmLoad, play: bgmPlay, pause: bgmPause, resume: bgmResume, stop: bgmStop, switchTrack: bgmSwitchTrack } = bgm
  const { playNarration, pauseNarration, resumeNarration, stopNarration, fadeMute } = narration

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bgmStartedRef = useRef(false)
  const prevIsPlayingRef = useRef(isPlaying)
  const narrationStartedRef = useRef(false)
  const isMutedRef = useRef(isMuted)

  const step = instructions[currentStep]
  const totalSteps = instructions.length
  const isTimed = TIMED_TYPES.includes(step.step_type)
  const isManual = isManualStep(step.step_type)
  const progress = isTimed ? Math.min((elapsed / step.duration_seconds) * 100, 100) : 0
  const isLastStep = currentStep === totalSteps - 1
  const circumference = 2 * Math.PI * 44
  const strokeDashoffset = circumference * (1 - progress / 100)
  const currentTrack = tracks[currentTrackIndex]

  // ── Form response handler ─────────────────────────────────────
  const handleFormResponse = useCallback((stepId: string, responses: Record<string, unknown>) => {
    setFormResponses((prev) => ({ ...prev, [stepId]: responses }))
    // TODO: persist to session_form_responses table here
  }, [])

  // ── Navigation ────────────────────────────────────────────────
  const handleBack = () => {
    if (onBack) onBack()
    else router.push(`/session/${sessionSlug}`)
  }

  const goNext = useCallback(() => {
    narrationStartedRef.current = false
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setElapsed(0)
    } else {
      setIsPlaying(false)
      bgmStop()
      setTimeout(() => onDone(), 600)
    }
  }, [currentStep, totalSteps, onDone, bgmStop])

  const goPrev = () => {
    if (currentStep > 0) {
      setIsLooping(false)
      narrationStartedRef.current = false
      setCurrentStep((s) => s - 1)
      setElapsed(0)
    }
  }

  const jumpToStep = (i: number) => {
    setIsLooping(false)
    narrationStartedRef.current = false
    setCurrentStep(i)
    setElapsed(0)
  }

  // ── 1. Fetch BGM ──────────────────────────────────────────────
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
        setTimeout(() => setIsReady(true), 9000)
      }
    }
    init()
  }, [bgmLoad])

  // ── 2. Prefetch narration ─────────────────────────────────────
  useEffect(() => {
    const ahead = 3
    for (let i = 0; i <= ahead && currentStep + i < totalSteps; i++) {
      const url = instructions[currentStep + i]?.audio
      if (url) {
        const a = new Audio()
        a.crossOrigin = 'anonymous'
        a.src = url
        a.preload = 'auto'
      }
    }
  }, [currentStep, totalSteps, instructions])

  // ── 3. BGM autoplay ───────────────────────────────────────────
  useEffect(() => {
    if (!isReady || bgmStartedRef.current) return
    const tryPlay = async () => {
      if (bgmStartedRef.current) return
      try { await bgmPlay(); bgmStartedRef.current = true } catch {}
    }
    tryPlay()
    const onGesture = async () => {
      if (bgmStartedRef.current) return
      try { await bgmPlay(); bgmStartedRef.current = true } catch (err) {
        console.warn('[BGM] gesture play failed:', err)
      }
    }
    document.addEventListener('click', onGesture, { once: true })
    document.addEventListener('touchstart', onGesture, { once: true })
    return () => {
      document.removeEventListener('click', onGesture)
      document.removeEventListener('touchstart', onGesture)
    }
  }, [isReady, bgmPlay])

  // ── 4. Sync play/pause ────────────────────────────────────────
  useEffect(() => {
    if (!bgmStartedRef.current) return
    if (isPlaying === prevIsPlayingRef.current) return
    prevIsPlayingRef.current = isPlaying
    if (!isPlaying) {
      bgmPause()
      pauseNarration()
    } else {
      if (!isBGMStopped) bgmResume()
      if (narrationStartedRef.current) resumeNarration()
    }
  }, [isPlaying, isBGMStopped, bgmPause, bgmResume, pauseNarration, resumeNarration])

  // ── 5. Narration — only for narration steps ───────────────────
  useEffect(() => {
    if (!isReady || !isTimed || !step.audio) return
    narrationStartedRef.current = true
    playNarration(step.audio, isMutedRef.current)
    return () => stopNarration()
  }, [currentStep, narrationKey, isReady, isTimed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stop narration when leaving a narration step
  useEffect(() => {
    if (!isTimed) stopNarration()
  }, [currentStep, isTimed, stopNarration])

  // ── 6. Mute fade ──────────────────────────────────────────────
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return }
    isMutedRef.current = isMuted
    fadeMute(isMuted)
  }, [isMuted]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer — only for timed steps ─────────────────────────────
  const handleTimerEnd = useCallback(() => {
    if (isLooping) {
      setElapsed(0)
      setNarrationKey((k) => k + 1)
    } else {
      goNext()
    }
  }, [isLooping, goNext])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && isReady && isTimed)
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, isReady, isTimed])

  useEffect(() => {
    if (isTimed && elapsed >= step.duration_seconds) handleTimerEnd()
  }, [elapsed, step.duration_seconds, handleTimerEnd, isTimed])

  useEffect(() => {
    setElapsed(0); setIsPlaying(true); setNarrationKey(0)
    narrationStartedRef.current = false
  }, [currentStep])

  // ── Time helpers ──────────────────────────────────────────────
  const currentSeconds = Math.min(elapsed, step.duration_seconds)
  const displayMins = String(Math.floor(currentSeconds / 60)).padStart(2, '0')
  const displaySecs = String(currentSeconds % 60).padStart(2, '0')
  const totalMins = Math.floor(step.duration_seconds / 60)
  const totalSecs = step.duration_seconds % 60
  const totalTime = `${totalMins}:${totalSecs.toString().padStart(2, '0')}`

  // ── BGM display ───────────────────────────────────────────────
  const bgmLabel = isBGMStopped ? 'Tanpa Musik' : currentTrack ? currentTrack.title : 'Musik Latar'
  const bgmSublabel = (!isBGMStopped && currentTrack?.composer) ? currentTrack.composer : null

  const openMusicTray = (ref: React.RefObject<HTMLButtonElement | null>, isMobile: boolean) => {
    if (ref.current) {
      setTrayRect(ref.current.getBoundingClientRect())
      setTrayMobile(isMobile)
    }
    setShowMusicTray((v) => !v)
  }

  // ── Loading ───────────────────────────────────────────────────
  if (!isReady) {
    return (
      <LoadingScreen
        sessionName={sessionName}
        sessionImageCover={sessionImageCover}
        firstStep={instructions[0]}
      />
    )
  }

  // ── Music Tray ────────────────────────────────────────────────
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
        <div style={style} className="bg-background/90 dark:bg-foreground/90 text-foreground/80 dark:text-background/80 border border-muted-foreground 2md:rounded-2xl rounded-lg p-2.5 flex flex-col gap-0.5 w-full animate-in slide-in-from-top-1 duration-150">
          <span className="text-xs font-bold tracking-[0.18em] uppercase px-2 pb-1.5">Musik Latar</span>
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => { setCurrentTrackIndex(index); bgmSwitchTrack(track.audio_url); setShowMusicTray(false) }}
              className={cn(
                'flex items-center gap-2.5 w-full px-2.5 py-2 2md:rounded-xl rounded-md text-left transition-all duration-150 ease-out',
                index === currentTrackIndex && !isBGMStopped ? 'bg-muted-foreground/40' : 'hover:bg-muted-foreground/40'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/40" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground dark:text-background">{track.title}</span>
                {track.composer && <span className="text-xs text-foreground dark:text-background">{track.composer}</span>}
              </div>
            </button>
          ))}
          <div className="m-1 px-2 bg-muted-foreground/25 dark:bg-background/20 min-w-0 h-0.5" />
          <button
            onClick={() => { bgmStop(); setShowMusicTray(false) }}
            className={cn(
              'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-all duration-150 ease-out',
              isBGMStopped ? 'bg-muted-foreground/40' : 'hover:bg-muted-foreground/40'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/40" />
            <span className="text-xs font-semibold text-foreground dark:text-background">Tanpa Musik</span>
          </button>
        </div>
      </>
    )
  }

  // ── Playback controls bar (narration steps only) ──────────────
  const PlaybackControls = ({ dark }: { dark?: boolean }) => {
    if (isManual) return null
    const textColor = dark ? 'text-muted-foreground dark:text-background' : 'text-muted-foreground'
    return (
      <div className={cn('flex items-center gap-4', dark && 'bg-background/90 dark:bg-foreground/90 rounded-full px-2 py-1.5')}>
        <Button onClick={goPrev} disabled={currentStep === 0} size="sm" variant="ghost"
          className={cn('[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full', textColor, 'disabled:opacity-30 disabled:cursor-not-allowed')}>
          <ArrowLeftIcon weight="bold" /> Sebelumnya
        </Button>

        <Button onClick={() => setIsLooping((l) => !l)} variant="ghost" size="sm"
          className={cn('[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full', textColor, isLooping && 'border border-muted-foreground bg-foreground/10')}>
          {isLooping ? <RepeatOnceIcon weight="fill" /> : <RepeatIcon weight="fill" />}
          Ulangi
        </Button>

        <Button onClick={() => setIsMuted((m) => !m)} size="sm" variant="ghost"
          className={cn('[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full', textColor, isMuted && 'border border-muted-foreground bg-foreground/10')}>
          {isMuted ? <SpeakerSlashIcon weight="fill" /> : <SpeakerHighIcon weight="fill" />}
          {isMuted ? 'Tanpa Suara' : 'Dengan Suara'}
        </Button>

        {isLastStep ? (
          <Button onClick={goNext} variant="ghost" size="sm"
            className={cn('[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full', textColor)}>
            Selesai <CheckIcon weight="bold" />
          </Button>
        ) : (
          <Button onClick={goNext} variant="ghost" size="sm"
            className={cn('[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full', textColor)}>
            Berikutnya <ArrowRightIcon weight="bold" />
          </Button>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // MOBILE
  // ─────────────────────────────────────────────────────────────
  const MobileLayout = () => (
    <div className="2md:hidden fixed inset-0 z-55 flex 2xs:justify-start justify-center flex-col 2xs:gap-3 gap-6 bg-celeste p-6 overflow-y-auto">
      {/* Top bar */}
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

      {/* Step label */}
      <div className="text-center shrink-0">
        <span className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">
          Langkah {currentStep + 1} / {totalSteps}
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <StepContent
          step={step}
          isMobile={true}
          onManualNext={goNext}
          onFormResponse={handleFormResponse}
        />
      </div>

      {/* Controls — only for narration steps */}
      {isTimed && (
        <>
          <div className="flex items-center 2xs:justify-between justify-center 2xs:gap-6 gap-3 w-full shrink-0">
            <Button onClick={() => setIsLooping((l) => !l)} variant="ghost" size="sm"
              className={cn('[&_svg]:size-5 p-2', isLooping ? 'text-foreground' : 'text-muted-foreground')}>
              {isLooping ? <RepeatOnceIcon weight="fill" /> : <RepeatIcon weight="fill" />}
            </Button>

            <div className="flex-1 flex flex-row 2xs:gap-13 gap-3 justify-center items-center">
              <Button onClick={goPrev} disabled={currentStep === 0} size="sm" variant="default"
                className="[&_svg]:size-5 px-2 py-2 text-muted-foreground rounded-full bg-transparent border-none hover:bg-foreground/10 disabled:cursor-not-allowed">
                <ArrowLeftIcon weight="bold" />
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
                className="[&_svg]:size-5 px-2 py-2 text-muted-foreground rounded-full bg-transparent border-none hover:bg-foreground/10">
                <ArrowRightIcon weight="bold" />
              </Button>
            </div>

            <Button onClick={() => setIsMuted((m) => !m)} size="sm" variant="ghost"
              className={cn('[&_svg]:size-5 p-2', isMuted ? 'text-foreground' : 'text-muted-foreground')}>
              {isMuted ? <SpeakerSlashIcon weight="fill" /> : <SpeakerHighIcon weight="fill" />}
            </Button>
          </div>

          <p className="xs:text-sm text-xs text-center font-medium text-muted-foreground/60 shrink-0">
            <span className="text-foreground/80 font-medium">{displayMins}:{displaySecs}</span>
            <span className="mx-1 text-muted-foreground/30">/</span>
            <span>{totalTime}</span>
          </p>
        </>
      )}

      <p className="xs:text-p text-sm text-muted-foreground/40 text-center font-semibold">DMAI - {sessionName} Session</p>
    </div>
  )

  // ─────────────────────────────────────────────────────────────
  // DESKTOP
  // ─────────────────────────────────────────────────────────────
  const DesktopLayout = () => (
    <div className="hidden 2md:flex fixed inset-0 z-55 items-stretch justify-stretch lg:px-28 px-12 lg:py-14 py-8 bg-celeste">
      <div className="flex flex-col items-center w-full rounded-4xl relative overflow-hidden flex-1">

        {/* Background image — narration steps only */}
        {step.step_type === 'narration' && step.image && (
          <div className="absolute inset-0 z-0">
            <Image src={step.image} alt={step.title} fill unoptimized priority
              className="object-cover object-center rounded-4xl" />
            <div className="absolute inset-0 rounded-4xl bg-black/25" />
            <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/50 to-transparent rounded-t-4xl" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/50 to-transparent rounded-b-4xl" />
          </div>
        )}

        {/* Non-narration steps: solid bg */}
        {step.step_type !== 'narration' && (
          <div className="absolute inset-0 z-0 bg-foreground/5 rounded-4xl" />
        )}

        {/* Content layer */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full w-full py-8 px-6">

          {/* Top bar */}
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex-1 flex justify-start">
              <Button onClick={handleBack} variant="link"
                className={cn('flex items-center gap-1 justify-center', step.step_type === 'narration' ? 'text-background dark:text-foreground' : 'text-foreground')}>
                <ArrowLeftIcon weight="bold" className="w-4 h-4" /> Kembali
              </Button>
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-3">
              {instructions.map((instr, i) => (
                <button key={i} onClick={() => jumpToStep(i)}
                  className="flex flex-col items-center gap-1 group transition-all duration-200 ease-out cursor-pointer">
                  <span className={cn(
                    'block h-1 rounded-full transition-all duration-300',
                    step.step_type === 'narration'
                      ? i === currentStep ? 'w-8 bg-background/90' : i < currentStep ? 'w-4 bg-background/55' : 'w-4 bg-background/30'
                      : i === currentStep ? 'w-8 bg-foreground/90' : i < currentStep ? 'w-4 bg-foreground/55' : 'w-4 bg-foreground/30'
                  )} />
                </button>
              ))}
            </div>

            {/* BGM pill */}
            <div className="flex-1 flex justify-end">
              <button ref={bgmButtonRef} onClick={() => openMusicTray(bgmButtonRef, false)}
                className="flex items-center gap-3 px-4 py-2 2md:rounded-2xl rounded-lg bg-background/90 dark:bg-foreground/90 text-foreground/80 dark:text-background/80 hover:bg-popover/90 border border-foreground hover:cursor-pointer transition-all w-60">
                <MusicNotesIcon weight="fill" className={cn('w-3.5 h-3.5 shrink-0', isBGMStopped ? 'opacity-40' : 'opacity-100')} />
                <div className="flex flex-1 flex-col min-w-0 text-left">
                  <span className="text-xs font-semibold truncate max-w-42">{bgmLabel}</span>
                  {bgmSublabel && <span className="text-xs truncate max-w-42">{bgmSublabel}</span>}
                </div>
                <CaretDownIcon weight="bold" className={cn('w-4 h-4 shrink-0 transition-transform duration-200', showMusicTray && !trayMobile && 'rotate-180')} />
              </button>
            </div>
          </div>

          {/* Middle content */}
          <div className="flex flex-1 flex-col justify-center items-center gap-4 w-full">
            <span className={cn('text-xs font-semibold tracking-[0.2em] uppercase',
              step.step_type === 'narration' ? 'text-background/80' : 'text-foreground/60')}>
              Langkah {currentStep + 1} / {totalSteps}
            </span>

            {/* Narration: ring + text */}
            {isTimed && (
              <>
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

                <p className="xs:text-p/5 text-sm/4 tracking-wide font-medium -mt-2">
                  <span className="text-white/90">{displayMins}:{displaySecs}</span>
                  <span className="text-white/30 mx-1">/</span>
                  <span className="text-white/50">{totalTime}</span>
                </p>
              </>
            )}

            {/* Step content */}
            <div className={cn('w-full flex items-center justify-center', isTimed ? 'max-w-xl' : 'flex-1')}>
              <StepContent
                step={step}
                isMobile={false}
                onManualNext={goNext}
                onFormResponse={handleFormResponse}
              />
            </div>
          </div>

          {/* Bottom controls */}
          <div className="flex flex-col items-center gap-3.5 px-3">
            <PlaybackControls dark />
            <p className={cn('lg:text-p text-sm font-semibold',
              step.step_type === 'narration' ? 'text-white/40' : 'text-foreground/30')}>
              DMAI - {sessionName} Session
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <MobileLayout />
      <DesktopLayout />
      {showMusicTray && <MusicTray />}
    </>
  )
}