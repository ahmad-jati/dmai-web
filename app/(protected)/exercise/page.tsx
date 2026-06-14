'use client'

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Section } from "@/components/layout/section-wrapper"
import { StepperExercise } from "@/components/stepper-exercise"
import { fetchSessionBySlug, type SessionData } from "@/lib/data-detail-session"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"

function ExercisePageContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get("slug")

  const [session, setSession] = useState<SessionData | null | undefined>(undefined)
  const [isDone, setIsDone] = useState(false)
  const [key, setKey] = useState(0)

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

  if (session === undefined) {
    return (
      <div className="w-full">
        <Section className="bg-celeste flex items-center justify-center h-[80dvh]">
          <div className="flex flex-col items-center gap-2 text-foreground">
          <Spinner className="text-foreground"/>
          <p className="text-sm tracking-wide">Mempersiapkan sesi…</p>
        </div>
        </Section>
      </div>
    )
  }

  if (session === null) {
    return (
      <div className="w-full">
        <Section className="bg-celeste flex flex-col items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground">Sesi tidak ditemukan.</p>
          <a
            href="/homepage"
            className="bg-background border border-foreground px-4 py-2 rounded-lg font-medium"
          >
            Kembali ke Beranda
          </a>
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

export default function ExercisePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full">
          <Section className="bg-celeste flex items-center justify-center h-[80dvh]">
            <p className="text-sm text-muted-foreground">Memuat sesi...</p>
          </Section>
        </div>
      }
    >
      <ExercisePageContent />
    </Suspense>
  )
}