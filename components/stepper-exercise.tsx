'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  RepeatIcon, SpeakerSlashIcon, SpeakerHighIcon,
  PauseIcon, PlayIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon,
} from "@phosphor-icons/react"
import type { SessionInstruction } from "@/lib/data-detail-session"
import { BackgroundMusicPlayer } from "./background-music-player"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useBGMPlayer } from "@/lib/hooks/useBGMPlayer"
import { useNarrationPlayback } from "@/lib/hooks/useNarrationPlayback"

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

  // ── Loading / ready states ─────────────────────────────────────
  // isAudioReady: data fetched from Supabase
  // readyToPlay:  1 s after isAudioReady — gives the DOM time to settle
  // audioUnlocked: user has made a gesture, browser will allow audio
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [readyToPlay, setReadyToPlay] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  // ── Audio hooks ────────────────────────────────────────────────
  const bgm = useBGMPlayer()
  const narration = useNarrationPlayback()

  // ── Destructure stable callbacks so they can safely go in effect
  //    dep arrays without the wrapper object causing infinite loops.
  //    Every method is useCallback-wrapped inside its hook with
  //    stable dependencies, so these references never change.
  const {
    ref: bgmRef,
    isBGMStopped,
    load: bgmLoad,
    play: bgmPlay,
    pause: bgmPause,
    resume: bgmResume,
    stop: bgmStop,
    switchTrack: bgmSwitchTrack,
    duck,
    restore,
  } = bgm

  const {
    ref: narrationRef,
    playNarration,
    stopNarration,
  } = narration

  // ── Internal refs ──────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Tracks whether we have actually started BGM playback, so we never
  // call play() twice (which would reset volume to 0 mid-playback).
  const hasStartedBGMRef = useRef(false)

  const step = instructions[currentStep]
  const totalSteps = instructions.length
  const progress = Math.min((elapsed / step.duration_seconds) * 100, 100)
  const isLastStep = currentStep === totalSteps - 1

  // ── Setup BGM loop flag ────────────────────────────────────────
  useEffect(() => {
    if (bgmRef.current) bgmRef.current.loop = true
  }, [bgmRef])

  // ── Fetch BGM tracks and load first track ──────────────────────
  // Runs exactly once. bgmLoad is stable (useCallback with [] deps).
  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('background_music')
          .select('id, title, composer, audio_url, duration_seconds')
          .order('created_at')

        if (error) {
          console.error('[BGM] fetch error:', error)
          setIsAudioReady(true)
          return
        }
        if (data && data.length > 0) {
          setTracks(data as Track[])
          await bgmLoad(data[0].audio_url)
        }
      } catch (err) {
        console.error('[BGM] init exception:', err)
      } finally {
        setIsAudioReady(true)
      }
    }
    init()
  }, [bgmLoad])

  // ── 1 s delay after data is ready ─────────────────────────────
  // Gives the browser time to decode the first track before we try
  // to play. Shows the full UI immediately; only audio is held back.
  useEffect(() => {
    if (!isAudioReady) return
    const t = setTimeout(() => setReadyToPlay(true), 1000)
    return () => clearTimeout(t)
  }, [isAudioReady])

  // ── Listen for the first user gesture ─────────────────────────
  // Browser autoplay policy requires a user gesture before audio
  // can play. We listen on document so ANY tap/click on the page
  // counts, including the play/pause button, step dots, etc.
  useEffect(() => {
    if (audioUnlocked) return // already done
    const unlock = () => setAudioUnlocked(true)
    document.addEventListener('click', unlock, { once: true })
    document.addEventListener('touchstart', unlock, { once: true })
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [audioUnlocked])

  // ── Attempt BGM autoplay once both gates open ──────────────────
  // We try as soon as readyToPlay AND audioUnlocked are both true.
  // bgmPlay re-throws on autoplay-block, so we swallow that quietly.
  useEffect(() => {
    if (!readyToPlay || !audioUnlocked || hasStartedBGMRef.current) return
    hasStartedBGMRef.current = true
    bgmPlay().catch((err) => console.warn('[BGM] autoplay blocked:', err))
  }, [readyToPlay, audioUnlocked, bgmPlay])

  // ── Sync BGM with exercise play/pause ──────────────────────────
  // Only runs after BGM has actually started (hasStartedBGMRef).
  useEffect(() => {
    if (!readyToPlay || !audioUnlocked || !hasStartedBGMRef.current) return

    if (!isPlaying) {
      bgmPause()
      stopNarration()
    } else if (!isBGMStopped) {
      // bgmResume() is guarded internally — safe to call even if playing
      bgmResume()
    }
  }, [isPlaying, isBGMStopped, readyToPlay, audioUnlocked, bgmPause, bgmResume, stopNarration])

  // ── Narration per step ─────────────────────────────────────────
  // BUG FIX (was causing the looping glitch):
  //   The original effect listed `narration` and `bgm` (objects) in its
  //   deps. These are new object references every render, so the effect
  //   re-ran every render → stopNarration() then playNarration() every
  //   render → audio restarted every ~16 ms → the 1-2 s loop you heard.
  //
  //   Fix: use the destructured, stable callbacks (useCallback-wrapped
  //   with primitive/stable deps) instead of the wrapper objects.
  useEffect(() => {
    if (!readyToPlay || !audioUnlocked || !isPlaying || !step.audio) {
      return
    }
    playNarration(step.audio, isMuted, duck, restore)
    return () => stopNarration()
  }, [
    currentStep,
    step.audio,
    isMuted,
    readyToPlay,
    audioUnlocked,
    isPlaying,
    playNarration,
    stopNarration,
    duck,
    restore,
  ])

  // ── Sync narration volume with mute toggle ─────────────────────
  useEffect(() => {
    if (narrationRef.current) {
      narrationRef.current.volume = isMuted ? 0 : 1
    }
  }, [isMuted, narrationRef])

  // ── Prefetch next steps' narration in the background ──────────
  useEffect(() => {
    if (!isAudioReady) return
    const ahead = 3
    for (let i = 1; i <= ahead && currentStep + i < totalSteps; i++) {
      const next = instructions[currentStep + i]
      if (next?.audio) {
        const a = new Audio()
        a.crossOrigin = 'anonymous'
        a.src = next.audio
        a.preload = 'metadata'
        a.load()
      }
    }
  }, [currentStep, totalSteps, instructions, isAudioReady])

  // ── BGM track controls ─────────────────────────────────────────
  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index)
    bgmSwitchTrack(tracks[index].audio_url)
  }
  const handleStopBgm = () => bgmStop()

  // ── Timer / stepper logic ──────────────────────────────────────
  const handleTimerEnd = useCallback(() => {
    if (isLooping) {
      setElapsed(0)
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
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setElapsed(0)
    } else {
      setIsPlaying(false)
      bgmStop()
      setTimeout(() => onDone(), 600)
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setIsLooping(false)
      setCurrentStep((s) => s - 1)
      setElapsed(0)
    }
  }

  const jumpToStep = (i: number) => {
    setIsLooping(false)
    setCurrentStep(i)
    setElapsed(0)
  }

  // Timer fires every second while playing AND audio is ready
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && readyToPlay && audioUnlocked) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, readyToPlay, audioUnlocked])

  useEffect(() => {
    if (elapsed >= step.duration_seconds) handleTimerEnd()
  }, [elapsed, step.duration_seconds, handleTimerEnd])

  // Reset timer and resume when step changes
  useEffect(() => {
    setElapsed(0)
    setIsPlaying(true)
  }, [currentStep])

  // ── Helpers ────────────────────────────────────────────────────
  const formatTime = () => {
    const m = Math.floor(step.duration_seconds / 60)
    const s = step.duration_seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const currentSeconds = Math.min(elapsed, step.duration_seconds)
  const displayMins = String(Math.floor(currentSeconds / 60)).padStart(2, '0')
  const displaySecs = String(currentSeconds % 60).padStart(2, '0')

  // ── Loading state (data not yet fetched) ───────────────────────
  if (!isAudioReady) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-64 max-w-3xl">
        <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Mempersiapkan sesi...</p>
      </div>
    )
  }

  // ── Preparing state (1 s delay, data ready, UI shown) ─────────
  if (!readyToPlay) {
    return (
      <div className="flex flex-col gap-8 items-center max-w-3xl w-full">
        {/* Show the first step UI immediately, audio starts in ~1 s */}
        <div className="bg-background flex items-center gap-2 justify-between w-full px-4 py-2 rounded-xl border border-foreground opacity-50">
          <p className="text-sm text-muted-foreground flex-1 text-center">Memuat musik...</p>
        </div>

        <div className="flex gap-4 w-full items-center">
          <div className="shrink-0">
            <div className="rounded-4xl border border-foreground bg-background p-2 w-100 h-68">
              <Image
                src={step.image}
                alt={step.title}
                width={2000}
                height={2000}
                className="w-full h-full object-cover rounded-3xl"
                loading="eager"
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-semibold tracking-widest">
              LANGKAH {currentStep + 1} / {totalSteps}
            </span>
            <p className="text-h2 font-semibold leading-tight">{step.title}</p>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          <p>Ketuk di mana saja untuk memulai</p>
        </div>
      </div>
    )
  }

  // ── Main exercise UI ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 items-center max-w-3xl">
      <BackgroundMusicPlayer
        audioRef={bgmRef}
        tracks={tracks}
        currentIndex={currentTrackIndex}
        isStopped={isBGMStopped}
        isLoaded={isAudioReady}
        onSelectTrack={handleSelectTrack}
        onStop={handleStopBgm}
      />

      {/* Hidden audio elements — refs managed by hooks */}
      <audio ref={bgmRef} crossOrigin="anonymous" />
      <audio ref={narrationRef} crossOrigin="anonymous" />

      <div className="flex gap-4 w-full items-center">
        <div className="shrink-0">
          <div className="rounded-4xl border border-foreground bg-background p-2 w-100 h-68">
            <Image
              key={step.image}
              src={step.image}
              alt={step.title}
              width={2000}
              height={2000}
              className="w-full h-full object-cover rounded-3xl"
              loading="eager"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <span className="text-xs text-muted-foreground font-semibold tracking-widest">
            LANGKAH {currentStep + 1} / {totalSteps}
          </span>
          <p className="text-h2 font-semibold leading-tight">{step.title}</p>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
      </div>

      {/* "Tap to start" hint shown until first gesture unlocks audio */}
      {!audioUnlocked && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Ketuk tombol di bawah untuk memulai audio
        </p>
      )}

      <div className="w-full flex flex-col items-center gap-5">
        {/* Progress bar */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="w-full flex gap-2 items-center">
            <p className="text-xs text-muted-foreground font-mono">
              {displayMins}:{displaySecs}
            </p>
            <div className="flex-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono">{formatTime()}</p>
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {instructions.map((_, i) => (
              <button
                key={i}
                onClick={() => jumpToStep(i)}
                className={`rounded-full transition-all ${
                  i === currentStep
                    ? 'w-6 h-2 bg-foreground'
                    : i < currentStep
                    ? 'w-2 h-2 bg-foreground/60'
                    : 'w-2 h-2 bg-foreground/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Play / Pause */}
        <Button
          onClick={() => setIsPlaying((p) => !p)}
          title={isPlaying ? 'Pause exercise' : 'Resume exercise'}
          className="w-14 h-14 p-3 [&_svg]:size-6 flex items-center justify-center bg-transparent hover:bg-background rounded-full border border-foreground"
        >
          {isPlaying ? <PauseIcon weight="fill" /> : <PlayIcon weight="fill" />}
        </Button>

        {/* Controls row */}
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 0}
            size="sm"
            className="[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:bg-background disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-50 font-medium"
          >
            <ArrowLeftIcon weight="fill" />
            Sebelumnya
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLooping((l) => !l)}
            className={cn(
              '[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs border transition-all hover:bg-background',
              isLooping
                ? 'bg-background text-muted-foreground font-semibold'
                : 'bg-transparent text-muted-foreground',
            )}
          >
            <RepeatIcon weight={isLooping ? 'fill' : 'regular'} />
            Ulangi
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted((m) => !m)}
            className={cn(
              '[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs rounded-full border transition-all hover:bg-background',
              isMuted
                ? 'bg-background text-muted-foreground font-semibold'
                : 'bg-transparent text-muted-foreground',
            )}
          >
            {isMuted ? <SpeakerSlashIcon weight="fill" /> : <SpeakerHighIcon weight="fill" />}
            {isMuted ? 'Hening' : 'Suara'}
          </Button>

          {isLastStep ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={goNextManual}
              className="[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs text-foreground font-semibold border border-foreground rounded-full"
            >
              <CheckIcon weight="bold" />
              Selesai
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={goNextManual}
              className="[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:bg-background font-medium"
            >
              Selanjutnya
              <ArrowRightIcon weight="fill" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}