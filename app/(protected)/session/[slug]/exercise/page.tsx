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
      <div className="fixed inset-0 z-50 flex items-stretch justify-stretch lg:px-28 2md:px-12 lg:py-14 py-8 px-8 bg-celeste">
        <div className="flex-1 md:rounded-4xl rounded-xl overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Spinner />
            <p className="text-sm text-muted-foreground">Mempersiapkan sesi...</p>
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
          <Section className="min-h-[calc(82svh-64px)] md:min-h-[calc(82dvh-52px)] bg-celeste flex flex-col items-center justify-center sm:gap-8 gap-6 sm:px-0 2xs:px-10 px-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="xs:text-p/5 text-sm/4 font-medium">Kamu telah menyelesaikan sesi</p>
              <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold">{session.session_name}</h2>
            </div>

            <div className="2xs:rounded-3xl rounded-xl border border-foreground bg-background p-2 sm:w-100 xs:h-68 w-full h-40">
              <Image
                src={session.image_cover}
                alt={''}
                width={2000}
                height={2000}
                priority
                className="w-full h-full object-cover 2xs:rounded-xl rounded-md bg-muted-foreground/10"
                unoptimized
              />
            </div>

            <div className="flex xs:flex-row flex-col items-center xs:gap-3 gap-1">
              <Button
                onClick={handleRepeat}
                variant={'link'}
                className="w-full flex items-center gap-2 sm:[&_svg]:size-4 [&_svg]:size-3.5"
              >
                <RepeatIcon className="w-4 h-4" weight="fill" />
                Ulangi Sesi Ini
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center gap-2 bg-background sm:[&_svg]:size-4 [&_svg]:size-3.5"
                asChild
              >
                <Link href={"/homepage" as Route}>
                  <HouseIcon className="w-4 h-4" weight="fill" />
                  Kembali ke Homepage
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
        sessionSlug={session.slug}
        onDone={handleDone}
      />
    </div>
  )
}