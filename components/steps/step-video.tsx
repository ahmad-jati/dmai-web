'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PlayIcon, ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { Route } from 'next'

type Props = {
  youtubeUrl: string
  youtubeKredit: string
  onNext: () => void
  onPrev?: () => void
}

const THUMB_QUALITIES = ['maxresdefault', 'hqdefault', 'mqdefault', 'default'] as const

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)
  return match?.[1] ?? null
}

function getThumbnailUrl(videoId: string, quality: string): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

function YoutubeThumbnail({ videoId, onClick }: { videoId: string; onClick: () => void }) {
  const [qualityIndex, setQualityIndex] = useState(0)
  const [allFailed, setAllFailed] = useState(false)

  const handleError = () => {
    if (qualityIndex < THUMB_QUALITIES.length - 1) {
      setQualityIndex((i) => i + 1)
    } else {
      setAllFailed(true)
    }
  }

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group"
      onClick={onClick}
    >
      {!allFailed ? (
        <Image
          src={getThumbnailUrl(videoId, THUMB_QUALITIES[qualityIndex])}
          alt="thumbnail"
          fill
          unoptimized
          onError={handleError}
          className="object-cover"
        />
      ) : (
        // Placeholder kalau semua thumbnail gagal
        <div className="absolute inset-0 bg-neutral-900" />
      )}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
      <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
        <PlayIcon weight="fill" className="w-7 h-7 text-foreground" />
      </div>
    </div>
  )
}

export function StepVideo({ youtubeUrl, youtubeKredit, onNext, onPrev }: Props) {
  const [started, setStarted] = useState(false)
  const videoId = getYoutubeId(youtubeUrl)
  console.log(youtubeKredit)
  console.log(youtubeUrl)

  return (
    <div className="flex flex-col items-center gap-6 w-full flex-1">
      <div className="w-full max-w-2xl sm:h-full h-300 2md:aspect-video rounded-2xl overflow-hidden shadow-sm bg-black relative flex-1">
        {!started && videoId && (
          <YoutubeThumbnail videoId={videoId} onClick={() => setStarted(true)} />
        )}
        {videoId && started && (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="Video Edukasi"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading='eager'
            className="w-full h-full"
          />
        )}
        {!videoId && (
          <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
            URL video tidak valid
          </div>
        )}
      </div>

      <div className='flex 2md:flex-row flex-col items-center 2md:gap-2 gap-1 text-sm/4.5 text-muted-foreground font-medium text-center max-w-2xl'>
        <p className="">
          Sumber: 
        </p>
        <Link
          href={youtubeUrl as Route}
          target="_blank"
          rel="noopener noreferrer"
          className='hover:underline underline-offset-2'
        >
          {youtubeKredit}
        </Link>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {onPrev && (
          <Button
            type="button"
            onClick={onPrev}
            className="bg-foreground/90 hover:bg-foreground/80 hover:text-background dark:bg-transparent hover:dark:bg-foreground hover:dark:text-background 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground 2md:rounded-lg rounded-sm text-sm 2md:h-9 h-8!"
          >
            <ArrowLeftIcon weight="bold" className="w-4 h-4" />
            Sebelumnya
          </Button>
        )}
        <Button
          type="button"
          onClick={onNext}
          variant={'ghost'}
          className="bg-foreground/90 hover:bg-foreground/80 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-background hover:dark:text-background hover:dark:bg-foreground dark:bg-foreground 2md:rounded-lg rounded-sm text-sm 2md:h-9 h-8!"
        >
          Selanjutnya
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}