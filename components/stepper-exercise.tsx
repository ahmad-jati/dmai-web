'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
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
import { Spinner } from "./ui/spinner"
import { Section } from "./layout/section-wrapper"

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
  onDone: () => void
}

export function StepperExercise({ instructions, onDone }: Props) {
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

  // Ref for the BGM trigger button — used to position the fixed tray
  const bgmButtonRef = useRef<HTMLButtonElement>(null)
  const bgmButtonMobileRef = useRef<HTMLButtonElement>(null)
  const [trayRect, setTrayRect] = useState<DOMRect | null>(null)
  const [trayMobile, setTrayMobile] = useState(false)

  const bgm = useBGMPlayer()
  const narration = useNarrationPlayback()

  const {
    ref: bgmRef,
    isBGMStopped,
    load: bgmLoad,
    play: bgmPlay,
    pause: bgmPause,
    resume: bgmResume,
    stop: bgmStop,
    switchTrack: bgmSwitchTrack,
  } = bgm

  const { playNarration, stopNarration, fadeMute } = narration

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bgmStartedRef = useRef(false)
  const prevIsPlayingRef = useRef(isPlaying)

  const step = instructions[currentStep]
  const totalSteps = instructions.length
  const progress = Math.min((elapsed / step.duration_seconds) * 100, 100)
  const isLastStep = currentStep === totalSteps - 1
  const circumference = 2 * Math.PI * 44
  const strokeDashoffset = circumference * (1 - progress / 100)
  const currentTrack = tracks[currentTrackIndex]

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
        setTimeout(() => setIsReady(true), 800)
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
    if (!isPlaying) { bgmPause(); stopNarration() }
    else if (!isBGMStopped) bgmResume()
  }, [isPlaying, isBGMStopped, bgmPause, bgmResume, stopNarration])

  // ── 5. Narration ──────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !isPlaying || !step.audio) return
    playNarration(step.audio, isMuted)
    return () => stopNarration()
  }, [currentStep, narrationKey, isPlaying, isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 6. Mute fade ──────────────────────────────────────────────
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return }
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
    if (currentStep < totalSteps - 1) { setCurrentStep((s) => s + 1); setElapsed(0) }
    else { setIsPlaying(false); bgmStop(); setTimeout(() => onDone(), 600) }
  }
  const goPrev = () => {
    if (currentStep > 0) { setIsLooping(false); setCurrentStep((s) => s - 1); setElapsed(0) }
  }
  const jumpToStep = (i: number) => { setIsLooping(false); setCurrentStep(i); setElapsed(0) }

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
  // only show composer when there's an active track
  const bgmSublabel = (!isBGMStopped && currentTrack?.composer) ? currentTrack.composer : null

  // ── Open music tray: capture button rect for fixed positioning ─
  const openMusicTray = (ref: React.RefObject<HTMLButtonElement | null>, isMobile: boolean) => {
    if (ref.current) {
      setTrayRect(ref.current.getBoundingClientRect())
      setTrayMobile(isMobile)
    }
    setShowMusicTray((v) => !v)
  }

  // ── Music tray — rendered as fixed overlay to escape any overflow:hidden parent ──
  const MusicTray = () => {
    if (!trayRect) return null

    // On mobile the tray opens upward (bottom of tray = top of button)
    // On desktop it opens downward (top of tray = bottom of button)
    const style: React.CSSProperties = trayMobile
      ? {
          position: 'fixed',
          top: trayRect.bottom + 8,
          right: window.innerWidth - trayRect.right,
          zIndex: 9999,
          width: 240,
        }
      : {
          position: 'fixed',
          top: trayRect.bottom + 8,
          right: window.innerWidth - trayRect.right,
          zIndex: 9999,
          width: 240,
        }

    return (
      <>
        <div className="fixed inset-0 z-[9998]" onClick={() => setShowMusicTray(false)} />
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

  // ── Control buttons (shared) ──────────────────────────────────
  const ControlButtons = () => (
    <>
      <div className="flex w-full justify-between items-center gap-2 ">

        <Button
          onClick={() => setIsLooping((l) => !l)}
          variant={'ghost'}
          size={'sm'}
          className={cn(
            '[&_svg]:size-3.5 flex-1 2md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs xs:text-sm font-medium rounded-full  col-span-2',
            isLooping
              ? 'text-muted-foreground hover:bg-foreground/10 '
              : 'text-muted-foreground hover:bg-foreground/10'
          )}
        >
          {isLooping
            ? <RepeatOnceIcon weight="fill" />
            : <RepeatIcon weight="fill" />
          }
          Ulangi
        </Button>

        <Button
          onClick={() => setIsMuted((m) => !m)}
          size={'sm'}
          variant={'ghost'}
          className={cn(
            '[&_svg]:size-3.5 flex-1 2md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs xs:text-sm font-medium rounded-full  col-span-2',
            isMuted
              ? 'text-muted-foreground hover:bg-foreground/10'
              : 'text-muted-foreground hover:bg-foreground/10'
          )}
        >
          {isMuted
            ? <SpeakerSlashIcon weight="fill" />
            : <SpeakerHighIcon weight="fill" />
          }
          {isMuted ? 'Tanpa Instruksi Suara' : 'Dengan Instruksi Suara'}
        </Button>

      </div>
    </>
  )

  // ── Loading ───────────────────────────────────────────────────
  if (!isReady) {
    return (
      <div className="w-full p-4 bg-celeste border border-foreground rounded-5xl">
        {/* Mobile loading */}
        <div className="2md:hidden flex flex-col gap-4">
          <div className="relative w-full min-h-[calc(60dvh-52px)] rounded-3xl overflow-hidden">
            <Image src={step.image} alt={step.title} fill unoptimized priority className="object-cover object-center" />
            <div className="absolute inset-0 bg-black/25" />
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <p className="text-sm text-white/70 tracking-wide">Mempersiapkan sesi…</p>
            </div>
          </div>
        </div>

        {/* Desktop loading */}
        <div className="hidden 2md:flex flex-col gap-8 items-center w-full rounded-4xl relative p-8 h-[76dvh] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image src={step.image} alt={step.title} fill unoptimized priority className="object-cover object-center rounded-4xl" />
            <div className="absolute inset-0 rounded-4xl bg-black/25" />
            <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/50 to-transparent rounded-t-4xl" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/50 to-transparent rounded-b-4xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-3">
            <Spinner />
            <p className="text-sm text-white/70 tracking-wide">Mempersiapkan sesi…</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Main UI ───────────────────────────────────────────────────
  return (
    <Section className="bg-celeste">

      {/* ════════════════════════════════════════
          MOBILE / TABLET layout (< 876px / 2md)
          ════════════════════════════════════════ */}
      <div className="2md:hidden flex flex-col gap-3">

        {/* BGM bar — anchored to bottom of image, tray rendered via fixed portal */}
        <div className="">
          <button
            ref={bgmButtonMobileRef}
            onClick={() => openMusicTray(bgmButtonMobileRef, true)}
            className="flex items-center gap-4 w-full 2xs:rounded-xl rounded-lg bg-background border border-muted-foreground p-3"
            aria-label="Pilih musik latar"
          >
            <MusicNotesIcon
              weight="fill"
              className={cn(
                "w-3.5 h-3.5 shrink-0 transition-colors",
                isBGMStopped ? "text-foreground/40" : "text-foreground"
              )}
            />
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-xs font-semibold text-foreground truncate leading-tight">
                {bgmLabel}
              </span>
              {bgmSublabel && (
                <span className="text-xs font-medium text-muted-foreground truncate leading-tight">{bgmSublabel}</span>
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
        
        <div className="relative w-full min-h-[calc(50dvh-52px)] 2xs:rounded-3xl rounded-xl overflow-hidden">
          <Image
            key={step.image}
            src={step.image}
            alt={step.title}
            fill
            unoptimized
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-black/50 to-transparent" />

        </div>

        <div className="flex items-center justify-between gap-6 w-fit mx-auto">
          <Button
            onClick={goPrev}
            disabled={currentStep === 0}
            size={'sm'}
            variant={'default'}
            className="[&_svg]:size-5 2md:flex-none flex items-center justify-center gap-1.5 sm:px-3 px-2 py-2 text-xs xs:text-sm text-muted-foreground disabled:bg-transparent disabled:text-muted-foreground disabled:cursor-not-allowed font-medium rounded-full bg-transparent hover:bg-foreground/10 border-none"
          >
            <ArrowLeftIcon weight="bold" />
            <span className="2xs:inline hidden">Sebelumnya</span>
          </Button>

          <div className="flex-1 relative w-16 h-16 shrink-0 flex items-center justify-center">
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
              className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                        bg-background text-muted-foreground
                        transition-all duration-200 ease-out
                        hover:cursor-pointer hover:scale-105 active:scale-95 active:bg-background/15"
            >
              {isPlaying
                ? <PauseIcon weight="fill" className="w-4 h-4" />
                : <PlayIcon weight="fill" className="w-4 h-4" />
              }
            </button>
          </div>

          {isLastStep ? (
            <Button
              onClick={goNextManual}
              variant={'default'}
              size={'sm'}
              className="[&_svg]:size-5 2md:flex-none flex items-end justify-end gap-1.5 sm:px-3 px-2 py-2 text-xs xs:text-sm text-muted-foreground disabled:bg-transparent disabled:text-muted-foreground disabled:cursor-not-allowed font-medium rounded-full hover:bg-foreground/10 border-none w-fit bg-transparent"
            >
              <span className="sm:inline hidden">Selesai</span>
              <CheckIcon weight="bold" />
            </Button>
          ) : (
            <Button
              onClick={goNextManual}
              variant={'default'}
              size={'sm'}
              className="[&_svg]:size-5 2md:flex-none flex items-center justify-center gap-1.5 sm:px-3 px-2 py-2 text-xs xs:text-sm text-muted-foreground disabled:bg-transparent disabled:text-muted-foreground disabled:cursor-not-allowed font-medium rounded-full bg-transparent border-none hover:bg-foreground/10 w-fit"
            >
              <span className="2xs:inline hidden">Berikutnya</span>
              <ArrowRightIcon weight="bold" />
            </Button>
          )}
        </div>

        <p className="text-xs text-center font-medium text-muted-foreground/60 mb-2">
          <span className="text-foreground/80 font-medium">{displayMins}:{displaySecs}</span>
          <span className="mx-1 text-muted-foreground/30">/</span>
          <span>{totalTime}</span>
        </p>
        <div className="flex flex-col gap-1 text-center my-2">
          <span className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">
            Langkah {currentStep + 1} / {totalSteps}
          </span>

          <div className="flex flex-col gap-2 items-center xs:px-6">
            <p className="sm:text-h2/7 text-xl/5.5 font-semibold text-foreground text-center">{step.title}</p>
            {step.description && (
              <p className="text-base/5 text-muted-foreground text-center">{step.description}</p>
            )}
          </div>
        </div>

        
        <div className="2md:bg-background bg-transparent rounded-3xl px-2 py-1.5">
          <ControlButtons />
        </div>

      </div>

      {/* ════════════════════════════════════════
          DESKTOP layout (≥ 876px / 2md)
          ════════════════════════════════════════ */}
      <div className="hidden 2md:flex flex-col items-center w-full rounded-4xl relative h-[76dvh] overflow-hidden">

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

        {/* ── Content layer ── */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full w-full py-8 px-6">

          {/* Top bar */}
          <div className="flex flex-row-reverse items-center w-full">

            {/* BGM pill — top right */}
            <div className="relative flex-1 flex justify-end">
              <button
                ref={bgmButtonRef}
                onClick={() => openMusicTray(bgmButtonRef, false)}
                aria-label="Pilih musik latar"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-background text-muted-foreground
                          hover:bg-muted-foreground border border-foreground hover:cursor-pointer hover:text-white
                          transition-all duration-150 ease-out"
              >
                <MusicNotesIcon
                  weight="fill"
                  className={cn(
                    "w-3.5 h-3.5 shrink-0 transition-colors",
                    isBGMStopped ? "opacity-40" : "opacity-100"
                  )}
                />
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-semibold leading-tight truncate max-w-32">
                    {bgmLabel}
                  </span>
                  {bgmSublabel && (
                    <span className="text-2xs leading-tight truncate max-w-32 opacity-60">{bgmSublabel}</span>
                  )}
                </div>
                <CaretDownIcon
                  weight="bold"
                  className={cn(
                    "w-3 h-3 shrink-0 opacity-60 transition-transform duration-200",
                    showMusicTray && !trayMobile && "rotate-180"
                  )}
                />
              </button>
            </div>

            {/* Step counter — center, replaces awkward dots on desktop */}
            <div className="flex items-center gap-3">
              {instructions.map((instr, i) => (
                <button
                  key={i}
                  onClick={() => jumpToStep(i)}
                  className={cn(
                    'flex flex-col items-center gap-1 group transition-all duration-200 ease-out cursor-pointer',
                  )}
                  aria-label={`Langkah ${i + 1}: ${instr.title}`}
                >
                  {/* Tick line */}
                  <span className={cn(
                    'block h-0.5 rounded-full transition-all duration-300',
                    i === currentStep
                      ? 'w-8 bg-background/90'
                      : i < currentStep
                      ? 'w-4 bg-background/55 group-hover:bg-background/70'
                      : 'w-4 bg-background/30 group-hover:bg-background/45'
                  )} />
                  {/* Step number */}
                  <span className={cn(
                    'text-2xs font-semibold tracking-wide transition-all duration-200',
                    i === currentStep
                      ? 'text-background/90'
                      : i < currentStep
                      ? 'text-background/45'
                      : 'text-background/25'
                  )}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex-1" />
          </div>

          {/* Middle: ring + step info */}
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="text-xs text-background/80 font-semibold tracking-[0.2em] uppercase">
              Langkah {currentStep + 1} / {totalSteps}
            </span>

            {/* Progress ring + play/pause */}
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
            <p className="text-sm tracking-wide font-medium -mt-2">
              <span className="text-white/90">{displayMins}:{displaySecs}</span>
              <span className="text-white/30 mx-1">/</span>
              <span className="text-white/50">{totalTime}</span>
            </p>

            {/* Step title + description */}
            <div className="flex flex-col gap-2 max-w-md">
              <p className="text-2xl font-semibold leading-tight text-white">{step.title}</p>
              {step.description && (
                <p className="text-sm font-medium text-white/70 leading-relaxed">{step.description}</p>
              )}
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
                {isLooping
                  ? <RepeatOnceIcon weight="fill" />
                  : <RepeatIcon weight="fill" />
                }
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
                {isMuted
                  ? <SpeakerSlashIcon weight="fill" />
                  : <SpeakerHighIcon weight="fill" />
                }
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
          </div>

        </div>
      </div>

      {showMusicTray && <MusicTray />}
    </Section>
  )
}