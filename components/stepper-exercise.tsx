'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { RepeatIcon, SpeakerSlashIcon, SpeakerHighIcon, PauseIcon, PlayIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import type { SessionInstruction } from "@/lib/data-detail-session"

type Props = {
  instructions: SessionInstruction[]
  sessionName: string
}

export function StepperExercise({ instructions, sessionName }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0) // 0-indexed
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const step = instructions[currentStep]
  const totalSteps = instructions.length
  const progress = Math.min((elapsed / step.duration_seconds) * 100, 100)

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      setElapsed(0)
    }
  }, [currentStep, totalSteps])

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
      setElapsed(0)
    }
  }

  const repeatStep = () => {
    setElapsed(0)
    setIsPlaying(true)
  }

  // Auto-advance when step timer finishes
  useEffect(() => {
    if (elapsed >= step.duration_seconds) {
      goNext()
    }
  }, [elapsed, step.duration_seconds, goNext])

  // Timer tick
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

  // Reset elapsed when step changes
  useEffect(() => {
    setElapsed(0)
  }, [currentStep])

  const remainingSeconds = Math.max(step.duration_seconds - elapsed, 0)
  const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  const secs = String(remainingSeconds % 60).padStart(2, '0')
  const isLastStep = currentStep === totalSteps - 1
  const isDone = isLastStep && elapsed >= step.duration_seconds

  return (
    <>
      {/* Step image */}
      <div className="rounded-4xl border border-foreground bg-background p-2 w-100 h-50">
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

      {/* Step info */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold tracking-widest">
          <span>LANGKAH {currentStep + 1} / {totalSteps}</span>
        </div>
        <p className="text-h2 font-semibold">{step.title}</p>
        <p className="text-sm max-w-100">{step.description}</p>
        <p className="text-xs text-muted-foreground font-mono">{mins}:{secs}</p>
      </div>

      {/* Progress bar */}
      <div className="w-100 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex gap-1.5">
        {instructions.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentStep(i); setElapsed(0) }}
            className={`rounded-full transition-all ${i === currentStep ? 'w-6 h-2 bg-foreground' : i < currentStep ? 'w-2 h-2 bg-foreground/60' : 'w-2 h-2 bg-foreground/20'}`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {isDone ? (
          <Button
            onClick={() => router.back()}
            className="w-16 h-16 p-3 [&_svg]:size-7 flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 rounded-full"
          >
            <CheckIcon className="w-5 h-5" weight="bold" />
          </Button>
        ) : (
          <Button
            onClick={() => setIsPlaying((p) => !p)}
            className="w-16 h-16 p-3 [&_svg]:size-7 flex items-center justify-center bg-transparent hover:bg-white rounded-full border border-foreground"
          >
            {isPlaying
              ? <PauseIcon className="w-5 h-5" weight="fill" />
              : <PlayIcon className="w-5 h-5" weight="fill" />
            }
          </Button>
        )}

        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="[&_svg]:size-4 flex items-center justify-center bg-transparent px-3 py-2 text-muted-foreground disabled:opacity-30"
          >
            <ArrowLeftIcon className="w-5 h-5" weight="fill" />
            SEBELUMNYA
          </Button>

          <Button
            variant="ghost"
            onClick={repeatStep}
            className="[&_svg]:size-4 flex items-center justify-center bg-transparent px-3 py-2 text-muted-foreground"
          >
            <RepeatIcon className="w-5 h-5" weight="fill" />
            ULANGI
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsMuted((m) => !m)}
            className="[&_svg]:size-4 flex items-center justify-center bg-transparent px-3 py-2 text-muted-foreground"
          >
            {isMuted
              ? <SpeakerHighIcon className="w-5 h-5" weight="fill" />
              : <SpeakerSlashIcon className="w-5 h-5" weight="fill" />
            }
            {isMuted ? 'NYALAKAN' : 'HENING'}
          </Button>

          {!isLastStep && (
            <Button
              variant="ghost"
              onClick={goNext}
              className="[&_svg]:size-4 flex items-center justify-center bg-transparent px-3 py-2 text-muted-foreground"
            >
              SELANJUTNYA
              <ArrowRightIcon className="w-5 h-5" weight="fill" />
            </Button>
          )}
        </div>
      </div>
    </>
  )
}