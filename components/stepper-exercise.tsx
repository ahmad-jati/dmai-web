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
  const bgmSublabel = isBGMStopped
    ? 'Hening total'
    : currentTrack?.composer ?? null

  // ── Shared: Music tray dropdown ───────────────────────────────
  const MusicTray = ({ overlayClass = '' }: { overlayClass?: string }) => (
    <>
      <div className="fixed inset-0 z-10" onClick={() => setShowMusicTray(false)} />
      <div className={cn(
        "absolute z-20 w-60 bg-background border border-muted-foreground/30 rounded-2xl p-2.5 flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-150",
        overlayClass
      )}>
        <span className="text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground px-2 pb-1.5">
          Musik Latar
        </span>
        {tracks.map((track, index) => (
          <button
            key={track.id}
            onClick={() => { setCurrentTrackIndex(index); bgmSwitchTrack(track.audio_url); setShowMusicTray(false) }}
            className={cn(
              'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-all duration-150 ease-out',
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
                <span className="text-xs text-muted-foreground/70">{track.composer}</span>
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
              <span className="text-xs text-muted-foreground/70">Hening total</span>
            </div>
          </button>
        </div>
      </div>
    </>
  )

  // ── Control buttons (shared) ──────────────────────────────────
  const ControlButtons = () => (
    <>
      {/* Row 1: Prev + Next */}
      <div className="flex items-center gap-2 col-span-2 2md:col-span-1 2md:contents">
        <Button
          onClick={goPrev}
          disabled={currentStep === 0}
          size={'sm'}
          variant={'ghost'}
          className="[&_svg]:size-3.5 flex-1 2md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs xs:text-sm text-muted-foreground disabled:bg-transparent disabled:text-muted-foreground/40 disabled:cursor-not-allowed font-medium rounded-full bg-transparent hover:bg-foreground/10"
        >
          <ArrowLeftIcon weight="bold" />
          Sebelumnya
        </Button>

        {isLastStep ? (
          <Button
            onClick={goNextManual}
            variant={'ghost'}
            size={'sm'}
            className="[&_svg]:size-3.5 flex-1 2md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs xs:text-sm text-muted-foreground font-medium rounded-full bg-transparent hover:bg-foreground/10"
          >
            Selesai
            <CheckIcon weight="bold" />
          </Button>
        ) : (
          <Button
            onClick={goNextManual}
            variant={'ghost'}
            size={'sm'}
            className="[&_svg]:size-3.5 flex-1 2md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs xs:text-sm text-muted-foreground font-medium rounded-full bg-transparent hover:bg-muted-foreground/10"
          >
            Berikutnya
            <ArrowRightIcon weight="bold" />
          </Button>
        )}
      </div>

      {/* Row 2: Loop + Mute */}
      <div className="flex items-center gap-2 col-span-2 2md:col-span-1 2md:contents">
        <Button
          onClick={() => setIsLooping((l) => !l)}
          variant={'ghost'}
          size={'sm'}
          className={cn(
            '[&_svg]:size-3.5 flex-1 2md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs xs:text-sm font-medium rounded-full bg-transparent',
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
            '[&_svg]:size-3.5 flex-1 2md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs xs:text-sm font-medium rounded-full bg-transparent',
            isMuted
              ? 'text-muted-foreground border border-muted-foreground bg-foreground/10 font-bold hover:bg-foreground/10'
              : 'text-muted-foreground hover:bg-foreground/10'
          )}
        >
          {isMuted
            ? <SpeakerSlashIcon weight="fill" />
            : <SpeakerHighIcon weight="fill" />
          }
          {isMuted ? 'Hening' : 'Suara'}
        </Button>
      </div>
    </>
  )

  // ── Loading ───────────────────────────────────────────────────
  if (!isReady) {
    return (
      <div className="w-full p-4 bg-celeste border border-foreground rounded-5xl">
        {/* Mobile: stacked */}
        <div className="2md:hidden flex flex-col gap-4">
          <div className="relative w-full h-40 rounded-3xl overflow-hidden">
            <Image src={step.image} alt={step.title} fill unoptimized priority className="object-cover object-center" />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <p className="text-xs/3.5 text-muted-foreground tracking-wide">Mempersiapkan sesi…</p>
            </div>
          </div>
        </div>

        {/* Desktop: immersive */}
        <div className="hidden 2md:flex flex-col gap-8 items-center w-full rounded-4xl relative p-8 h-[76dvh] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image src={step.image} alt={step.title} fill unoptimized priority className="object-cover object-center rounded-4xl" />
            <div className="absolute inset-0 rounded-4xl bg-black/25" />
            <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/50 to-transparent rounded-t-4xl" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/50 to-transparent rounded-b-4xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-3">
            <Spinner />
            <p className="text-xs/3.5 text-white/70 tracking-wide">Mempersiapkan sesi…</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Main UI ───────────────────────────────────────────────────
  return (
    <div className="p-4 bg-celeste border border-foreground w-full rounded-5xl">

      {/* ════════════════════════════════════════
          MOBILE / TABLET layout (< 876px / 2md)
          ════════════════════════════════════════ */}
      <div className="2md:hidden flex flex-col gap-4">

          <div className="bg-background rounded-md px-3 pb-2.5 flex items-center">
            <button
              onClick={() => setShowMusicTray((v) => !v)}
              className="flex items-center gap-2 w-full group bg-amber-200"
              aria-label="Pilih musik latar"
            >
              <MusicNotesIcon
                weight="fill"
                className={cn(
                  "w-3.5 h-3.5 shrink-0 transition-colors",
                  isBGMStopped ? "text-foreground/40" : "text-foreground/80"
                )}
              />
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <span className="text-xs font-semibold text-foreground/90 truncate leading-tight">
                  {bgmLabel}
                </span>
                {bgmSublabel && (
                  <span className="text-[10px] text-foreground/55 truncate leading-tight">{bgmSublabel}</span>
                )}
              </div>
              <CaretDownIcon
                weight="bold"
                className={cn(
                  "w-3 h-3 shrink-0 text-foreground/60 transition-transform duration-200",
                  showMusicTray && "rotate-180"
                )}
              />
            </button>

            {showMusicTray && (
              <MusicTray overlayClass="bottom-full mb-2 left-0" />
            )}
          </div>

        {/* ── Image card with overlaid step dots + BGM bar ── */}
        <div className="relative w-full min-h-[calc(60dvh-52px)] rounded-3xl overflow-hidden">
          <Image
            key={step.image}
            src={step.image}
            alt={step.title}
            fill
            unoptimized
            priority
            className="object-cover object-center"
          />
          {/* subtle bottom fade for BGM bar legibility */}
          {/* <div className="absolute inset-x-0 bottom-0 h-22 bg-linear-to-t from-black/60 to-transparent" /> */}
          {/* <div className="absolute inset-x-0 top-0 h-22 bg-linear-to-b/ from-black/50 to-transparent" /> */}

          {/* Step dots — top center */}
          {/* <div className="absolute top-3 inset-x-0 flex justify-center items-center gap-1.5">
            {instructions.map((_, i) => (
              <button
                key={i}
                onClick={() => jumpToStep(i)}
                className={cn(
                  'rounded-full transition-all duration-300 ease-in-out cursor-pointer',
                  i === currentStep
                    ? 'w-7 h-1.5 bg-white/90'
                    : i < currentStep
                    ? 'w-1.5 h-1.5 bg-white/55 hover:bg-white/70'
                    : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/45'
                )}
                aria-label={`Langkah ${i + 1}`}
              />
            ))}
          </div> */}

          {/* BGM bar — bottom of image */}
          {/* <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
            <div className="relative">
              <button
                onClick={() => setShowMusicTray((v) => !v)}
                className="flex items-center gap-2 w-full group"
                aria-label="Pilih musik latar"
              >
                <MusicNotesIcon
                  weight="fill"
                  className={cn(
                    "w-3.5 h-3.5 shrink-0 transition-colors",
                    isBGMStopped ? "text-white/40" : "text-white/80"
                  )}
                />
                <div className="flex flex-col min-w-0 flex-1 text-left">
                  <span className="text-xs font-semibold text-white/90 truncate leading-tight">
                    {bgmLabel}
                  </span>
                  {bgmSublabel && (
                    <span className="text-[10px] text-white/55 truncate leading-tight">{bgmSublabel}</span>
                  )}
                </div>
                <CaretDownIcon
                  weight="bold"
                  className={cn(
                    "w-3 h-3 shrink-0 text-white/60 transition-transform duration-200",
                    showMusicTray && "rotate-180"
                  )}
                />
              </button>

              {showMusicTray && (
                <MusicTray overlayClass="bottom-full mb-2 left-0" />
              )}
            </div>
          </div> */}
        </div>

        {/* ── Step info + timer + play ── */}
        <div className="flex items-center gap-4 px-1">
          {/* Progress ring + play */}
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="currentColor"
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
                        bg-foreground text-background
                        transition-all duration-200 ease-out
                        hover:cursor-pointer hover:scale-105 active:scale-95"
            >
              {isPlaying
                ? <PauseIcon weight="fill" className="w-4 h-4" />
                : <PlayIcon weight="fill" className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Title + timer */}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground/60">
              Langkah {currentStep + 1} / {totalSteps}
            </span>
            <p className="text-p/5 xs:text-p/5 font-semibold text-foreground leading-tight truncate">{step.title}</p>
            {step.description && (
              <p className="text-xs/3.5 text-muted-foreground line-clamp-2 leading-relaxed">{step.description}</p>
            )}
            <p className="text-xs/3.5 text-muted-foreground/60 mt-0.5">
              <span className="text-foreground/80 font-medium">{displayMins}:{displaySecs}</span>
              <span className="mx-1 text-muted-foreground/30">/</span>
              <span>{totalTime}</span>
            </p>
          </div>
        </div>

        {/* ── Controls: 2-col grid on small, 1 row on wider ── */}
        <div className="flex flex-col gap-2 bg-background/70 border border-foreground/8 rounded-3xl px-2 py-2">
          {/* sm and below: 2-col grid */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-1.5 sm:gap-1">
            <ControlButtons />
          </div>
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
          <div className="flex items-center w-full gap-3">

            {/* Step dots — left */}
            <div className="flex items-center gap-1.5">
              {instructions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => jumpToStep(i)}
                  className={cn(
                    'rounded-full transition-all duration-300 ease-in-out cursor-pointer',
                    i === currentStep
                      ? 'w-8 h-2 bg-background/90'
                      : i < currentStep
                      ? 'w-2 h-2 bg-background/55 hover:bg-background/70'
                      : 'w-2 h-2 bg-background/30 hover:bg-background/45'
                  )}
                  aria-label={`Langkah ${i + 1}`}
                />
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* BGM bar — top right, inline with icon + title + caret */}
            <div className="relative">
              <button
                onClick={() => setShowMusicTray((v) => !v)}
                aria-label="Pilih musik latar"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/15 hover:bg-black/45 transition-all duration-150 group"
              >
                <MusicNotesIcon
                  weight="fill"
                  className={cn(
                    "w-3.5 h-3.5 shrink-0 transition-colors",
                    isBGMStopped ? "text-white/40" : "text-white/80"
                  )}
                />
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-semibold text-white/90 leading-tight truncate max-w-32">
                    {bgmLabel}
                  </span>
                  {bgmSublabel && (
                    <span className="text-[10px] text-white/55 leading-tight truncate max-w-32">{bgmSublabel}</span>
                  )}
                </div>
                <CaretDownIcon
                  weight="bold"
                  className={cn(
                    "w-3 h-3 shrink-0 text-white/60 transition-transform duration-200",
                    showMusicTray && "rotate-180"
                  )}
                />
              </button>

              {showMusicTray && (
                <MusicTray overlayClass="top-full mt-2 right-0" />
              )}
            </div>
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
              <p className="sm:text-h2/7 text-xl/5.5 font-semibold leading-tight text-white">{step.title}</p>
              {step.description && (
                <p className="text-p/5 xs:text-p/5 font-medium text-white/70 leading-relaxed">{step.description}</p>
              )}
            </div>
          </div>

          {/* Bottom: controls */}
          <div className="flex flex-col items-center gap-2 px-3 w-full">
            <div className="flex items-center justify-center gap-2 bg-background rounded-full px-2 py-1.5 w-full max-w-lg">
              <ControlButtons />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}