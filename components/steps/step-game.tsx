'use client'

import { useState } from 'react'
import { PlayIcon, ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { Button } from '../ui/button'
import Link from 'next/link'

type Props = {
  onNext: () => void
  onPrev?: () => void
}

export function StepGame({ onNext, onPrev }: Props) {
  const [started, setStarted] = useState(false)

  return (
    <div className="flex flex-col items-center px-12 gap-6 w-full">
      {/* <div className="flex flex-col gap-1 items-center text-center">
        <p className="font-semibold text-lg text-foreground">Mini Game: Fokus & Konsentrasi</p>
        <p className="text-sm text-muted-foreground">Latih fokusmu sebelum melanjutkan sesi.</p>
      </div> */}

      <div className="w-full rounded-2xl overflow-hidden border border-border shadow-sm bg-muted relative md:h-106 h-140"> 
        {!started ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">🦕</div>
            <Button 
              onClick={() => setStarted(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all">
              <PlayIcon weight="fill" className="w-4 h-4" />
              Mulai Game
            </Button>
            <p className="text-xs text-muted-foreground">Tekan spasi untuk melompat</p>
          </div>
        ) : (
          <iframe src="https://elgoog.im/dinosaur-game/" title="Mini Game Fokus" className="w-full h-full" allow="autoplay" />
        )}
      </div>

      <p className="text-sm/4.5 text-muted-foreground font-medium text-center max-w-2xl">
        Original game by Google. Web version by{" "}
        <Link
          href="https://elgoog.im/dinosaur-game/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          Team elgooG
        </Link>
        . 
      </p>

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