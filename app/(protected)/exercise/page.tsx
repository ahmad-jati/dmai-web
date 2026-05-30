'use client'

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Section } from "@/components/layout/section-wrapper"
import { StepperExercise } from "@/components/stepper-exercise"
import { fetchSessionBySlug, type SessionData } from "@/lib/data-detail-session"
import { notFound } from "next/navigation"

type Props = {}

function ExercisePageContent({}: Props) {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')

  const [session, setSession] = useState<SessionData | null | undefined>(undefined)
  const [isDone, setIsDone] = useState(false)
  const [key, setKey] = useState(0)

  // Load session data based on slug
  useEffect(() => {
    if (!slug) {
      setSession(null)
      return
    }

    fetchSessionBySlug(slug).then((data) => {
      setSession(data ?? null)
    })
  }, [slug])

  const handleRepeat = () => {
    setKey((k) => k + 1)
    setIsDone(false)
  }

  const handleDone = async () => {
    setIsDone(true)
  }

  // No slug provided
  if (!slug) {
    return notFound()
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
            <img
              src={session.image_cover}
              alt={session.session_name}
              className="w-full h-full object-cover rounded-3xl"
            />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleRepeat}
              className="w-full flex items-center justify-center gap-2 bg-green text-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Ulangi Pelatihan Ini
            </button>
            <a 
              href="/homepage"
              className="w-full flex items-center justify-center gap-2 bg-background border border-foreground text-foreground px-4 py-2 rounded-lg font-medium hover:bg-foreground/5"
            >
              Kembali ke Beranda
            </a>
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Section className="bg-celeste flex flex-col items-center justify-center gap-6">
        <StepperExercise
          key={key}
          instructions={session.instructions}
          sessionName={session.session_name}
          onDone={handleDone}
        />
      </Section>
    </div>
  )
}

export default function ExercisePage(props: Props) {
  return (
    <Suspense fallback={
      <div className="w-full">
        <Section className="bg-celeste flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Memuat sesi...</p>
        </Section>
      </div>
    }>
      <ExercisePageContent {...props} />
    </Suspense>
  )
}
