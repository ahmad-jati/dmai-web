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

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// Only narration steps use the timed player + audio
function isTimedStep(type: StepType) {
  return type === 'narration'
}

// All other steps advance manually via their own CTA button
function isManualStep(type: StepType) {
  return type !== 'narration'
}

const STEP_TYPE_LABEL: Record<StepType, string> = {
  narration: 'Narasi',
  form: 'Form',
  video: 'Video',
  body_map: 'Body Map',
  external_embed: 'Aktivitas',
  game: 'Mini Game',
}

// ─── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen({
  sessionName,
  sessionImageCover,
}: {
  sessionName: string
  sessionImageCover: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 lg:px-28 px-12 lg:py-14 py-8 bg-celeste">
      <p className="text-sm text-muted-foreground font-semibold">DMAI - Session</p>
      <h1 className="md:text-3xl text-2xl text-center font-semibold">{sessionName}</h1>
      <div className="relative md:w-80 w-56 aspect-square 2xs:rounded-3xl rounded-xl overflow-hidden">
        <Image
          src={sessionImageCover}
          alt={sessionName}
          fill
          unoptimized
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/60 to-transparent" />
      </div>
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Spinner className="text-muted-foreground" />
        <p className="text-sm font-medium tracking-wide">Mempersiapkan sesi…</p>
      </div>
    </div>
  )
}

// ─── Step Content Router ────────────────────────────────────────────────────────

function StepContent({
  step,
  onManualNext,
  onFormResponse,
}: {
  step: SessionInstruction
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
      return <StepGame onNext={onManualNext} />
    default:
      return null
  }
}

// ─── Narration Controls (BGM + playback) ────────────────────────────────────────

