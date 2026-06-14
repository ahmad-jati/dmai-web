'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  RepeatIcon, SpeakerSlashIcon, SpeakerHighIcon,
  PauseIcon, PlayIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon,
  RepeatOnceIcon, MusicNotesIcon, CaretDownIcon,
} from "@phosphor-icons/react"
import type { SessionInstruction } from "@/lib/data-detail-session"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useBGMPlayer } from "@/lib/hooks/useBGMPlayer"
import { useNarrationPlayback } from "@/lib/hooks/useNarrationPlayback"
import { useExerciseFullscreen } from "@/lib/hooks/useExerciseFullscreen"
import { Spinner } from "./ui/spinner"

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
  onDone: () => void
  onBack?: () => void
}

export function StepperExercise({ instructions, sessionName, sessionSlug, onDone, onBack }: Props) {
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

  // Fullscreen: hides navbar/footer while exercise is active (both mobile & desktop)
  useExerciseFullscreen()

  // Ref for the BGM trigger button — used to position the fixed tray
  const bgmButtonRef = useRef<HTMLButtonElement>(null)
  const bgmButtonMobileRef = useRef<HTMLButtonElement>(null)
  const [trayRect, setTrayRect] = useState<DOMRect | null>(null)
  const [trayMobile, setTrayMobile] = useState(false)

  const bgm = useBGMPlayer()
  const narration = useNarrationPlayback()

  const {
    isBGMStopped,
    load: bgmLoad,
    play: bgmPlay,
    pause: bgmPause,
    resume: bgmResume,
    stop: bgmStop,
    switchTrack: bgmSwitchTrack,
  } = bgm

  const { playNarration, pauseNarration, resumeNarration, stopNarration, fadeMute } = narration

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bgmStartedRef = useRef(false)
  const prevIsPlayingRef = useRef(isPlaying)
  // Track whether narration has started for the current step (for pause/resume logic)
  const narrationStartedRef = useRef(false)
  // Ref mirror of isMuted — lets effect #5 always read the current mute state
  // without adding isMuted as a dep (which would restart narration on every toggle).
  const isMutedRef = useRef(isMuted)

  const step = instructions[currentStep]
  const totalSteps = instructions.length
  const progress = Math.min((elapsed / step.duration_seconds) * 100, 100)
  const isLastStep = currentStep === totalSteps - 1
  const circumference = 2 * Math.PI * 44
  const strokeDashoffset = circumference * (1 - progress / 100)
  const currentTrack = tracks[currentTrackIndex]

  // ── Back navigation ───────────────────────────────────────────
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push(`/session/${sessionSlug}`)
    }
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
        // 4-second splash before marking ready
        // 9scd
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
  // Pause/resume narration instead of stop/replay from beginning
  useEffect(() => {
    if (!bgmStartedRef.current) return
    if (isPlaying === prevIsPlayingRef.current) return
    prevIsPlayingRef.current = isPlaying
    if (!isPlaying) {
      bgmPause()
      pauseNarration()
    } else {
      if (!isBGMStopped) bgmResume()
      // Resume narration from where it was paused (don't restart)
      if (narrationStartedRef.current) {
        resumeNarration()
      }
    }
  }, [isPlaying, isBGMStopped, bgmPause, bgmResume, pauseNarration, resumeNarration])

  // ── 5. Narration ──────────────────────────────────────────────
  // NOTE: isPlaying is intentionally NOT in deps — pause/resume is handled by
  // effect #4. isMuted is also excluded — we read isMutedRef.current instead so
  // toggling mute never restarts narration from the beginning.
  useEffect(() => {
    if (!isReady || !step.audio) return
    narrationStartedRef.current = true
    playNarration(step.audio, isMutedRef.current)
    return () => stopNarration()
  }, [currentStep, narrationKey, isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 6. Mute fade ────────────────────��─────────────────────────
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return }
    isMutedRef.current = isMuted  // sync ref before fading
    fadeMute(isMuted)
  }, [isMuted]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer ─────────────────────────────────────────────────────
  const handleTimerEnd = useCallback(() => {
    if (isLooping) {
      setElapsed(0)
      setNarrationKey((k) => k + 1)
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setElapsed(0)
    } else {
      setIsPlaying(false)
      bgmStop()
      setTimeout(() => onDone(), 600)
    }
  }, [currentStep, totalSteps, onDone, isLooping, bgmStop])

  const goNextManual = () => {
    setIsLooping(false)
    narrationStartedRef.current = false
    if (currentStep < totalSteps - 1) { setCurrentStep((s) => s + 1); setElapsed(0) }
    else { setIsPlaying(false); bgmStop(); setTimeout(() => onDone(), 600) }
  }
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

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && isReady)
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, isReady])

  useEffect(() => {
    if (elapsed >= step.duration_seconds) handleTimerEnd()
  }, [elapsed, step.duration_seconds, handleTimerEnd])

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

  // ── BGM display label ─────────────────────────────────────────
  const bgmLabel = isBGMStopped
    ? 'Tanpa Musik'
    : currentTrack
      ? currentTrack.title
      : 'Musik Latar'
  const bgmSublabel = (!isBGMStopped && currentTrack?.composer) ? currentTrack.composer : null

  // ── Open music tray ───────────────────────────────────────────
  const openMusicTray = (ref: React.RefObject<HTMLButtonElement | null>, isMobile: boolean) => {
    if (ref.current) {
      setTrayRect(ref.current.getBoundingClientRect())
      setTrayMobile(isMobile)
    }
    setShowMusicTray((v) => !v)
  }

  // ── Music tray ────────────────────────────────────────────────
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
        <div
          style={style}
          className="bg-background border border-muted-foreground 2md:rounded-2xl rounded-lg p-2.5 flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-150"
        >
          <span className="text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground px-2 pb-1.5">
            Musik Latar
          </span>

          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => { setCurrentTrackIndex(index); bgmSwitchTrack(track.audio_url); setShowMusicTray(false) }}
              className={cn(
                'flex items-center gap-2.5 w-full px-2.5 py-2 2md:rounded-xl rounded-md text-left transition-all duration-150 ease-out',
                index === currentTrackIndex && !isBGMStopped
                  ? 'bg-muted-foreground/15 text-foreground'
                  : 'text-foreground hover:bg-muted-foreground/15'
              )}
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0 transition-all',
                index === currentTrackIndex && !isBGMStopped ? 'bg-muted-foreground' : 'bg-muted-foreground/25'
              )} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate">{track.title}</span>
                {track.composer && (
                  <span className="text-xs text-foreground">{track.composer}</span>
                )}
              </div>
            </button>
          ))}

          <div className="mt-0.5 pt-1.5 border-t border-muted-foreground/25">
            <button
              onClick={() => { bgmStop(); setShowMusicTray(false) }}
              className={cn(
                'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-all duration-150 ease-out',
                isBGMStopped
                  ? 'bg-muted-foreground/15 text-foreground'
                  : 'text-foreground hover:bg-muted-foreground/15'
              )}
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                isBGMStopped ? 'bg-muted-foreground' : 'bg-muted-foreground/25'
              )} />
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Tanpa Musik</span>
              </div>
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Loading ───────────────────────────────────────────────────
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 lg:px-28 px-12 lg:py-14 py-8 bg-celeste">
        {/* Session name */}
        <p className="text-p text-muted-foreground -mb-2 text-center font-semibold">DMAI - Session</p>
        <h1 className="md:text-h1/8 text-2xl/7 text-center font-semibold">{sessionName}</h1>

        {/* Session picture */}
        <div className="relative md:w-100 w-60 aspect-square 2xs:rounded-3xl rounded-xl overflow-hidden">
            <Image
              key={step.image}
              src={step.image}
              alt={step.title}
              fill
              unoptimized
              priority
              className="object-cover object-center w-full h-full"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-black/50 to-transparent" />
          </div>

        {/* Loading indicator */}
        <div className="flex flex-col items-center gap-2 text-foreground">
          <Spinner className="text-foreground"/>
          <p className="text-sm font-medium tracking-wide">Mempersiapkan sesi…</p>
        </div>
      </div>
    )
  }

  // ── Main UI ───────────────────────────────────────────────────
  return (
    <div className="">

      {/* ════════════════════════════════════════════════════════
          MOBILE / TABLET  (< 2md / 876px)
          Fixed fullscreen with m-4 inset feel
          ═════════════════════════════��══════════════════════════ */}
      <div className="2md:hidden fixed inset-0 z-55 flex flex-col gap-3 bg-celeste p-6 overflow-y-auto">

        {/* Top bar: back button + BGM selector */}
        <div className="flex items-center gap-3 shrink-0 ">
          <Button
            onClick={handleBack}
            aria-label="Kembali ke halaman sesi"
            variant={'default'}
            className="2xs:rounded-xl [&_svg]:size-4 rounded-sm px-1 py-1.5 h-fit! border-muted-foreground "
          >
            <ArrowLeftIcon weight="bold" className="w-4 h-4" />
          </Button>

          <button
            ref={bgmButtonMobileRef}
            onClick={() => openMusicTray(bgmButtonMobileRef, true)}
            className="flex items-center justify-between xs:gap-4 gap-2 flex-1 2xs:rounded-xl rounded-lg bg-background border border-muted-foreground p-3"
            aria-label="Pilih musik latar"
          >
            <MusicNotesIcon
              weight="fill"
              className={cn(
                "w-3.5 h-3.5 shrink-0 transition-colors",
                isBGMStopped ? "text-foreground/40" : "text-foreground"
              )}
            />
            <div className="flex flex-col items-start flex-1 gap-1 min-w-0 text-left overflow-hidden">
              <span className="text-xs/3 font-semibold text-foreground text-clip">
                {bgmLabel}
              </span>

              {bgmSublabel && (
                <span className="text-xs/3 font-medium text-muted-foreground truncate text-clip">
                  {bgmSublabel}
                </span>
              )}
            </div>
            <CaretDownIcon
              weight="bold"
              className={cn(
                "w-3 h-3 shrink-0 text-foreground transition-transform duration-200",
                showMusicTray && trayMobile && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Cover image — centered horizontally */}
        <div className="flex justify-center shrink-0 flex-1 sm:px-16 xs:px-0 2xs:min-h-[calc(56dvh-52px)] mt-2">
          <div className="relative w-full h-full 2xs:rounded-3xl rounded-xl overflow-hidden">
            <Image
              key={step.image}
              src={step.image}
              alt={step.title}
              fill
              unoptimized
              priority
              className="object-cover object-center w-full h-full"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-black/50 to-transparent" />
          </div>
        </div>

        {/* Fixed-height step label + title area so controls don't jump */}
        <div className="flex flex-col gap-1 text-center pt-1 shrink-0 h-32 overflow-y-auto justify-center my-2">
          <span className="text-2xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">
            Langkah {currentStep + 1} / {totalSteps}
          </span>
          <div className="flex flex-col gap-2 items-center xs:px-6">
            <p className="sm:text-h2/7 text-lg/5.5 font-semibold text-foreground text-center">{step.title} </p>
            {step.description && (
              <p className="xs:text-p/5 text-sm/4 text-muted-foreground text-center text-pretty">{step.description}</p>
            )}
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center 2xs:justify-between justify-center 2xs:gap-6 gap-3 w-full shrink-0">
          <Button
            onClick={() => setIsLooping((l) => !l)}
            variant={'ghost'}
            size={'sm'}
            className={cn(
              '[&_svg]:size-5 p-2 text-xs xs:text-sm font-medium',
              isLooping ? 'text-foreground hover:bg-foreground/10' : 'text-muted-foreground hover:bg-foreground/10'
            )}
          >
            {isLooping ? <RepeatOnceIcon weight="fill" /> : <RepeatIcon weight="fill" />}
          </Button>

          <div className="flex-1 flex flex-row 2xs:gap-13 gap-3 justify-center items-center">
            <Button
              onClick={goPrev}
              disabled={currentStep === 0}
              size={'sm'}
              variant={'default'}
              className="[&_svg]:size-5 flex items-center justify-center gap-1.5 sm:px-3 px-2 py-2 text-xs xs:text-sm text-muted-foreground disabled:text-muted-foreground disabled:cursor-not-allowed font-medium rounded-full bg-transparent hover:bg-foreground/10 border-none 2sx:w-fit w-6"
            >
              <ArrowLeftIcon weight="bold" />
              <span className="2xs:inline hidden">Sebelumnya</span>
            </Button>

            {/* Progress ring */}
            <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(94, 94, 94, 0.2)" strokeWidth="3" />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="rgba(94, 94, 94)"
                  strokeOpacity="0.75"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'Jeda latihan' : 'Lanjutkan latihan'}
                className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                          bg-background text-muted-foreground
                          transition-all duration-200 ease-out
                          hover:cursor-pointer hover:scale-105 active:scale-95 active:bg-background/15"
              >
                {isPlaying
                  ? <PauseIcon weight="fill" className="w-6 h-6" />
                  : <PlayIcon weight="fill" className="w-6 h-6" />
                }
              </button>
            </div>

            <Button
              onClick={goNextManual}
              variant={'default'}
              size={'sm'}
              className="[&_svg]:size-5 flex items-center justify-center gap-1.5 sm:px-3 px-2 py-2 text-xs xs:text-sm text-muted-foreground disabled:text-muted-foreground disabled:cursor-not-allowed font-medium rounded-full bg-transparent border-none hover:bg-foreground/10 2sx:w-fit w-6"
            >
              <span className="2xs:inline hidden">Berikutnya</span>
              <ArrowRightIcon weight="bold" />
            </Button>
          </div>

          <Button
            onClick={() => setIsMuted((m) => !m)}
            size={'sm'}
            variant={'ghost'}
            className={cn(
              '[&_svg]:size-5 p-2 text-xs xs:text-sm font-medium',
              isMuted ? 'text-foreground hover:bg-foreground/10' : 'text-muted-foreground hover:bg-foreground/10'
            )}
          >
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

      {/* ════════════════════════════════════════════════════════
          DESKTOP  (≥ 2md / 876px)
          Fixed fullscreen like mobile — no Section wrapper
          ════════════════════════════════════════════════════════ */}
      <div className="hidden 2md:flex fixed inset-0 z-55 items-stretch justify-stretch lg:px-28 px-12 lg:py-14 py-8 bg-celeste">
        <div className="flex flex-col items-center w-full rounded-4xl relative overflow-hidden flex-1"> 

          <div className="absolute inset-0 z-0">
            <Image
              key={step.image}
              src={step.image}
              alt={step.title}
              fill
              unoptimized
              priority
              className="object-cover object-center rounded-4xl"
            />
            <div className="absolute inset-0 rounded-4xl bg-black/25" />
            <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/50 to-transparent rounded-t-4xl" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/50 to-transparent rounded-b-4xl" />
          </div>

          {/* Content layer */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full w-full py-8 px-6">

            {/* Top bar: back (left) — step dots (center) — BGM (right) */}
            <div className="flex items-center justify-between w-full gap-4">

              {/* Back button — left */}
              <div className="flex-1 flex justify-start">
                <Button
                  onClick={handleBack}
                  variant={'link'}
                  aria-label="Kembali ke halaman sesi"
                  className="flex items-center justify-center text-background"
                >
                  <ArrowLeftIcon weight="bold" className="w-4 h-4" />
                  Kembali
                </Button>
              </div>

              {/* Step dots — center */}
              <div className="flex items-center gap-3">
                {instructions.map((instr, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToStep(i)}
                    className="flex flex-col items-center gap-1 group transition-all duration-200 ease-out cursor-pointer"
                    aria-label={`Langkah ${i + 1}: ${instr.title}`}
                  >
                    <span className={cn(
                      'block h-1 rounded-full transition-all duration-300',
                      i === currentStep
                        ? 'w-8 bg-background/90'
                        : i < currentStep
                        ? 'w-4 bg-background/55 group-hover:bg-background/70'
                        : 'w-4 bg-background/30 group-hover:bg-background/45'
                    )} />
                  </button>
                ))}
              </div>

              {/* BGM pill — right */}
              <div className="flex-1 flex justify-end">
                <button
                  ref={bgmButtonRef}
                  onClick={() => openMusicTray(bgmButtonRef, false)}
                  aria-label="Pilih musik latar"
                  className="flex items-center gap-3 px-4 py-2 rounded-full
                            bg-background/90 text-foreground/80
                            hover:bg-muted-foreground/90 border border-foreground hover:cursor-pointer hover:text-white
                            transition-all duration-150 ease-out w-60"
                >
                  <MusicNotesIcon
                    weight="fill"
                    className={cn("w-3.5 h-3.5 shrink-0 transition-colors", isBGMStopped ? "opacity-40" : "opacity-100")}
                  />
                  <div className="flex flex-1 flex-col min-w-0 text-left">
                    <span className="text-xs font-semibold leading-tight truncate max-w-42">{bgmLabel}</span>
                    {bgmSublabel && (
                      <span className="text-xs leading-tight truncate max-w-42 font-medium">{bgmSublabel}</span>
                    )}
                  </div>
                  <CaretDownIcon
                    weight="bold"
                    className={cn("w-4 h-4 shrink-0 transition-transform duration-200", showMusicTray && !trayMobile && "rotate-180")}
                  />
                </button>
              </div>

            </div>

            {/* Middle: ring + step info */}
            <div className="flex flex-1 flex-col justify-center items-center gap-4 text-center">
              <span className="text-xs text-background/80 font-semibold tracking-[0.2em] uppercase">
                Langkah {currentStep + 1} / {totalSteps}
              </span>

              {/* Progress ring */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" />
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none"
                    stroke="white"
                    strokeOpacity="0.85"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Jeda latihan' : 'Lanjutkan latihan'}
                  className="relative z-10 w-17.5 h-17.5 rounded-full flex items-center justify-center
                            bg-background text-muted-foreground
                            transition-all duration-200 ease-out
                            hover:cursor-pointer hover:scale-105 active:scale-95 active:bg-background/15"
                >
                  {isPlaying
                    ? <PauseIcon weight="fill" className="w-7 h-7" />
                    : <PlayIcon weight="fill" className="w-7 h-7" />
                  }
                </button>
              </div>

              {/* Timer */}
              <p className="xs:text-p/5 text-sm/4 tracking-wide font-medium -mt-2">
                <span className="text-white/90">{displayMins}:{displaySecs}</span>
                <span className="text-white/30 mx-1">/</span>
                <span className="text-white/50">{totalTime}</span>
              </p>

              {/* Fixed-height step title + description so controls stay anchored */}
              <div className="flex flex-col gap-1 text-center pt-1 shrink-0 max-w-xl sm:max-w-lg h-40 overflow-y-auto justify-start">
                <div className="flex flex-col gap-2 items-center xs:px-6">
                  <p className="sm:text-h2/7 text-xl/5.5 font-semibold text-background text-center">{step.title}</p>
                  {step.description && (
                    <p className="xs:text-p/5 text-sm/4 text-background text-center">{step.description}</p>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom: controls */}
            <div className="flex flex-col items-center gap-2 px-3">
              <div className="flex items-center justify-center gap-2 bg-background rounded-full px-2 py-1.5 w-full">

                <Button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  size={'sm'}
                  variant={'ghost'}
                  className="[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground disabled:bg-transparent disabled:text-muted-foreground disabled:cursor-not-allowed font-medium rounded-full bg-transparent hover:bg-foreground/10"
                >
                  <ArrowLeftIcon weight="bold" className="w-2 h-2" />
                  Sebelumnya
                </Button>

                <Button
                  onClick={() => setIsLooping((l) => !l)}
                  variant={'ghost'}
                  size={'sm'}
                  className={cn(
                    '[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full bg-transparent',
                    isLooping
                      ? 'text-muted-foreground border border-muted-foreground bg-foreground/10 font-bold hover:bg-foreground/10'
                      : 'text-muted-foreground hover:bg-foreground/10'
                  )}
                >
                  {isLooping ? <RepeatOnceIcon weight="fill" /> : <RepeatIcon weight="fill" />}
                  Ulangi
                </Button>

                <Button
                  onClick={() => setIsMuted((m) => !m)}
                  size={'sm'}
                  variant={'ghost'}
                  className={cn(
                    '[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full bg-transparent',
                    isMuted
                      ? 'text-muted-foreground border border-muted-foreground bg-foreground/10 font-bold hover:bg-foreground/10'
                      : 'text-muted-foreground hover:bg-foreground/10'
                  )}
                >
                  {isMuted ? <SpeakerSlashIcon weight="fill" /> : <SpeakerHighIcon weight="fill" />}
                  {isMuted ? 'Tanpa Instruksi Suara' : 'Dengan Instruksi Suara'}
                </Button>

                {isLastStep ? (
                  <Button
                    onClick={goNextManual}
                    variant={'ghost'}
                    size={'sm'}
                    className="[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground disabled:bg-transparent disabled:text-muted-foreground disabled:cursor-not-allowed font-medium rounded-full bg-transparent hover:bg-foreground/10"
                  >
                    Selesai
                    <CheckIcon weight="bold" />
                  </Button>
                ) : (
                  <Button
                    onClick={goNextManual}
                    variant={'ghost'}
                    size={'sm'}
                    className="[&_svg]:size-3.5 flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground disabled:bg-transparent disabled:text-muted-foreground disabled:cursor-not-allowed font-medium rounded-full bg-transparent hover:bg-muted-foreground/10"
                  >
                    Berikutnya
                    <ArrowRightIcon weight="bold" />
                  </Button>
                )}
              </div>

              <p className="xs:text-p text-sm text-white/40 text-center font-semibold">DMAI - {sessionName} Session</p>
            </div>

          </div>
        </div>
      </div>

      {showMusicTray && <MusicTray />}
    </div>
  )
}
