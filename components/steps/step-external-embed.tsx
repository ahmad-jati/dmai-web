'use client'

import { ArrowSquareOutIcon, ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'

type Props = {
  url: string
  label: string
  onNext: () => void
  onPrev?: () => void
}

export function StepExternalEmbed({ url, label, onNext, onPrev }: Props) {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex flex-col gap-1 items-center text-center">
        <p className="font-semibold text-lg text-foreground">Aktivitas Eksternal</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Klik tombol di bawah untuk membuka aktivitas, lalu kembali ke sini setelah selesai.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3 p-6 rounded-2xl border border-border bg-muted items-center">
        <div className="text-4xl">🔗</div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all">
          <ArrowSquareOutIcon weight="bold" className="w-4 h-4" />
          {label || 'Buka Aktivitas'}
        </a>
        <p className="text-xs text-muted-foreground text-center">Link akan terbuka di tab baru</p>
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
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors px-4 py-3">
          Sudah selesai, lanjutkan →
        </button>
      </div>
    </div>
  )
}