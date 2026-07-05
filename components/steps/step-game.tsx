'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayIcon, ArrowLeftIcon, ArrowRightIcon, ArrowCounterClockwiseIcon, CheckCircleIcon } from '@phosphor-icons/react'
import { Button } from '../ui/button'
import Link from 'next/link'
import Image from 'next/image'

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
    <div className="flex-1 flex flex-col items-center 2md:px-12 px-0 gap-6 w-full">

      {/* Wrapper: iframe + note panel */}
      <div className="flex 2md:flex-row flex-col w-full gap-4 flex-1">

        {/* Iframe area */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-sm bg-muted/20 dark:bg-muted relative ">
          {!started ? (
            <div className="2md:h-100 h-90 flex flex-col items-center justify-center gap-4 2md:p-4 p-6">
              {/* <p className='text-base font-medium'>
                Let&apos;s Play DINO Game!!
              </p> */}
              <div className="relative 2md:w-50 w-40 h-40">
                <Image
                  src={"/dino-game.png"}
                  alt={'Dino game'}
                  fill
                  unoptimized
                  priority
                  className="object-contain w-full h-full rounded-xl dark:invert"
                />
              </div>
              <Button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-celeste/80 hover:bg-celeste border-foreground/40 text-foreground font-semibold text-sm transition-all">
                <PlayIcon weight="fill" className="w-4 h-4" />
                Start Game
              </Button>
            </div>
          ) : isExpired ? (
            <div className="2md:h-100 h-90 flex flex-col items-center justify-center 2md:gap-2 2md:p-4 p-6 bg-muted/20 dark:bg-muted">
              <CheckCircleIcon weight="fill" className="w-14 h-14 text-green dark:text-foreground" />
              <p className="font-semibold text-lg text-foreground text-center">Sesi game selesai!</p>
              <p className="sm:text-sm text-xs/3 text-muted-foreground text-center -mt-1">
                Waktu bermain sudah habis. Silahkan ikuti step selanjutnya.
              </p>
            </div>
          ) : (
            <div className='2md:h-100 h-90'>
              <iframe
                key={iframeKey}
                src="https://dinoswords.gg/"
                title="Mini Game Fokus"
                className="w-full h-full"
                allow="autoplay"
              />
            </div>
          )}
        </div>

        {/* Note panel */}
        <div className="2md:w-60 w-full shrink-0 flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 dark:bg-muted p-4">

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
          <Button
            onClick={handleReset}
            disabled={!timerActive || isExpired}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-celeste text-sm font-medium text-foreground hover:bg-muted transition-all w-full disabled:opacity-100 disabled:cursor-not-allowed">
            <ArrowCounterClockwiseIcon className="w-4 h-4 shrink-0" weight="bold" />
            Refresh Game
          </Button>
          <div className="flex flex-col gap-1.5 mt-1 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tips</p>
            <ul className='list-disc list-outside text-muted-foreground pl-4'>
              <li>
                <p className="text-xs leading-loose">
                  Tekan <span className='text-2xs bg-muted dark:bg-popover text-foreground rounded-xs py-1 px-2'>Spasi</span> pada keyboard komputer atau <span className='text-2xs bg-muted dark:bg-popover text-foreground rounded-xs py-1 px-2'>Tap layar</span> di garis jalan Dino pada mobile.
                </p>
              </li>
              <li>
                <p className="text-xs leading-snug">
                  Jika dinosaurus tidak muncul atau layar menampilkan halaman lain, coba tekan <span className="font-semibold text-foreground">Refresh Game.</span>
                </p>
              </li>
            </ul>
          </div>

          <div className=''>
            <p className="text-sm/4.5 text-muted-foreground font-medium text-center max-w-2xl">
              Dino Swords dari{" "}
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

      <div className="flex items-center justify-center gap-1.5">
        {onPrev && (
          <Button
            type="button"
            onClick={onPrev}
            className=" 
            2md:[&_svg]:size-4 [&_svg]:size-3.5 rounded-sm text-sm 2md:h-9 h-8!
            hover:bg-foreground/80 hover:text-background text-foreground
            dark:bg-transparent hover:dark:bg-foreground hover:dark:text-background"
          >
            <ArrowLeftIcon weight="bold" className="w-4 h-4" />
            Sebelumnya
          </Button>
        )}
        <Button
          type="button"
          onClick={onNext}
          variant={'ghost'}
          className="
          2md:[&_svg]:size-4 [&_svg]:size-3.5 rounded-sm text-sm 2md:h-9 h-8!
          bg-foreground/90 hover:bg-foreground/80 text-background
          dark:bg-foreground dark:text-background 
          disabled:dark:bg-muted/20 disabled:dark:text-white/50"
        >
          Selanjutnya
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}