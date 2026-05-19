'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  RepeatIcon, SpeakerSlashIcon, SpeakerHighIcon,
  PauseIcon, PlayIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon
} from "@phosphor-icons/react"
import type { SessionInstruction } from "@/lib/data-detail-session"
import { BackgroundMusicPlayer } from "./background-music-player"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

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
  const [tracksLoaded, setTracksLoaded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Refs for latest values (avoids stale closures in callbacks) ──
  const currentStepRef = useRef(0)
  const isLoopingRef = useRef(false)
  const isMutedRef = useRef(false)
  const isBgmStoppedRef = useRef(false)
  const instructionsRef = useRef(instructions)

  // Narration state refs – no re-renders needed
  const isNarrationPlayingRef = useRef(false)
  // When the timer ends but narration is still playing, we set this to true.
  // Once narration finishes its 'ended' event, it checks this flag and calls advanceStep().
  const waitingForNarrationRef = useRef(false)

  // BGM
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isBgmStopped, setIsBgmStopped] = useState(false)
  const bgmRef = useRef<HTMLAudioElement | null>(null)

  // Narration
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const audioUnlockedRef = useRef(false)
  // Preload cache: keyed by audio URL. Browser will serve from cache when
  // narrationRef.current.src is set to the same URL, eliminating lag.
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map())

  const totalSteps = instructions.length
  const step = instructions[currentStep]
  const progress = Math.min((elapsed / step.duration_seconds) * 100, 100)
  const isLastStep = currentStep === totalSteps - 1

  // Keep refs in sync with state/props
  useEffect(() => { currentStepRef.current = currentStep }, [currentStep])
  useEffect(() => { isLoopingRef.current = isLooping }, [isLooping])
  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])
  useEffect(() => { isBgmStoppedRef.current = isBgmStopped }, [isBgmStopped])
  useEffect(() => { instructionsRef.current = instructions }, [instructions])

  // ─── Preload adjacent steps' audio ────────────────────────────────
  // Kicks off network requests for current/next/prev audio so the browser
  // has them cached before the user navigates — eliminates the prev/next lag.
  useEffect(() => {
    const preload = (idx: number) => {
      const url = instructionsRef.current[idx]?.audio
      if (!url || audioCacheRef.current.has(url)) return
      const a = new Audio()
      a.preload = 'auto'
      a.src = url
      audioCacheRef.current.set(url, a)
    }
    preload(currentStep)
    preload(currentStep + 1)
    if (currentStep > 0) preload(currentStep - 1)
  }, [currentStep])

  // ─── Fade helpers ─────────────────────────────────────────────────
  const fadeIn = useCallback((audio: HTMLAudioElement, duration = 1500) => {
    audio.volume = 0
    audio.play().catch(() => {})
    const startTime = performance.now()
    const animate = (now: number) => {
      const prog = Math.min((now - startTime) / duration, 1)
      audio.volume = prog
      if (prog < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [])

  const fadeOut = useCallback((audio: HTMLAudioElement, duration = 1500, onComplete?: () => void) => {
    const startVolume = audio.volume
    const startTime = performance.now()
    const animate = (now: number) => {
      const prog = Math.min((now - startTime) / duration, 1)
      audio.volume = Math.max(startVolume * (1 - prog), 0)
      if (prog < 1) {
        requestAnimationFrame(animate)
      } else {
        audio.pause()
        audio.volume = 1
        onComplete?.()
      }
    }
    requestAnimationFrame(animate)
  }, [])

  // ─── Advance to next step (or complete session) ───────────────────
  // Uses refs only so it stays stable and can safely be called from
  // inside the narration 'ended' event handler.
  const advanceStep = useCallback(() => {
    waitingForNarrationRef.current = false
    if (isLoopingRef.current) {
      setElapsed(0)
      setIsPlaying(true)
    } else if (currentStepRef.current < totalSteps - 1) {
      setCurrentStep(currentStepRef.current + 1)
      setElapsed(0)
    } else {
      setIsPlaying(false)
      if (bgmRef.current) fadeOut(bgmRef.current, 2000, () => onDone())
      else onDone()
    }
  }, [totalSteps, onDone, fadeOut])

  // ─── Stop narration and restore BGM ──────────────────────────────
  const stopNarration = useCallback(() => {
    const narration = narrationRef.current
    if (!narration) return
    isNarrationPlayingRef.current = false
    waitingForNarrationRef.current = false
    narration.pause()
    narration.currentTime = 0
    if (bgmRef.current && !isBgmStoppedRef.current) {
      bgmRef.current.volume = 1
    }
  }, [])

  // ─── Play narration for a given step index ────────────────────────
  // Reads all volatile values from refs — never stale regardless of when called.
  // Critically: does NOT depend on isMuted/isBgmStopped state, so toggling those
  // no longer accidentally restarts narration (that was a bug in the original).
  const playNarration = useCallback((stepIndex: number) => {
    const narration = narrationRef.current
    if (!narration) return

    const url = instructionsRef.current[stepIndex]?.audio
    if (!url) return

    // Hard-stop any in-progress narration
    isNarrationPlayingRef.current = false
    narration.pause()
    narration.currentTime = 0

    if (!audioUnlockedRef.current) return

    narration.src = url
    narration.volume = isMutedRef.current ? 0 : 1

    // Duck BGM while narration plays
    if (bgmRef.current && !isBgmStoppedRef.current) {
      bgmRef.current.volume = 0.2
    }

    isNarrationPlayingRef.current = true

    const onEnded = () => {
      isNarrationPlayingRef.current = false
      // Restore BGM
      if (bgmRef.current && !isBgmStoppedRef.current) {
        const restore = setInterval(() => {
          if (!bgmRef.current) { clearInterval(restore); return }
          bgmRef.current.volume = Math.min(bgmRef.current.volume + 0.05, 1)
          if (bgmRef.current.volume >= 1) clearInterval(restore)
        }, 50)
      }
      // Timer already expired while narration was playing — advance now
      if (waitingForNarrationRef.current) {
        advanceStep()
      }
    }

    narration.addEventListener('ended', onEnded, { once: true })

    // load() + play(): browser uses its cache from the preload above,
    // so this is effectively instant for pre-warmed URLs.
    narration.load()
    narration.play().catch(() => {
      isNarrationPlayingRef.current = false
    })
  }, [advanceStep])

  // ─── Unlock audio on first user gesture ───────────────────────────
  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return
      audioUnlockedRef.current = true
      const narration = narrationRef.current
      if (narration) {
        narration.volume = 0
        narration.play().then(() => {
          narration.pause()
          narration.volume = isMutedRef.current ? 0 : 1
        }).catch(() => {})
      }
      // Now that audio is unlocked, start narration for the current step
      playNarration(currentStepRef.current)
    }
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [playNarration])

  // ─── Init audio elements ──────────────────────────────────────────
  useEffect(() => {
    bgmRef.current = new Audio()
    bgmRef.current.loop = true
    narrationRef.current = new Audio()
    return () => {
      bgmRef.current?.pause()
      bgmRef.current = null
      narrationRef.current?.pause()
      narrationRef.current = null
      audioCacheRef.current.forEach(a => { a.src = '' })
      audioCacheRef.current.clear()
    }
  }, [])

  // ─── BGM fetch ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('background_music')
          .select('id, title, composer, audio_url, duration_seconds')
          .order('created_at')
        if (error) console.error('BGM fetch error:', error)
        if (data && data.length > 0) setTracks(data as Track[])
      } catch (err) {
        console.error('BGM fetch exception:', err)
      } finally {
        setTracksLoaded(true)
      }
    }
    fetchTracks()
  }, [])

  // ─── Auto-play BGM when tracks first load ─────────────────────────
  useEffect(() => {
    if (!bgmRef.current || tracks.length === 0) return
    bgmRef.current.src = tracks[0].audio_url
    bgmRef.current.load()
    bgmRef.current.addEventListener('canplay', () => {
      fadeIn(bgmRef.current!)
    }, { once: true })
  }, [tracks, fadeIn])

  // ─── Sync BGM with play/pause ──────────────────────────────────────
  useEffect(() => {
    if (!bgmRef.current || isBgmStopped) return
    if (isPlaying) {
      fadeIn(bgmRef.current, 800)
    } else {
      fadeOut(bgmRef.current, 800)
    }
  }, [isPlaying, isBgmStopped, fadeIn, fadeOut])

  // ─── Play narration when step changes ─────────────────────────────
  // This is the single source of truth for narration triggers.
  // elapsed/isPlaying are reset here (not in goPrev/goNext) to avoid
  // double-reset and ensure the order is always: stop old → reset → play new.
  useEffect(() => {
    waitingForNarrationRef.current = false
    setElapsed(0)
    setIsPlaying(true)
    playNarration(currentStep)
    return () => {
      stopNarration()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  // ─── Sync mute volume to active narration ─────────────────────────
  useEffect(() => {
    if (narrationRef.current) {
      narrationRef.current.volume = isMuted ? 0 : 1
    }
  }, [isMuted])

  // ─── BGM controls ─────────────────────────────────────────────────
  const handleSelectTrack = useCallback((index: number) => {
    if (!bgmRef.current || tracks.length === 0) return
    setCurrentTrackIndex(index)
    setIsBgmStopped(false)
    fadeOut(bgmRef.current, 600, () => {
      bgmRef.current!.src = tracks[index].audio_url
      bgmRef.current!.load()
      bgmRef.current!.addEventListener('canplay', () => {
        fadeIn(bgmRef.current!, 800)
      }, { once: true })
    })
  }, [tracks, fadeIn, fadeOut])

  const handleStopBgm = useCallback(() => {
    if (!bgmRef.current) return
    fadeOut(bgmRef.current, 1000, () => {
      bgmRef.current!.currentTime = 0
    })
    setIsBgmStopped(true)
  }, [fadeOut])

  // ─── Timer end: narration-aware ───────────────────────────────────
  // KEY FIX: if narration is still playing when the timer runs out,
  // we set a "waiting" flag instead of advancing. The narration's own
  // 'ended' event will then call advanceStep() when it's done.
  // This prevents instructions from cutting audio mid-sentence.
  const handleTimerEnd = useCallback(() => {
    if (isNarrationPlayingRef.current) {
      waitingForNarrationRef.current = true
      return
    }
    advanceStep()
  }, [advanceStep])

  // ─── Elapsed check ────────────────────────────────────────────────
  useEffect(() => {
    if (elapsed >= step.duration_seconds) handleTimerEnd()
  }, [elapsed, step.duration_seconds, handleTimerEnd])

  // ─── Interval tick ────────────────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying])

  // ─── Replay narration on loop restart ─────────────────────────────
  useEffect(() => {
    if (isLooping && elapsed === 0) {
      const t = setTimeout(() => playNarration(currentStepRef.current), 50)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLooping, elapsed])

  // ─── Manual navigation ────────────────────────────────────────────
  // elapsed + isPlaying reset is handled by the [currentStep] effect above —
  // no need to do it here; doing it here caused double-reset.
  const goNextManual = () => {
    setIsLooping(false)
    waitingForNarrationRef.current = false
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      setIsPlaying(false)
      if (bgmRef.current) fadeOut(bgmRef.current, 2000, () => onDone())
      else onDone()
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setIsLooping(false)
      waitingForNarrationRef.current = false
      setCurrentStep((s) => s - 1)
    }
  }

  const jumpToStep = (i: number) => {
    setIsLooping(false)
    waitingForNarrationRef.current = false
    setCurrentStep(i)
  }

  const formatTime = () => {
    const mins = Math.floor(step.duration_seconds / 60)
    const secs = step.duration_seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentSeconds = Math.min(elapsed, step.duration_seconds)
  const displayMins = String(Math.floor(currentSeconds / 60)).padStart(2, "0")
  const displaySecs = String(currentSeconds % 60).padStart(2, "0")

  return (
    <div className="flex flex-col gap-8 items-center max-w-3xl">
      <BackgroundMusicPlayer
        audioRef={bgmRef}
        tracks={tracks}
        currentIndex={currentTrackIndex}
        isStopped={isBgmStopped}
        isLoaded={tracksLoaded}
        onSelectTrack={handleSelectTrack}
        onStop={handleStopBgm}
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
        <div className="w-full flex flex-col items-center gap-2">
          <div className="w-full flex gap-2 items-center">
            <p className="text-xs text-muted-foreground font-mono">{displayMins}:{displaySecs}</p>
            <div className="flex-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono">{formatTime()}</p>
          </div>

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

        <Button
          onClick={() => setIsPlaying((p) => !p)}
          className="w-14 h-14 p-3 [&_svg]:size-6 flex items-center justify-center bg-transparent hover:bg-background rounded-full border border-foreground"
        >
          {isPlaying ? <PauseIcon weight="fill" /> : <PlayIcon weight="fill" />}
        </Button>

        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 0}
            size="sm"
            className="[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:bg-background disabled:bg-transparent disabled:text-muted-foreground font-medium"
          >
            <ArrowLeftIcon weight="fill" />
            Sebelumnya
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLooping((l) => !l)}
            className={cn(
              "[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs border transition-all hover:bg-background",
              isLooping
                ? "bg-background text-muted-foreground font-semibold"
                : "bg-transparent text-muted-foreground"
            )}
          >
            <RepeatIcon weight={isLooping ? "fill" : "regular"} />
            Ulangi
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted((m) => !m)}
            className={cn(
              "[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs rounded-full border transition-all hover:bg-background",
              isMuted
                ? "bg-background text-muted-foreground font-semibold"
                : "bg-transparent text-muted-foreground"
            )}
          >
            {isMuted ? <SpeakerSlashIcon weight="fill" /> : <SpeakerHighIcon weight="fill" />}
            {isMuted ? "Hening" : "Suara"}
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