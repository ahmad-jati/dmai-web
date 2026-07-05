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
    <div className="w-full max-w-xl mx-auto h-full flex-1 gap-6 flex justify-between items-center flex-col">

      <div className="flex flex-col items-center justify-start gap-6 w-full h-full rounded-xl group hover:cursor-pointer flex-1">
        <div className="relative w-full max-h-100 h-full flex flex-col gap-6 items-center justify-center rounded-xl bg-gray-100 py-6">
          <Image
            src={"/mentimeter_logo.png"}
            alt={'Aktivitas'}
            width={500}
            height={500}
            priority
            className="object-contain w-28 h-28 aspect-square"
          />
          <div className="flex flex-col justify-center items-center gap-3 rounded-xl">
            <Link
              href={url as Route}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-foreground/90 text-background font-semibold text-sm hover:bg-foreground/90 transition-all">
              <ArrowSquareOutIcon weight="bold" className="w-4 h-4" />
              Buka Aktivitas
            </Link>
            <p className="text-xs text-muted-foreground text-center font-medium">Link akan terbuka di tab baru</p>

          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {onPrev && (
          <Button
            type="button"
            onClick={onPrev}
            className=" 
            2md:[&_svg]:size-4 [&_svg]:size-3.5 rounded-sm text-sm 2md:h-9 h-8!
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
          className="
          2md:[&_svg]:size-4 [&_svg]:size-3.5 rounded-sm text-sm 2md:h-9 h-8!
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