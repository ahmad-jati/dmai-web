'use client'

import { useEffect, useRef, useState } from 'react'
import { PlayIcon, ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { Route } from 'next'

type Props = {
  youtubeUrl: string
  youtubeKredit: string
  onNext: () => void
  onPrev?: () => void
  autoAdvanceOnComplete?: boolean 
}

const THUMB_QUALITIES = ['hqdefault', 'mqdefault', 'default'] as const

const INTRO_TITLE = 'Halo Mindful Mate'
const INTRO_BODY = `Selamat datang di sesi DAMAI Education. Pada Episode Edukasi hari ini kita akan membahas tentang mengenali stres akademik, mindfulness, dan konsep here and now.

Sebelum kita memulai perjalanan ini, izinkan saya mengajakmu melakukan satu hal yang sangat sederhana.

Berhenti... sejenak.
Tarik napas perlahan.
Dan biarkan dirimu benar-benar hadir di sini.`

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)
  return match?.[1] ?? null
}

function getPlayRange(url: string): { start: number; end: number | null } {
  try {
    const u = new URL(url)
    const start = Number(u.searchParams.get('start') ?? 0)
    const endParam = u.searchParams.get('end')
    const end = endParam ? Number(endParam) : null
    return {
      start: Number.isFinite(start) ? start : 0,
      end: end && Number.isFinite(end) ? end : null,
    }
  } catch {
    return { start: 0, end: null }
  }
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
    <div className="absolute inset-0 z-10 flex flex-col justify-end">
      {!allFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getThumbnailUrl(videoId, THUMB_QUALITIES[qualityIndex])}
          alt="thumbnail"
          onError={handleError}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-900" />
      )}

      <div className="absolute inset-0 bg-black/80" />

      <div className="relative z-10 px-5 py-6 2md:px-8 2md:py-8 h-full  overflow-y-auto flex flex-col justify-center">
        <h2 className="text-white font-semibold text-base 2md:text-lg mb-2">
          {INTRO_TITLE}
        </h2>
        <p className="text-white text-xs/3.5 2md:text-sm/4 whitespace-pre-line">
          {INTRO_BODY}
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        aria-label="Putar video"
        className="absolute bottom-4 right-4 z-20 w-12 h-12 2md:w-14 2md:h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 hover:bg-white transition-transform"
      >
        <PlayIcon weight="fill" className="w-5 h-5 2md:w-6 2md:h-6 text-foreground" />
      </button>
    </div>
  )
}

export function StepVideo({
  youtubeUrl,
  youtubeKredit,
  onNext,
  onPrev,
  autoAdvanceOnComplete = false,
}: Props) {
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const videoId = getYoutubeId(youtubeUrl)
  const { start, end } = getPlayRange(youtubeUrl)

  const playerRef = useRef<YTPlayer | null>(null)

  useEffect(() => {
  if (!started || !videoId || !end) return

  function handleMessage(event: MessageEvent) {
    if (event.origin !== 'https://www.youtube.com') return
    try {
      const data = JSON.parse(event.data)
      if (data.event === 'onStateChange' && data.info === 0) {
        setCompleted(true)
        if (autoAdvanceOnComplete) onNext()
      }
    } catch {
    }
  }

  window.addEventListener('message', handleMessage)
  return () => window.removeEventListener('message', handleMessage)
}, [started, videoId, end, autoAdvanceOnComplete, onNext])

  return (
    <div className="w-full 2md:max-w-2xl mx-auto h-full flex-1 flex justify-between flex-col gap-6">
      <div className="flex flex-col items-center gap-6 flex-1">
        <div
          className={`w-full 2md:rounded-2xl rounded-xl overflow-hidden shadow-sm relative bg-muted/30 text-muted-foreground transition-all duration-300  2md:max-h-100 sm:h-100 h-[60%]
            
          `}
        >
          {!started && videoId && (
            <YoutubeThumbnail videoId={videoId} onClick={() => setStarted(true)} />
          )}
          {videoId && started && (
            <iframe
              ref={iframeRef}
              id="yt-step-player"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1&start=${start}${
                end ? `&end=${end}` : ''
              }`}
              title="Video Edukasi"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="eager"
              className="w-full h-full"
            />
          )}
          {!videoId && (
            <div className="w-full h-full flex items-center justify-center text-sm">
              URL video tidak valid
            </div>
          )}
        </div>

        <div className='flex 2md:flex-row flex-col items-start justify-center 2md:gap-2 gap-1 text-sm/4.5 text-muted-foreground font-medium max-w-2xl'>
          <p className="">Sumber:</p>
          <Link
            href={youtubeUrl as Route}
            target="_blank"
            rel="noopener noreferrer"
            className='hover:underline underline-offset-2'
          >
            {youtubeKredit}
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {onPrev && (
          <Button
            type="button"
            onClick={onPrev}
            className="2md:[&_svg]:size-4 [&_svg]:size-3.5 rounded-sm text-sm 2md:h-9 h-8!
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
          className="2md:[&_svg]:size-4 [&_svg]:size-3.5 rounded-sm text-sm 2md:h-9 h-8!
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