'use client'

type Props = {
  url: string
  label: string
  onNext: () => void
}

export function StepExternalEmbed({ url, label, onNext }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full h-full px-4 text-center">
      <div className="flex flex-col gap-2 items-center">
        <p className="text-background/90 dark:text-foreground/90 font-semibold text-lg">
          Aktivitas Eksternal
        </p>
        <p className="text-background/70 dark:text-foreground/70 text-sm max-w-sm">
          Klik tombol di bawah untuk membuka aktivitas, lalu kembali ke sini setelah selesai.
        </p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-8 py-3 rounded-full bg-background/90 text-foreground font-semibold text-sm hover:bg-background transition-all"
      >
        {label || 'Buka Aktivitas'} ↗
      </a>

      <button
        onClick={onNext}
        className="text-background/60 dark:text-foreground/60 text-sm underline underline-offset-2 hover:text-background/90 transition-colors"
      >
        Sudah selesai, lanjutkan
      </button>
    </div>
  )
}
