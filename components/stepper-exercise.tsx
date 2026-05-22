'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { RepeatIcon, SpeakerSlashIcon, SpeakerHighIcon, PauseIcon, PlayIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@phosphor-icons/react"
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
  const [isAudioReady, setIsAudioReady] = useState(false)

  // Audio hooks
  const bgm = useBGMPlayer()
  const narration = useNarrationPlayback()

  // Refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioUnlockedRef = useRef(false)

  const step = instructions[currentStep]
  const totalSteps = instructions.length
  const progress = Math.min((elapsed / step.duration_seconds) * 100, 100)
  const isLastStep = currentStep === totalSteps - 1

  // ─── Unlock audio on first user gesture ───────────────────────
  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return
      audioUnlockedRef.current = true
      if (narration.ref.current) {
        narration.ref.current.volume = 0
        narration.ref.current.play().then(() => {
          narration.ref.current!.pause()
          narration.ref.current!.volume = isMuted ? 0 : 1
        }).catch(() => {})
      }
    }
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [narration])

  // ─── Setup BGM loop ────────────────────────────────────────────
  useEffect(() => {
    if (bgm.ref.current) {
      bgm.ref.current.loop = true
    }
  }, [])

  // ─── BGM fetch and initialization ─────────────────────────────
  useEffect(() => {
    const initAudio = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('background_music')
          .select('id, title, composer, audio_url, duration_seconds')
          .order('created_at')
        if (error) {
          console.error('BGM fetch error:', error)
          setIsAudioReady(true)
          return
        }
        if (data && data.length > 0) {
          setTracks(data as Track[])
          // Load first track
          await bgm.load(data[0].audio_url)
        }
      } catch (err) {
        console.error('BGM fetch exception:', err)
      } finally {
        setIsAudioReady(true)
      }
    }
    initAudio()
  }, [])

  // ─── Sync BGM with play/pause ─────────────────────────────────
  useEffect(() => {
    if (!isAudioReady || !bgm.ref.current) return
    if (isPlaying && bgm.isBGMStopped) {
      bgm.resume()
    } else if (!isPlaying && !bgm.isBGMStopped) {
      bgm.pause()
    }
  }, [isPlaying, bgm, isAudioReady])

  // ─── Preload next narration steps in background ────────────────
  useEffect(() => {
    if (!isAudioReady) return

    // Preload next 2-3 steps narration in background (Priority 3)
    // This doesn't block, just starts loading
    const preloadAhead = 3
    for (let i = 1; i <= preloadAhead && currentStep + i < totalSteps; i++) {
      const nextStep = instructions[currentStep + i]
      if (nextStep?.audio) {
        const audio = new Audio()
        audio.crossOrigin = 'anonymous'
        audio.src = nextStep.audio
        audio.preload = 'metadata'
        // Fire and forget - don't wait for it
        audio.load()
      }
    }
  }, [currentStep, totalSteps, instructions, isAudioReady])

  // ─── Narration per step ───────────────────────────────────────
  useEffect(() => {
    if (!isAudioReady || !step.audio || !audioUnlockedRef.current) {
      return
    }

    narration.playNarration(
      step.audio,
      isMuted,
      () => bgm.duck(), // onDuckBGM
      () => bgm.restore() // onRestoreBGM
    )

    return () => {
      narration.stopNarration()
    }
  }, [currentStep, step.audio, isMuted, isAudioReady, narration, bgm])

  // ─── Sync mute to narration ────────────��──────────────────────
  useEffect(() => {
    if (narration.ref.current) {
      narration.ref.current.volume = isMuted ? 0 : 1
    }
  }, [isMuted, narration])

  // ─── BGM controls ─────────────────────────────────────────────
  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index)
    bgm.switchTrack(tracks[index].audio_url)
  }

  const handleStopBgm = () => {
    bgm.stop()
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
      bgm.stop()
      setTimeout(() => onDone(), 600)
    }
  }, [currentStep, totalSteps, onDone, isLooping, bgm])

  const goNextManual = () => {
    setIsLooping(false)
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setElapsed(0)
    } else {
      setIsPlaying(false)
      bgm.stop()
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

  if (!isAudioReady) {
    return (
      <div className="flex flex-col gap-8 items-center justify-center min-h-screen max-w-3xl">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full" />
        </div>
        <p className="text-sm text-muted-foreground">Mempersiapkan data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 items-center max-w-3xl">
      <BackgroundMusicPlayer
        audioRef={bgm.ref}
        tracks={tracks}
        currentIndex={currentTrackIndex}
        isStopped={bgm.isBGMStopped}
        isLoaded={isAudioReady}
        onSelectTrack={handleSelectTrack}
        onStop={handleStopBgm}
      />

      <audio ref={bgm.ref} crossOrigin="anonymous" />
      <audio ref={narration.ref} crossOrigin="anonymous" />

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
          disabled={!isAudioReady}
          className="w-14 h-14 p-3 [&_svg]:size-6 flex items-center justify-center bg-transparent hover:bg-background rounded-full border border-foreground disabled:opacity-50"
        >
          {isPlaying ? <PauseIcon weight="fill" /> : <PlayIcon weight="fill" />}
        </Button>

        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 0 || !isAudioReady}
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
            disabled={!isAudioReady}
            className={cn(
              "[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs border transition-all hover:bg-background disabled:opacity-50",
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
            disabled={!isAudioReady}
            className={cn(
              "[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs rounded-full border transition-all hover:bg-background disabled:opacity-50",
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
              disabled={!isAudioReady}
              className="[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs text-foreground font-semibold border border-foreground rounded-full disabled:opacity-50"
            >
              <CheckIcon weight="bold" />
              Selesai
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={goNextManual}
              disabled={!isAudioReady}
              className="[&_svg]:size-4 flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:bg-background disabled:opacity-50 font-medium"
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
