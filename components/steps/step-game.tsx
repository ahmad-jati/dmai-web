'use client'

type Props = {
  onNext: () => void
}

export function StepGame({ onNext }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full px-4">
      <div className="flex flex-col gap-1 items-center text-center">
        <p className="text-background/90 dark:text-foreground/90 font-semibold text-lg">
          Mini Game: Fokus & Konsentrasi
        </p>
        <p className="text-background/70 dark:text-foreground/70 text-sm">
          Latih fokusmu sebelum melanjutkan sesi.
        </p>
      </div>

      <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-white/20 shadow-lg"
           style={{ height: '380px' }}>
        <iframe
          src="https://dinogameclone.netlify.app/"
          title="Mini Game Fokus"
          className="w-full h-full"
          allow="autoplay"
        />
      </div>

      <button
        onClick={onNext}
        className="px-8 py-3 rounded-full bg-background/90 text-foreground font-semibold text-sm hover:bg-background transition-all"
      >
        Lanjutkan →
      </button>
    </div>
  )
}
