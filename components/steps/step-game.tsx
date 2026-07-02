'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayIcon, ArrowLeftIcon, ArrowRightIcon, ArrowCounterClockwiseIcon, CheckCircleIcon } from '@phosphor-icons/react'
import { Button } from '../ui/button'
import Link from 'next/link'

type Props = {
  onNext: () => void
  onPrev?: () => void
  duration?: number
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StepGame({ onNext, onPrev, duration }: Props) {
  const [started, setStarted] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [remaining, setRemaining] = useState(duration ?? 0)
  const [timerActive, setTimerActive] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const intervalRef = useRef(0)
  const delayRef = useRef(0)

  const hasDuration = !!duration && duration > 0

  // 7s delay
  useEffect(() => {
    if (!started || !hasDuration) return

    delayRef.current = window.setTimeout(() => {
      setTimerActive(true)
    }, 7000)

    return () => {
      window.clearTimeout(delayRef.current)
    }
  }, [started, hasDuration])

  // Countdown tick
  useEffect(() => {
    if (!timerActive || !hasDuration) return

    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalRef.current)
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalRef.current)
    }
  }, [timerActive, hasDuration])

  const handleReset = () => {
    setIframeKey((k) => k + 1)
  }

  const handleStart = () => {
    setStarted(true)
    setRemaining(duration ?? 0)
    setTimerActive(false)
    setIsExpired(false)
  }

  return (
    <div className="flex flex-col items-center px-12 gap-6 w-full">

      {/* Wrapper: iframe + note panel */}
      <div className="flex w-full gap-4 md:h-106 h-140">

        {/* Iframe area */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-sm bg-muted relative">
          {!started ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="text-5xl">🦕</div>
              <Button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all">
                <PlayIcon weight="fill" className="w-4 h-4" />
                Mulai Game
              </Button>
              <p className="text-xs text-muted-foreground">Tekan spasi untuk melompat</p>
            </div>
          ) : isExpired ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95">
              <CheckCircleIcon weight="fill" className="w-14 h-14 text-green-500" />
              <p className="font-semibold text-lg text-foreground text-center">Sesi game selesai!</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Waktu bermain sudah habis. Silahkan ikuti step selanjutnya.
              </p>
            </div>
          ) : (
            <iframe
              key={iframeKey}
              src="https://dinoswords.gg/"
              title="Mini Game Fokus"
              className="w-full h-full"
              allow="autoplay"
            />
          )}
        </div>

        {/* Note panel */}
        <div className="w-60 shrink-0 flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-4">

          {/* Timer */}
          {hasDuration && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Waktu Bermain</p>
              <p className={`text-3xl font-bold tabular-nums ${
                timerActive && remaining <= 30 ? 'text-foreground' : 'text-foreground'
              }`}>
                {!started ? formatTime(duration ?? 0) : !timerActive ? 'Memuat...' : formatTime(remaining)}
              </p>
            </div>
          )}

          {/* Reset button */}
          {started && !isExpired && (
            <Button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-all w-full">
              <ArrowCounterClockwiseIcon className="w-4 h-4 shrink-0" weight="bold" />
              Refresh Game
            </Button>
          )}

          <div className="flex flex-col gap-1.5 mt-1 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tips</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Jika dinosaurus tidak terlihat atau layar menampilkan halaman lain, coba tekan <span className="font-semibold text-foreground">Refresh Game.</span>
            </p>
          </div>

          <div className=''>
            <p className="text-sm/4.5 text-muted-foreground font-medium text-center max-w-2xl">
              Dino Swords by{" "}
              <Link
                href="https://dinoswords.gg/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                MSCHF & 100 Thieves
              </Link>
              .
            </p>
          </div>

        </div>
      </div>

      <div className="flex items-center gap-3">
        {onPrev && (
          <Button
            onClick={onPrev}
            className="hover:bg-lemon dark:bg-primary sm:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground hover:dark:text-foreground rounded-lg">
            <ArrowLeftIcon weight="bold" className="w-4 h-4" />
            Kembali
          </Button>
        )}
        <Button
          onClick={onNext}
          className="bg-lemon hover:bg-lemon dark:bg-primary sm:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground hover:dark:text-foreground rounded-lg">
          Lanjutkan
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}