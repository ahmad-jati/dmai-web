'use client'

import { Section } from "@/components/layout/section-wrapper"
import Image from "next/image"
import { BackgroundMusicPlayer } from "@/components/background-music-player"
import { Button } from "@/components/ui/button"
import { PlayIcon, RepeatIcon, SpeakerSlashIcon, PauseIcon } from "@phosphor-icons/react"
import { StepperExercise } from "@/components/stepper-exercise"

export default function Page(){
  return (
    <div className="w-full">
      <Section className="bg-celeste flex flex-col items-center justify-center gap-6">
        <BackgroundMusicPlayer/>

        <div className="rounded-4xl border border-foreground bg-background p-2 w-100 h-50">
          <Image
            src={'/serene1.png'}
            alt="Serene Woman With Flowers Illustrations"
            width={2000}
            height={2000}
            className="w-full h-full object-cover rounded-3xl"
            loading="eager"
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-h2 font-semibold">Motivation - step <span>1</span></p>
          <p className="text-sm max-w-100">Lorem Ipsum is simply dummy text of the printing and typesetting industry. </p>
        </div>

        
        <div className="flex flex-col items-center gap-3">
          <StepperExercise/>

          <Button className="w-16 h-16 p-3 [&_svg]:size-7 flex items-center justify-center bg-transparent hover:bg-white">
            <PauseIcon className="w-5 h-5" weight="fill"/>
          </Button>

          <div className="flex gap-4 items-center">
            <Button variant={'ghost'} className="[&_svg]:size-4 flex items-center justify-center bg-transparent px-3 py-2 text-muted-foreground">
              <RepeatIcon className="w-5 h-5" weight="fill"/>
              ULANGI STEP
            </Button>

            <Button variant={'ghost'} className="[&_svg]:size-4 flex items-center justify-center bg-transparent px-3 py-2 text-muted-foreground">
              <SpeakerSlashIcon className="w-5 h-5" weight="fill"/>
              HENING
            </Button>

          </div>
        </div>
      </Section>
    </div>
  )
}