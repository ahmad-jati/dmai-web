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
import { Spinner } from "@/components/ui/spinner"
import { FeedbackDialog } from "@/components/session/feeedback-dialog"

type Props = {
  params: Promise<{ slug: string }>
}

function ExerciseLoadingSkeleton() {
  return (
    <div className="w-full">
      <div className="p-6 bg-celeste border border-foreground w-full rounded-5xl">
        <div className="flex flex-col items-center w-full rounded-4xl relative h-[76dvh] overflow-hidden bg-foreground/8 animate-pulse">
          <div className="absolute inset-0 bg-foreground/5 rounded-4xl" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
            <Spinner />
            <p className="text-sm text-muted-foreground">Memuat sesi...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExercisePage({ params }: Props) {
  const { slug } = use(params)

  const [session, setSession] = useState<SessionData | null | undefined>(undefined)
  const [isDone, setIsDone] = useState(false)
  const [key, setKey] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  useEffect(() => {
    fetchSessionBySlug(slug).then((data) => setSession(data ?? null))
  }, [slug])

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setUserId(data?.user?.id ?? null)
    }
    getUser()
  }, [])

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
    // Open feedback dialog after a brief delay so the done screen renders first
    setTimeout(() => setFeedbackOpen(true), 400)
  }

  // loading
  if (session === undefined) return <ExerciseLoadingSkeleton />

  // not found
  if (session === null) notFound()

  if (isDone) {
    return (
      <>
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
                priority
                className="w-full h-full object-cover rounded-3xl bg-muted-foreground/10"
                unoptimized
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRepeat}
                className="w-full flex items-center gap-2 bg-background"
              >
                <RepeatIcon className="w-4 h-4" weight="fill" />
                Ulangi Sesi Ini
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center gap-2 bg-background"
                asChild
              >
                <Link href={"/homepage" as Route}>
                  <HouseIcon className="w-4 h-4" weight="fill" />
                  Kembali ke Beranda
                </Link>
              </Button>
            </div>

            {!feedbackOpen && (
              <button
                onClick={() => setFeedbackOpen(true)}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Bagikan perasaanmu →
              </button>
            )}
          </Section>
        </div>

        {userId && (
          <FeedbackDialog
            open={feedbackOpen}
            sessionSlug={slug}
            sessionName={session.session_name}
            userId={userId}
            onClose={() => setFeedbackOpen(false)}
            onSkip={() => setFeedbackOpen(false)}
          />
        )}
      </>
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
    </div>
  )
}