function NarrationControls({
  isPlaying,
  isMuted,
  isLooping,
  elapsed,
  duration,
  onPlayPause,
  onMuteToggle,
  onLoopToggle,
  circumference,
  strokeDashoffset,
}: {
  isPlaying: boolean
  isMuted: boolean
  isLooping: boolean
  elapsed: number
  duration: number
  onPlayPause: () => void
  onMuteToggle: () => void
  onLoopToggle: () => void
  circumference: number
  strokeDashoffset: number
}) {
  const currentSeconds = Math.min(elapsed, duration)
  const displayMins = String(Math.floor(currentSeconds / 60)).padStart(2, '0')
  const displaySecs = String(currentSeconds % 60).padStart(2, '0')
  const totalMins = Math.floor(duration / 60)
  const totalSecs = duration % 60
  const totalTime = `${totalMins}:${totalSecs.toString().padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Progress ring */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
          <circle
            cx="50" cy="50" r="44"
            fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="3"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <button
          onClick={onPlayPause}
          className="relative z-10 w-13 h-13 rounded-full flex items-center justify-center bg-background text-foreground transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          {isPlaying
            ? <PauseIcon weight="fill" className="w-5 h-5" />
            : <PlayIcon weight="fill" className="w-5 h-5" />
          }
        </button>
      </div>

      {/* Timer */}
      <p className="text-xs font-medium text-muted-foreground tabular-nums">
        <span className="text-foreground">{displayMins}:{displaySecs}</span>
        <span className="mx-1 opacity-40">/</span>
        <span>{totalTime}</span>
      </p>

      {/* Secondary controls */}
      <div className="flex items-center gap-1">
        <Button
          onClick={onLoopToggle}
          variant="ghost" size="sm"
          className={cn(
            '[&_svg]:size-4 px-3 py-1.5 rounded-full text-xs gap-1.5',
            isLooping ? 'bg-foreground/10 text-foreground font-semibold' : 'text-muted-foreground'
          )}
        >
          {isLooping ? <RepeatOnceIcon weight="fill" /> : <RepeatIcon weight="fill" />}
          Ulangi
        </Button>
        <Button
          onClick={onMuteToggle}
          variant="ghost" size="sm"
          className={cn(
            '[&_svg]:size-4 px-3 py-1.5 rounded-full text-xs gap-1.5',
            isMuted ? 'bg-foreground/10 text-foreground font-semibold' : 'text-muted-foreground'
          )}
        >
          {isMuted ? <SpeakerSlashIcon weight="fill" /> : <SpeakerHighIcon weight="fill" />}
          {isMuted ? 'Tanpa Suara' : 'Dengan Suara'}
        </Button>
      </div>
    </div>
  )
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
  const isTimed = isTimedStep(step.step_type)
  const isManual = isManualStep(step.step_type)
  const isLastStep = currentStep === totalSteps - 1
  const circumference = 2 * Math.PI * 44
  const progress = isTimed ? Math.min((elapsed / step.duration_seconds) * 100, 100) : 0
  const strokeDashoffset = circumference * (1 - progress / 100)
  const currentTrack = tracks[currentTrackIndex]

  const handleFormResponse = useCallback((stepId: string, responses: Record<string, unknown>) => {
    setFormResponses((prev) => ({ ...prev, [stepId]: responses }))
  }, [])

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

  // 1. Fetch BGM — 5s splash max
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

  // 2. Prefetch narration
  useEffect(() => {
    for (let i = 0; i <= 3 && currentStep + i < totalSteps; i++) {
      const url = instructions[currentStep + i]?.audio
      if (url) {
        const a = new Audio()
        a.crossOrigin = 'anonymous'
        a.src = url
        a.preload = 'auto'
      }
    }
  }, [currentStep, totalSteps, instructions])

  // 3. BGM autoplay
  useEffect(() => {
    if (!isReady || bgmStartedRef.current) return
    const tryPlay = async () => {
      if (bgmStartedRef.current) return
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
  }, [isReady, bgmPlay])

  // 4. Sync play/pause
  useEffect(() => {
    if (!bgmStartedRef.current) return
    if (isPlaying === prevIsPlayingRef.current) return
    prevIsPlayingRef.current = isPlaying
    if (!isPlaying) {
      bgmPause(); pauseNarration()
    } else {
      if (!isBGMStopped) bgmResume()
      if (narrationStartedRef.current) resumeNarration()
    }
  }, [isPlaying, isBGMStopped, bgmPause, bgmResume, pauseNarration, resumeNarration])

  // 5. Narration — only for narration steps
  useEffect(() => {
    if (!isReady || !isTimed || !step.audio) return
    narrationStartedRef.current = true
    playNarration(step.audio, isMutedRef.current)
    return () => stopNarration()
  }, [currentStep, narrationKey, isReady, isTimed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isTimed) stopNarration()
  }, [currentStep, isTimed, stopNarration])

  // 6. Mute fade
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return }
    isMutedRef.current = isMuted
    fadeMute(isMuted)
  }, [isMuted]) // eslint-disable-line react-hooks/exhaustive-deps

  // 7. Timer — timed steps only
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
    if (isTimed && elapsed >= step.duration_seconds) handleTimerEnd()
  }, [elapsed, step.duration_seconds, handleTimerEnd, isTimed])

  useEffect(() => {
    setElapsed(0); setIsPlaying(true); setNarrationKey(0)
    narrationStartedRef.current = false
  }, [currentStep])

  // BGM display
  const bgmLabel = isBGMStopped ? 'Tanpa Musik' : currentTrack?.title ?? 'Musik Latar'
  const bgmSublabel = (!isBGMStopped && currentTrack?.composer) ? currentTrack.composer : null

  const openMusicTray = (ref: React.RefObject<HTMLButtonElement | null>, mobile: boolean) => {
    if (ref.current) { setTrayRect(ref.current.getBoundingClientRect()); setTrayMobile(mobile) }
    setShowMusicTray((v) => !v)
  }

  // Loading
  if (!isReady) {
    return <LoadingScreen sessionName={sessionName} sessionImageCover={sessionImageCover} />
  }

  // Music tray
  const MusicTray = () => {
    if (!trayRect) return null
    return (
      <>
        <div className="fixed inset-0 z-[60]" onClick={() => setShowMusicTray(false)} />
        <div
          style={{ position: 'fixed', top: trayRect.bottom + 8, right: window.innerWidth - trayRect.right, zIndex: 61, width: 240 }}
          className="bg-background border border-border rounded-2xl p-2.5 flex flex-col gap-0.5 shadow-lg animate-in slide-in-from-top-1 duration-150"
        >
          <span className="text-xs font-bold tracking-[0.18em] uppercase px-2 pb-1.5 text-muted-foreground">Musik Latar</span>
          {tracks.map((track, index) => (
            <button key={track.id}
              onClick={() => { setCurrentTrackIndex(index); bgmSwitchTrack(track.audio_url); setShowMusicTray(false) }}
              className={cn('flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-colors',
                index === currentTrackIndex && !isBGMStopped ? 'bg-muted' : 'hover:bg-muted'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-foreground/30" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground">{track.title}</span>
                {track.composer && <span className="text-xs text-muted-foreground">{track.composer}</span>}
              </div>
            </button>
          ))}
          <div className="mx-2 my-1 h-px bg-border" />
          <button
            onClick={() => { bgmStop(); setShowMusicTray(false) }}
            className={cn('flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-colors',
              isBGMStopped ? 'bg-muted' : 'hover:bg-muted'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-foreground/30" />
            <span className="text-xs font-semibold text-foreground">Tanpa Musik</span>
          </button>
        </div>
      </>
    )
  }

  // ── Shared top bar ──────────────────────────────────────────────────────────
  const TopBar = ({ dark = false }: { dark?: boolean }) => (
    <div className={cn('flex items-center justify-between gap-3 w-full', dark ? 'text-background' : 'text-foreground')}>
      {/* Back */}
      <Button onClick={handleBack} variant="ghost" size="sm"
        className={cn('[&_svg]:size-4 gap-1.5 rounded-full px-3', dark ? 'text-background/80 hover:bg-white/10 hover:text-background' : 'text-foreground hover:bg-foreground/10')}>
        <ArrowLeftIcon weight="bold" /> Kembali
      </Button>

      {/* Step info */}
      <div className="flex flex-col items-center gap-0.5">
        <span className={cn('text-xs font-semibold tracking-wide', dark ? 'text-background/60' : 'text-muted-foreground')}>
          Langkah {currentStep + 1} / {totalSteps}
        </span>
        <span className={cn('text-xs font-bold', dark ? 'text-background/90' : 'text-foreground')}>
          {STEP_TYPE_LABEL[step.step_type]}
        </span>
      </div>

      {/* BGM — only for narration, or just spacer for others */}
      {isTimed ? (
        <button
          ref={bgmButtonRef}
          onClick={() => openMusicTray(bgmButtonRef, false)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
            dark
              ? 'bg-white/10 border-white/20 text-background/80 hover:bg-white/20'
              : 'bg-muted border-border text-foreground hover:bg-muted/80'
          )}
        >
          <MusicNotesIcon weight="fill" className={cn('w-3 h-3', isBGMStopped ? 'opacity-40' : '')} />
          <span className="max-w-24 truncate">{bgmLabel}</span>
          <CaretDownIcon weight="bold" className={cn('w-3 h-3 transition-transform', showMusicTray && 'rotate-180')} />
        </button>
      ) : (
        <div className="w-24" /> // spacer to keep step info centered
      )}
    </div>
  )

  // ── Shared bottom nav ────────────────────────────────────────────────────────
  // Only shown for narration steps — manual steps have their own CTA in the content
  const BottomNav = ({ dark = false }: { dark?: boolean }) => {
    if (isManual) return null
    const baseBtn = cn(
      '[&_svg]:size-4 gap-1.5 rounded-full px-4 py-2 text-sm font-medium',
      dark
        ? 'text-background/80 hover:bg-white/10 hover:text-background disabled:opacity-30'
        : 'text-foreground hover:bg-foreground/10 disabled:opacity-30'
    )
    return (
      <div className="flex items-center justify-between w-full">
        <Button onClick={goPrev} disabled={currentStep === 0} variant="ghost" size="sm" className={baseBtn}>
          <ArrowLeftIcon weight="bold" /> Sebelumnya
        </Button>
        {isLastStep ? (
          <Button onClick={goNext} variant="ghost" size="sm" className={baseBtn}>
            Selesai <CheckIcon weight="bold" />
          </Button>
        ) : (
          <Button onClick={goNext} variant="ghost" size="sm" className={baseBtn}>
            Berikutnya <ArrowRightIcon weight="bold" />
          </Button>
        )}
      </div>
    )
  }

  // ── Step dots ────────────────────────────────────────────────────────────────
  const StepDots = ({ dark = false }: { dark?: boolean }) => (
    <div className="flex items-center gap-2">
      {instructions.map((_, i) => (
        <button key={i} onClick={() => jumpToStep(i)}
          className={cn('block h-1 rounded-full transition-all duration-300 cursor-pointer',
            dark
              ? i === currentStep ? 'w-8 bg-background/90' : i < currentStep ? 'w-4 bg-background/50' : 'w-4 bg-background/25'
              : i === currentStep ? 'w-8 bg-foreground/90' : i < currentStep ? 'w-4 bg-foreground/50' : 'w-4 bg-foreground/20'
          )}
        />
      ))}
    </div>
  )

  // ════════════════════════════════════════════════════════════════════
  // NARRATION LAYOUT — full bleed image bg, dark overlay, player controls
  // ════════════════════════════════════════════════════════════════════
  if (isTimed) {
    return (
      <>
        {/* MOBILE narration */}
        <div className="2md:hidden fixed inset-0 z-55 flex flex-col bg-celeste p-4 gap-3 overflow-y-auto">
          <TopBar dark={false} />
          <StepDots dark={false} />

          {/* Image + text content */}
          <div className="flex-1 flex flex-col">
            <StepNarration title={step.title} description={step.description} image={step.image} />
          </div>

          {/* Player */}
          <NarrationControls
            isPlaying={isPlaying} isMuted={isMuted} isLooping={isLooping}
            elapsed={elapsed} duration={step.duration_seconds}
            onPlayPause={() => setIsPlaying((p) => !p)}
            onMuteToggle={() => setIsMuted((m) => !m)}
            onLoopToggle={() => setIsLooping((l) => !l)}
            circumference={circumference} strokeDashoffset={strokeDashoffset}
          />
          <BottomNav dark={false} />
          <p className="text-xs text-muted-foreground/40 text-center font-semibold">DMAI - {sessionName}</p>
        </div>

        {/* DESKTOP narration */}
        <div className="hidden 2md:flex fixed inset-0 z-55 items-stretch justify-stretch lg:px-28 px-12 lg:py-14 py-8 bg-celeste">
          <div className="flex flex-col items-center w-full rounded-4xl relative overflow-hidden flex-1">
            {/* Background image */}
            <div className="absolute inset-0 z-0">
              <Image src={step.image} alt={step.title} fill unoptimized priority className="object-cover object-center rounded-4xl" />
              <div className="absolute inset-0 rounded-4xl bg-black/25" />
              <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/50 to-transparent rounded-t-4xl" />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/50 to-transparent rounded-b-4xl" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-between h-full w-full py-8 px-8 gap-6">
              <TopBar dark={true} />
              <StepDots dark={true} />

              {/* Middle: text */}
              <div className="flex flex-1 flex-col justify-center items-center gap-4 w-full">
                <StepNarration title={step.title} description={step.description} image={step.image} />
              </div>

              {/* Player */}
              <div className="flex flex-col items-center gap-4 w-full">
                <NarrationControls
                  isPlaying={isPlaying} isMuted={isMuted} isLooping={isLooping}
                  elapsed={elapsed} duration={step.duration_seconds}
                  onPlayPause={() => setIsPlaying((p) => !p)}
                  onMuteToggle={() => setIsMuted((m) => !m)}
                  onLoopToggle={() => setIsLooping((l) => !l)}
                  circumference={circumference} strokeDashoffset={strokeDashoffset}
                />
                <BottomNav dark={true} />
                <p className="text-xs text-white/30 font-semibold">DMAI - {sessionName}</p>
              </div>
            </div>
          </div>
        </div>

        {showMusicTray && <MusicTray />}
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // NON-NARRATION LAYOUT — clean white/light shell, content center stage
  // ════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* MOBILE non-narration */}
      <div className="2md:hidden fixed inset-0 z-55 flex flex-col bg-background p-4 gap-4 overflow-y-auto">
        <TopBar dark={false} />
        <StepDots dark={false} />

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center py-4">
          <StepContent
            step={step}
            onManualNext={goNext}
            onFormResponse={handleFormResponse}
          />
        </div>

        <p className="text-xs text-muted-foreground/40 text-center font-semibold shrink-0">DMAI - {sessionName}</p>
      </div>

      {/* DESKTOP non-narration */}
      <div className="hidden 2md:flex fixed inset-0 z-55 items-stretch justify-stretch lg:px-28 px-12 lg:py-14 py-8 bg-muted/30">
        <div className="flex flex-col items-center w-full rounded-4xl bg-background border border-border overflow-hidden flex-1">
          <div className="flex flex-col items-center justify-between h-full w-full py-8 px-8 gap-6">
            <TopBar dark={false} />
            <StepDots dark={false} />

            {/* Content — scrollable if needed */}
            <div className="flex-1 w-full flex items-center justify-center overflow-y-auto py-4">
              <StepContent
                step={step}
                onManualNext={goNext}
                onFormResponse={handleFormResponse}
              />
            </div>

            <p className="text-xs text-muted-foreground/40 font-semibold shrink-0">DMAI - {sessionName}</p>
          </div>
        </div>
      </div>
    </>
  )
}