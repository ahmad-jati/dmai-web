'use client'

import { Section } from "@/components/layout/section-wrapper"
import Image from "next/image"
import { BackgroundMusicPlayer } from "@/components/background-music-player"
import { Button } from "@/components/ui/button"
import { RepeatIcon, SpeakerSlashIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react"
import { StepperExercise } from "@/components/stepper-exercise"
import { data_session } from "@/lib/data-detail-session"
import { toSlug } from "@/components/session-grid"
import { notFound } from "next/navigation"
import { use } from "react"

type Props = {
  params: Promise<{ slug: string }>
}

export default function ExercisePage({ params }: Props) {
  const { slug } = use(params)
  const session = data_session.find((s) => toSlug(s.session_name) === slug)

  if (!session) notFound()

  return (
    <div className="w-full">
      <Section className="bg-celeste flex flex-col items-center justify-center gap-6">
        <BackgroundMusicPlayer />

        <StepperExercise instructions={session.instructions} sessionName={session.session_name} />
      </Section>
    </div>
  )
}