'use client'

import Image from 'next/image'
import { Spinner } from '@/components/ui/spinner'

type Props = {
  sessionName?: string
  sessionImageCover?: string
  label?: string
}

export function SessionLoadingCard({ sessionName, sessionImageCover, label = 'Mempersiapkan sesi…' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background grid-bg w-full">
      <div className="flex flex-col items-center gap-3 px-6 lg:py-12 py-8 bg-white dark:bg-popover border border-muted-foreground rounded-2xl shadow-sm max-w-lg sm:w-full w-[80%]">
        <p className="text-p text-muted-foreground -mb-2 text-center font-semibold">DMAI - Sesi</p>
        <h3 className="md:text-h1/8 text-2xl/7 text-center font-semibold">
          {sessionName ?? 'Memuat sesi…'}
        </h3>
        <div className="relative sm:w-100 w-full xs:h-60 h-40 rounded-xl overflow-hidden mt-3 bg-muted-foreground/10">
          {sessionImageCover ? (
            <Image
              src={sessionImageCover}
              alt={sessionName ?? ''}
              fill
              unoptimized
              priority
              className="object-cover object-center w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner className="text-muted-foreground/30 w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3 rounded-full border border-muted-foreground/20 bg-muted-foreground/10 px-4 py-2 text-muted-foreground">
          <Spinner className="text-muted-foreground w-4 h-4" />
          <p className="text-sm font-medium tracking-wide">{label}</p>
        </div>
      </div>
    </div>
  )
}