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

  // BGM state — owned here so pause/play/done can control it
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isBgmStopped, setIsBgmStopped] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const step = instructions[currentStep]
  const totalSteps = instructions.length
  const progress = Math.min((elapsed / step.duration_seconds) * 100, 100)
  const isLastStep = currentStep === totalSteps - 1

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('background_music')
          .select('id, title, composer, audio_url, duration_seconds')
          .order('created_at')

        if (error) {
          console.error('BGM fetch error:', error)
        }

        if (data && data.length > 0) {
          setTracks(data as Track[])
        }
      } catch (err) {
        console.error('BGM fetch exception:', err)
      } finally {
        setTracksLoaded(true)   // ← always mark as done
      }
    }
    fetchTracks()
  }, [])

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.loop = true
    return () => {
      // Stop BGM when component unmounts (page change)
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  // Auto-play first track when tracks load
  useEffect(() => {
    if (!audioRef.current || tracks.length === 0) return
    audioRef.current.src = tracks[0].audio_url
    audioRef.current.load()
    audioRef.current.addEventListener('canplay', () => {
      fadeIn(audioRef.current!)
    }, { once: true })
  }, [tracks])

  // Sync BGM with stepper play/pause
  useEffect(() => {
    if (!audioRef.current || isBgmStopped) return
    if (isPlaying) {
      fadeIn(audioRef.current, 800)
    } else {
      fadeOut(audioRef.current, 800)
    }
  }, [isPlaying, isBgmStopped])

  const handleSelectTrack = (index: number) => {
    if (!audioRef.current || tracks.length === 0) return
    setCurrentTrackIndex(index)
    setIsBgmStopped(false)
    fadeOut(audioRef.current, 600, () => {
      audioRef.current!.src = tracks[index].audio_url
      audioRef.current!.load()
      audioRef.current!.addEventListener('canplay', () => {
        fadeIn(audioRef.current!, 800)
      }, { once: true })
    })
  }

  const handleStopBgm = () => {
    if (!audioRef.current) return
    fadeOut(audioRef.current, 1000, () => {
      audioRef.current!.currentTime = 0
    })
    setIsBgmStopped(true)
  }

  // ─── Stepper logic ───────────────────────────────────────────
  const handleTimerEnd = useCallback(() => {
    if (isLooping) {
      setElapsed(0)
      setIsPlaying(true)
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setElapsed(0)
    } else {
      setIsPlaying(false)
      // Stop BGM when session ends
      audioRef.current?.pause()
      onDone()
    }
  }, [currentStep, totalSteps, onDone, isLooping])

  const goNextManual = () => {
    setIsLooping(false)
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setElapsed(0)
    } else {
      setIsPlaying(false)
      audioRef.current?.pause()
      onDone()
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

  const fadeIn = (audio: HTMLAudioElement, duration = 1500) => {
    audio.volume = 0
    audio.play().catch(() => {})
    const steps = 30
    const interval = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      audio.volume = Math.min(step / steps, 1)
      if (step >= steps) clearInterval(timer)
    }, interval)
  }

  const fadeOut = (audio: HTMLAudioElement, duration = 1500, onDone?: () => void) => {
    const steps = 30
    const interval = duration / steps
    const startVolume = audio.volume
    let step = 0
    const timer = setInterval(() => {
      step++
      audio.volume = Math.max(startVolume * (1 - step / steps), 0)
      if (step >= steps) {
        clearInterval(timer)
        audio.pause()
        audio.volume = 1
        onDone?.()
      }
    }, interval)
  }

  useEffect(() => {
    if (elapsed >= step.duration_seconds) {
      handleTimerEnd()
    }
  }, [elapsed, step.duration_seconds, handleTimerEnd])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => e + 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
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
        audioRef={audioRef}
        tracks={tracks}
        currentIndex={currentTrackIndex}
        isStopped={isBgmStopped}
        onSelectTrack={handleSelectTrack}
        onStop={handleStopBgm}
        isLoaded={tracksLoaded} 
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
            {isLooping ? "Ulangi" : "Ulangi"}
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
            {isMuted
              ? <SpeakerSlashIcon weight="fill" />
              : <SpeakerHighIcon weight="fill" />
            }
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