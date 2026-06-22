'use client'

import Image from 'next/image'

type Props = {
  title: string
  description: string
  image: string
}

export function StepNarration({ title, description, image }: Props) {

  

  return (
    // desktop: full bg image handled by shell, this is just the text overlay content
    // mobile: image shown inline
    <div className="flex flex-col items-center gap-4 w-full h-full">
      {/* Mobile image */}
      <div className="2md:hidden w-full flex-1 min-h-48 rounded-2xl overflow-hidden relative">
        <Image
          src={image}
          alt={title}
          fill
          unoptimized
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-black/50 to-transparent" />
      </div>

      {/* Text content — shown on both, but styled differently via parent */}
      <div className="flex flex-col gap-2 items-center text-center px-2 2md:max-w-xl w-full">
        <p className="sm:text-2xl text-lg font-semibold 2md:text-background text-foreground leading-snug">
          {title}
        </p>
        {description && (
          <p className="text-sm/5 2md:text-background/80 text-muted-foreground text-center text-pretty">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}