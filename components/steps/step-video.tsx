'use client'

import { useState } from 'react'
import { PlayIcon, ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { Button } from '../ui/button'
import Image from 'next/image'

type Props = {
  youtubeUrl: string
  onNext: () => void
  onPrev?: () => void
}

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)
  return match?.[1] ?? null
}

export function StepVideo({ youtubeUrl, onNext, onPrev }: Props) {
  const [started, setStarted] = useState(false)
  const videoId = getYoutubeId(youtubeUrl)
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-border shadow-sm bg-black relative">
        {!started && (
          <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group"
            onClick={() => setStarted(true)}>
            {thumbUrl && (
              <img src={thumbUrl} alt="thumbnail" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
            <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <PlayIcon weight="fill" className="w-7 h-7 text-foreground ml-1" />
            </div>
          </div>
        )}
        {videoId && started && (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="Video Edukasi"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        )}
        {!videoId && (
          <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
            URL video tidak valid
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onPrev && (
          <Button onClick={onPrev}
            className="hover:bg-lemon dark:bg-primary sm:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground hover:dark:text-foreground rounded-lg">
            <ArrowLeftIcon weight="bold" className="w-4 h-4" />
            Kembali
          </Button>
        )}
        <Button onClick={onNext}
          className="bg-lemon hover:bg-lemon dark:bg-primary sm:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground hover:dark:text-foreground rounded-lg">
          Lanjutkan
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}