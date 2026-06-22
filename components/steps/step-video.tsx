'use client'

type Props = {
  youtubeUrl: string
  onNext: () => void
}

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)
  return match?.[1] ?? null
}

export function StepVideo({ youtubeUrl, onNext }: Props) {
  const videoId = getYoutubeId(youtubeUrl)

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full h-full px-4">
      <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-lg">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="Video Edukasi"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/40 text-white/60 text-sm">
            URL video tidak valid
          </div>
        )}
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
