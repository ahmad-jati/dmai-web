'use client'

import { useState, useEffect, useMemo, use, Suspense } from "react"
import { useRouter, notFound } from "next/navigation"
import { Route } from "next"
import { ResultScreen } from "@/components/result-screen"
import { SessionLoadingCard } from "@/components/session-loading-card"
import { fetchSessionBySlug, type SessionData } from "@/lib/data-detail-session.client"
import { createClient } from "@/lib/supabase/client"

type Props = {
  params: Promise<{ slug: string }>
}

type CompletionRow = {
  id: string
  started_at: string | null
  completed_at: string | null
}

type SessionDoneData = {
  session: SessionData | null
  completion: CompletionRow | null
  allResponses: Record<string, Record<string, unknown>>
  userId: string | null
}

async function loadSessionDone(slug: string): Promise<SessionDoneData> {
  const supabase = createClient()

  const [session, { data: userData }] = await Promise.all([
    fetchSessionBySlug(slug),
    supabase.auth.getUser(),
  ])

  const user = userData?.user
  const userId = user?.id ?? null

  if (!user) {
    return { session: session ?? null, completion: null, allResponses: {}, userId: null }
  }

  const { data: completionRow, error: completionError } = await supabase
    .from('session_completions')
    .select('id, started_at, completed_at')
    .eq('user_id', user.id)
    .eq('session_slug', slug)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (completionError || !completionRow) {
    console.error('completion fetch error:', completionError)
    return { session: session ?? null, completion: null, allResponses: {}, userId }
  }

  const [{ data: formRows, error: formError }, { data: bodyMapRows, error: bodyMapError }] = await Promise.all([
    supabase
      .from('session_form_responses')
      .select('step_id, responses')
      .eq('completion_id', completionRow.id),
    supabase
      .from('session_body_map_responses')
      .select('step_id, selected_parts, sensation, note')
      .eq('completion_id', completionRow.id),
  ])

  if (formError) console.error('form responses fetch error:', formError)
  if (bodyMapError) console.error('body map responses fetch error:', bodyMapError)

  const allResponses: Record<string, Record<string, unknown>> = {}
  for (const row of formRows ?? []) {
    allResponses[row.step_id] = row.responses as Record<string, unknown>
  }
  for (const row of bodyMapRows ?? []) {
    allResponses[row.step_id] = {
      selected_parts: row.selected_parts,
      sensation: row.sensation,
      note: row.note,
    }
  }

  return { session: session ?? null, completion: completionRow, allResponses, userId }
}

export default function SessionDonePage({ params }: Props) {
  const { slug } = use(params)

  return (
    <Suspense fallback={<SessionLoadingCard label="Memuat hasil…" />}>
      <SessionDoneContent slug={slug} />
    </Suspense>
  )
}

function SessionDoneContent({ slug }: { slug: string }) {
  const router = useRouter()

  // stabil selama slug sama, biar `use()` gak trigger promise baru tiap render
  const dataPromise = useMemo(() => loadSessionDone(slug), [slug])
  const { session, completion, allResponses, userId } = use(dataPromise)

  const [feedbackOpen, setFeedbackOpen] = useState(false)

  useEffect(() => {
    if (completion) {
      const t = setTimeout(() => setFeedbackOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [completion])

  const handleRepeat = () => {
    router.push(`/session/${slug}/exercise` as Route)
  }

  if (session === null || completion === null) notFound()

  return (
    <div className="w-full">
      <ResultScreen
        session={session}
        startedAt={completion.started_at}
        completedAt={completion.completed_at}
        allResponses={allResponses}
        onRepeat={handleRepeat}
        feedbackOpen={feedbackOpen}
        setFeedbackOpen={setFeedbackOpen}
        userId={userId}
        slug={slug}
      />
    </div>
  )
}