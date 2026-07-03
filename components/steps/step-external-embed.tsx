'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowSquareOutIcon, ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { Button } from '../ui/button'
import { Route } from 'next'

type Props = {
  url: string
  onNext: () => void
  onPrev?: () => void
}

export function StepExternalEmbed({ url, onNext, onPrev }: Props) {
  return (
    <div className="w-full max-w-xl mx-auto h-full flex-1 gap-5 flex justify-between items-center flex-col">

      <div className="flex flex-col items-center justify-center gap-6 w-full h-full bg-celeste rounded-xl group hover:bg-celeste/80 hover:cursor-pointer">
        <div className="relative w-full h-full flex flex-col items-center justify-center rounded-xl">
          <Image
            src={"/tropicaline/compress/Play.png"}
            alt={'Aktivitas'}
            fill
            unoptimized
            priority
            className="object-cover w-full h-full rounded-xl"
          />
          <div className="flex absolute inset-0 flex-col justify-center items-center gap-6 bg-foreground/30 rounded-xl">
            <Link
              href={url as Route}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all">
              <ArrowSquareOutIcon weight="bold" className="w-4 h-4" />
              Buka Aktivitas
            </Link>
            <p className="text-xs text-background text-center font-medium">Link akan terbuka di tab baru</p>

          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onPrev && (
          <Button
            type="button"
            onClick={onPrev}
            className="hover:bg-foreground/96 hover:text-background dark:bg-primary sm:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground hover:dark:text-foreground rounded-lg transition-all">
            <ArrowLeftIcon weight="bold" className="w-4 h-4" />
            Kembali
          </Button>
        )}
        <Button
          type="button"
          onClick={onNext}
          variant={'ghost'}
          className="bg-foreground hover:bg-foreground/96 dark:bg-primary sm:[&_svg]:size-4 [&_svg]:size-3.5 text-background hover:dark:text-foreground rounded-lg"
        >
          Lanjutkan
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}