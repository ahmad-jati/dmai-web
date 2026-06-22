'use client'

import { useState } from 'react'
import { PlayIcon, ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'

type Props = {
  onNext: () => void
  onPrev?: () => void
}

export function StepGame({ onNext, onPrev }: Props) {
  const [started, setStarted] = useState(false)

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex flex-col gap-1 items-center text-center">
        <p className="font-semibold text-lg text-foreground">Mini Game: Fokus & Konsentrasi</p>
        <p className="text-sm text-muted-foreground">Latih fokusmu sebelum melanjutkan sesi.</p>
      </div>

      <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-border shadow-sm bg-muted relative"
        style={{ height: '380px' }}>
        {!started ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">🦕</div>
            <button onClick={() => setStarted(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all">
              <PlayIcon weight="fill" className="w-4 h-4" />
              Mulai Game
            </button>
            <p className="text-xs text-muted-foreground">Tekan spasi untuk melompat</p>
          </div>
        ) : (
          <iframe src="https://dinogameclone.netlify.app/" title="Mini Game Fokus" className="w-full h-full" allow="autoplay" />
        )}
      </div>

      <div className="flex items-center gap-3">
        {onPrev && (
          <button onClick={onPrev}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-all">
            <ArrowLeftIcon weight="bold" className="w-4 h-4" />
            Kembali
          </button>
        )}
        <button onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all">
          Lanjutkan
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}