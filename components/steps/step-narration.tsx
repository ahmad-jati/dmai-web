'use client'

import Image from 'next/image'

type Props = {
  title: string
  description: string
  image: string
  // layout context
  isMobile: boolean
}

export function StepNarration({ title, description, image, isMobile }: Props) {
  if (isMobile) {
    return (
      <>
        {/* Cover image */}
        <div className="flex justify-center items-center shrink-0 2xs:flex-1 sm:px-16 px-0 2xs:min-h-[calc(56dvh-52px)] min-h-fit bg-amber-50 mt-2 2xs:rounded-3xl rounded-xl">
          <div className="relative w-full 2xs:h-full h-56 2xs:rounded-3xl rounded-xl overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              unoptimized
              priority
              className="object-cover object-center w-full h-full"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-black/50 to-transparent" />
          </div>
        </div>

        {/* Step label + title */}
        <div className="flex flex-col gap-1 text-center pt-1 shrink-0 2xs:h-32 h-40 overflow-y-auto my-2">
          <div className="flex flex-col gap-2 items-center xs:px-6">
            <p className="sm:text-h2/7 text-lg/5.5 font-semibold text-foreground text-center">{title}</p>
            {description && (
              <p className="xs:text-p/4.5 text-p/4.5 text-muted-foreground text-center text-pretty">{description}</p>
            )}
          </div>
        </div>
      </>
    )
  }

  // Desktop — background image is handled by shell, we just return the text content
  return (
    <div className="flex flex-col gap-2 items-center xs:px-6 max-w-xl sm:max-w-lg h-40 overflow-y-auto justify-start">
      <p className="sm:text-h2/7 text-xl/5.5 font-semibold text-background dark:text-foreground text-center">{title}</p>
      {description && (
        <p className="xs:text-p/5 text-sm/4 text-background dark:text-foreground text-center">{description}</p>
      )}
    </div>
  )
}
