import { createClient } from '@/lib/supabase/client'
import type { StepType } from '@/components/admin/sessions/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SessionInstruction = {
  id: string
  step: number
  title: string
  description: string
  duration_seconds: number
  image: string
  audio: string
  step_type: StepType
  step_config: Record<string, unknown>
}

export type SessionData = {
  id: string
  slug: string
  session_name: string
  detail_short: string
  detail_full: string[]
  icon: string
  total_instruction: number
  duration: string
  image_cover: string
  week_number: number | null
  is_locked: boolean
  instructions: SessionInstruction[]
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

function mapStep(step: any): SessionInstruction {
  return {
    id: step.id,
    step: step.step_number,
    title: step.title,
    description: step.description ?? '',
    duration_seconds: step.duration_seconds,
    image: step.image_url ?? '',
    audio: step.audio_url ?? '',
    step_type: step.step_type ?? 'narration',
    step_config: step.step_config ?? {},
  }
}

function mapSession(s: any, steps: any[]): SessionData {
  return {
    id: s.id,
    slug: s.slug,
    session_name: s.session_name,
    detail_short: s.detail_short ?? '',
    detail_full: s.detail_full ?? [],
    icon: s.icon_url ?? '',
    total_instruction: s.total_instruction ?? 0,
    duration: s.duration ?? '',
    image_cover: s.image_cover_url ?? '',
    week_number: s.week_number ?? null,
    is_locked: s.is_locked ?? true,
    instructions: steps
      .filter((step) => step.session_id === s.id)
      .sort((a, b) => a.step_number - b.step_number)
      .map(mapStep),
  }
}

// ─── Fetch all sessions (homepage, session list) ────────────────────────────────

export async function fetchAllSessions(): Promise<SessionData[]> {
  const supabase = createClient()

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select(`
      id, slug, session_name, detail_short, detail_full,
      icon_url, total_instruction, duration, image_cover_url,
      week_number, sort_order, is_locked
    `)
    .order('sort_order', { ascending: true })

  if (sessionsError || !sessions) {
    console.error('fetchAllSessions error:', sessionsError)
    return []
  }

  const sessionIds = sessions.map((s) => s.id)

  const { data: steps, error: stepsError } = await supabase
    .from('session_steps')
    .select(`
      id, session_id, step_number, title, description,
      duration_seconds, image_url, audio_url, step_type, step_config
    `)
    .in('session_id', sessionIds)
    .order('step_number', { ascending: true })

  if (stepsError) {
    console.error('fetchAllSessions steps error:', stepsError)
    return []
  }

  return sessions.map((s) => mapSession(s, steps ?? []))
}

// ─── Fetch single session by slug (exercise page) ──────────────────────────────

export async function fetchSessionBySlug(slug: string): Promise<SessionData | null> {
  const supabase = createClient()

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id, slug, session_name, detail_short, detail_full,
      icon_url, total_instruction, duration, image_cover_url,
      week_number, sort_order, is_locked
    `)
    .eq('slug', slug)
    .single()

  if (sessionError || !session) {
    console.error('fetchSessionBySlug session error:', sessionError)
    return null
  }

  const { data: steps, error: stepsError } = await supabase
    .from('session_steps')
    .select(`
      id, session_id, step_number, title, description,
      duration_seconds, image_url, audio_url, step_type, step_config
    `)
    .eq('session_id', session.id)
    .order('step_number', { ascending: true })

  if (stepsError) {
    console.error('fetchSessionBySlug steps error:', stepsError)
    return null
  }

  return mapSession(session, (steps ?? []).map((s) => ({ ...s, session_id: session.id })))
}