'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { RepeatIcon, SpeakerSlashIcon, SpeakerHighIcon, PauseIcon, PlayIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@phosphor-icons/react"
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

  // BGM
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isBgmStopped, setIsBgmStopped] = useState(false)
  const bgmRef = useRef<HTMLAudioElement | null>(null)

  // Narration
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const audioUnlockedRef = useRef(false)

  const step = instructions[currentStep]
  const totalSteps = instructions.length
  const progress = Math.min((elapsed / step.duration_seconds) * 100, 100)
  const isLastStep = currentStep === totalSteps - 1

  // ─── Fade helpers ─────────────────────────────────────────────
  const fadeIn = (audio: HTMLAudioElement, duration = 1500) => {
    audio.volume = 0
    audio.play().catch(() => {})
    const steps = 30
    const interval = duration / steps
    let s = 0
    const timer = setInterval(() => {
      s++
      audio.volume = Math.min(s / steps, 1)
      if (s >= steps) clearInterval(timer)
    }, interval)
  }

  const fadeOut = (audio: HTMLAudioElement, duration = 1500, onComplete?: () => void) => {
    const steps = 30
    const interval = duration / steps
    const startVolume = audio.volume
    let s = 0
    const timer = setInterval(() => {
      s++
      audio.volume = Math.max(startVolume * (1 - s / steps), 0)
      if (s >= steps) {
        clearInterval(timer)
        audio.pause()
        audio.volume = 1
        onComplete?.()
      }
    }, interval)
  }

  // ─── Unlock audio on first user gesture ───────────────────────
  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return
      audioUnlockedRef.current = true
      if (narrationRef.current) {
        narrationRef.current.volume = 0
        narrationRef.current.play().then(() => {
          narrationRef.current!.pause()
          narrationRef.current!.volume = isMuted ? 0 : 1
        }).catch(() => {})
      }
    }
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  // ─── Init audio elements ──────────────────────────────────────
  useEffect(() => {
    bgmRef.current = new Audio()
    bgmRef.current.loop = true
    narrationRef.current = new Audio()
    return () => {
      bgmRef.current?.pause()
      bgmRef.current = null
      narrationRef.current?.pause()
      narrationRef.current = null
    }
  }, [])

  // ─── BGM fetch ────────────────────────────────────────────────
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

  // ─── Auto-play BGM when tracks load ──────────────────────────
  useEffect(() => {
    if (!bgmRef.current || tracks.length === 0) return
    bgmRef.current.src = tracks[0].audio_url
    bgmRef.current.load()
    bgmRef.current.addEventListener('canplay', () => {
      fadeIn(bgmRef.current!)
    }, { once: true })
  }, [tracks])

  // ─── Sync BGM with play/pause ─────────────────────────────────
  useEffect(() => {
    if (!bgmRef.current || isBgmStopped) return
    if (isPlaying) {
      fadeIn(bgmRef.current, 800)
    } else {
      fadeOut(bgmRef.current, 800)
    }
  }, [isPlaying, isBgmStopped])

  // ─── Narration per step ───────────────────────────────────────
  useEffect(() => {
    if (!narrationRef.current || !step.audio) return
    const narration = narrationRef.current

    const playNarration = () => {
      if (!audioUnlockedRef.current) return

      narration.pause()
      narration.currentTime = 0
      narration.src = step.audio
      narration.volume = isMuted ? 0 : 1
      narration.load()

      narration.addEventListener('canplaythrough', () => {
        narration.play().catch((e) => console.warn('Narration blocked:', e))

        // Duck BGM while narration plays
        if (bgmRef.current && !isBgmStopped && bgmRef.current.volume > 0) {
          bgmRef.current.volume = 0.2
          narration.onended = () => {
            if (!bgmRef.current || isBgmStopped || !isPlaying) return
            const restore = setInterval(() => {
              if (!bgmRef.current) return clearInterval(restore)
              bgmRef.current.volume = Math.min(bgmRef.current.volume + 0.05, 1)
              if (bgmRef.current.volume >= 1) clearInterval(restore)
            }, 50)
          }
        }
      }, { once: true })
    }

    const timeout = setTimeout(playNarration, 400)
    return () => {
      clearTimeout(timeout)
      narration.pause()
      narration.onended = null
      if (bgmRef.current && !isBgmStopped && isPlaying) {
        bgmRef.current.volume = 1
      }
    }
  }, [currentStep]) // only fires on step change

  // ─── Sync mute to narration ───────────────────────────────────
  useEffect(() => {
    if (narrationRef.current) {
      narrationRef.current.volume = isMuted ? 0 : 1
    }
  }, [isMuted])

  // ─── BGM controls ─────────────────────────────────────────────
  const handleSelectTrack = (index: number) => {
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
  }

  const handleStopBgm = () => {
    if (!bgmRef.current) return
    fadeOut(bgmRef.current, 1000, () => {
      bgmRef.current!.currentTime = 0
    })
    setIsBgmStopped(true)
  }

  // ─── Stepper logic ────────────────────────────────────────────
  const handleTimerEnd = useCallback(() => {
    if (isLooping) {
      setElapsed(0)
      setIsPlaying(true)
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setElapsed(0)
    } else {
      setIsPlaying(false)
      if (bgmRef.current) fadeOut(bgmRef.current, 2000, () => onDone())
      else onDone()
    }
  }, [currentStep, totalSteps, onDone, isLooping])

  const goNextManual = () => {
    setIsLooping(false)
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setElapsed(0)
    } else {
      setIsPlaying(false)
      if (bgmRef.current) fadeOut(bgmRef.current, 2000, () => onDone())
      else onDone()
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

  useEffect(() => {
    if (elapsed >= step.duration_seconds) handleTimerEnd()
  }, [elapsed, step.duration_seconds, handleTimerEnd])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying])

  useEffect(() => {
    setElapsed(0)
    setIsPlaying(true)
  }, [currentStep])

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