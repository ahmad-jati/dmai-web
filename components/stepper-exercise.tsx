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
  // isReady = BGM data fetched + short settle so browser finishes setup
  const [isReady, setIsReady] = useState(false)

  // ── Audio hooks ────────────────────────────────────────────────
  // Both hooks create their own Audio() elements internally.
  // DO NOT add <audio> elements to JSX — that was causing the double-ref bug.
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
    duck,
    restore,
  } = bgm

  const { ref: narrationRef, playNarration, stopNarration } = narration

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Whether BGM playback has ever been successfully started this session
  const bgmStartedRef = useRef(false)
  // Track previous isPlaying to avoid calling bgmPause/bgmResume on mount
  const prevIsPlayingRef = useRef(isPlaying)

  const step = instructions[currentStep]
  const totalSteps = instructions.length
  const progress = Math.min((elapsed / step.duration_seconds) * 100, 100)
  const isLastStep = currentStep === totalSteps - 1

  // ── 1. Fetch BGM tracks, load first track ──────────────────────
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
        // Brief settle so the browser finishes decoding before we try play()
        setTimeout(() => setIsReady(true), 800)
      }
    }
    init()
  }, [bgmLoad])

  // ── 2. Prefetch narration URLs for upcoming steps ──────────────
  // Uses <link rel="preload"> pattern via new Audio() so they're cached.
  useEffect(() => {
    const ahead = 3
    for (let i = 0; i <= ahead && currentStep + i < totalSteps; i++) {
      const url = instructions[currentStep + i]?.audio
      if (url) {
        const a = new Audio()
        a.crossOrigin = 'anonymous'
        a.src = url
        a.preload = 'auto'
        // We don't need to keep a reference — just trigger the cache
      }
    }
  }, [currentStep, totalSteps, instructions])

  // ── 3. BGM autoplay with gesture-unlock fallback ───────────────
  // Strategy:
  //   a) Try autoplay immediately once data is ready (works if user navigated
  //      from within the same tab — the prior click counts as a gesture).
  //   b) If autoplay is blocked, register a one-shot listener so the very
  //      next tap/click starts it. This satisfies browser autoplay policy.
  useEffect(() => {
    if (!isReady || bgmStartedRef.current) return

    const tryPlay = async () => {
      if (bgmStartedRef.current) return
      try {
        await bgmPlay()
        bgmStartedRef.current = true
      } catch {
        // Autoplay blocked — will start on next user gesture below
      }
    }

    tryPlay()

    // Fallback: user gesture listener
    const onGesture = async () => {
      if (bgmStartedRef.current) return
      try {
        await bgmPlay()
        bgmStartedRef.current = true
      } catch (err) {
        console.warn('[BGM] gesture-triggered play failed:', err)
      }
    }

    document.addEventListener('click', onGesture, { once: true })
    document.addEventListener('touchstart', onGesture, { once: true })

    return () => {
      document.removeEventListener('click', onGesture)
      document.removeEventListener('touchstart', onGesture)
    }
  }, [isReady, bgmPlay])

  // ── 4. Sync BGM with exercise play/pause state ─────────────────
  // Only fires when isPlaying actually changes (tracked via ref).
  useEffect(() => {
    if (!bgmStartedRef.current) return
    if (isPlaying === prevIsPlayingRef.current) return
    prevIsPlayingRef.current = isPlaying

    if (!isPlaying) {
      bgmPause()
      stopNarration()
    } else if (!isBGMStopped) {
      bgmResume()
    }
  }, [isPlaying, isBGMStopped, bgmPause, bgmResume, stopNarration])

  // ── 5. Play narration for current step ─────────────────────────
  // Deps: currentStep, isPlaying, isReady — NOT isMuted.
  // Mute only changes volume, never restarts the audio (see effect 6).
  // playNarration / stopNarration / duck / restore are [] deps → stable →
  // safe to omit from the dep array (they never change).
  useEffect(() => {
    if (!isReady || !isPlaying || !step.audio) return

    // Pass isMuted for the *initial* volume when narration starts.
    // After that, effect 6 handles live volume changes without restarting.
    playNarration(step.audio, isMuted, duck, restore)
    return () => stopNarration()
  }, [currentStep, isPlaying, isReady]) // eslint-disable-line react-hooks/exhaustive-deps
  // ^ isMuted intentionally excluded — toggling mute must NOT restart narration

  // ── 6. Sync narration volume mid-playback when mute toggled ────
  // This is the ONLY thing that should happen on mute toggle:
  // silently set volume to 0 or 1. The narration keeps playing underneath.
  useEffect(() => {
    if (narrationRef.current) {
      narrationRef.current.volume = isMuted ? 0 : 1
    }
  }, [isMuted, narrationRef])

  // ── BGM track controls ─────────────────────────────────────────
  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index)
    bgmSwitchTrack(tracks[index].audio_url)
  }

  // ── Timer logic ────────────────────────────────────────────────
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

  // Timer: tick every second while playing and ready
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && isReady) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, isReady])

  useEffect(() => {
    if (elapsed >= step.duration_seconds) handleTimerEnd()
  }, [elapsed, step.duration_seconds, handleTimerEnd])

  // Reset timer and resume when step changes
  useEffect(() => {
    setElapsed(0)
    setIsPlaying(true)
  }, [currentStep])

  // ── Helpers ────────────────────────────────────────────────────
  const currentSeconds = Math.min(elapsed, step.duration_seconds)
  const displayMins = String(Math.floor(currentSeconds / 60)).padStart(2, '0')
  const displaySecs = String(currentSeconds % 60).padStart(2, '0')
  const totalMins = Math.floor(step.duration_seconds / 60)
  const totalSecs = step.duration_seconds % 60
  const totalTime = `${totalMins}:${totalSecs.toString().padStart(2, '0')}`

  // ── Loading / prepare state ────────────────────────────────────
  if (!isReady) {
    return (
      <div className="flex flex-col gap-8 items-center max-w-3xl w-full">
        {/* Show the first step UI immediately while audio loads */}
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
          <p>Mempersiapkan sesi...</p>
        </div>
      </div>
    )
  }

  // ── Main exercise UI ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 items-center max-w-3xl">
      {/*
        NO <audio> elements here.
        Both useBGMPlayer and useNarrationPlayback create their own
        Audio() elements internally. Putting <audio ref={...}> in JSX
        was the source of the "detached ref" bug where hooks got a ref
        that pointed to null until the DOM element mounted.
      */}

      <BackgroundMusicPlayer
        audioRef={bgmRef}
        tracks={tracks}
        currentIndex={currentTrackIndex}
        isStopped={isBGMStopped}
        isLoaded={tracks.length > 0}
        onSelectTrack={handleSelectTrack}
        onStop={bgmStop}
      />

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
            <p className="text-xs text-muted-foreground font-mono">{totalTime}</p>
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