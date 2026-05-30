'use client'

import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { Section } from "@/components/layout/section-wrapper"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { StepperExercise } from "@/components/stepper-exercise"
import { fetchSessionBySlug, type SessionData } from "@/lib/data-detail-session"
import { notFound } from "next/navigation"
import { RepeatIcon, HouseIcon } from "@phosphor-icons/react"
import { Route } from "next"
import { createClient } from "@/lib/supabase/client"

type Props = {
  params: Promise<{ slug: string }>
}

export default function ExercisePage({ params }: Props) {
  const { slug } = use(params)

  const [session, setSession] = useState<SessionData | null | undefined>(undefined)
  const [isDone, setIsDone] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    fetchSessionBySlug(slug).then((data) => setSession(data ?? null))
  }, [slug])

  const handleRepeat = () => {
    setKey((k) => k + 1)
    setIsDone(false)
  }

  const handleDone = async () => {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (user && session) {
      await supabase.from("session_completions").insert({
        user_id: user.id,
        session_slug: slug,
        session_name: session.session_name,
      })
    }

    setIsDone(true)
  }

  // loading
  if (session === undefined) {
    return (
      <div className="w-full">
        <Section className="bg-celeste flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Memuat sesi...</p>
        </Section>
      </div>
    )
  }

  // not found
  if (session === null) notFound()

  if (isDone) {
    return (
      <div className="w-full">
        <Section className="bg-celeste flex flex-col items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-md font-medium">Kamu telah menyelesaikan sesi</p>
            <h2 className="text-h2 font-semibold">{session.session_name}</h2>
          </div>

          <div className="rounded-4xl border border-foreground bg-background p-2 w-100 h-68">
            <Image
              src={session.image_cover}
              alt={''}
              width={2000}
              height={2000}
              className="w-full h-full object-cover rounded-3xl"
              loading="eager"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleRepeat} className="w-full flex items-center gap-2 bg-green">
              <RepeatIcon className="w-4 h-4" weight="fill" />
              Ulangi Pelatihan Ini
            </Button>
            <Button variant="outline" className="w-full flex items-center gap-2 bg-background" asChild>
              <Link href={"/homepage" as Route}>
                <HouseIcon className="w-4 h-4" weight="fill" />
                Kembali ke Beranda
              </Link>
            </Button>
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="w-full">
        <StepperExercise
          key={key}
          instructions={session.instructions}
          sessionName={session.session_name}
          onDone={handleDone}
        />
      {/* <Section className="bg-celeste flex flex-col items-center justify-center gap-6">
      </Section> */}
    </div>
  )
}