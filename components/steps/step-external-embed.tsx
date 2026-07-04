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

      <div className="flex flex-col items-center justify-start gap-6 w-full h-full rounded-xl group hover:cursor-pointer">
        <div className="relative w-full h-[80%] flex flex-col items-center justify-center rounded-xl">
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

      <div className="flex items-center justify-center gap-1.5">
        {onPrev && (
          <Button
            type="button"
            onClick={onPrev}
            className="hover:bg-foreground/80 hover:text-background dark:bg-transparent hover:dark:bg-foreground hover:dark:text-background 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground 2md:rounded-lg rounded-sm text-sm 2md:h-9 h-8!"
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