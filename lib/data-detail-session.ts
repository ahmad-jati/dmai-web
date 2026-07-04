import { createClient } from '@/lib/supabase/server'

// ─── Types ─────────────────────────────────────────────────────────────────────

const MAX_ACCESS_LIMIT = 2

type SessionRow = {
  id: string
  slug: string
  session_name: string
  detail_short: string | null
  detail_full: string[] | null
  icon_url: string | null
  total_instruction: number | null
  duration: string | null
  image_cover_url: string | null
  week_number: number | 0
  sort_order: number | null
  is_locked: boolean | null
}

type SessionStepRow = {
  id: string
  session_id: string
  step_number: number
  title: string
  description: string | null
  duration_seconds: number
  step_type: string
  step_config: Record<string, unknown> | null
}

export type SessionInstruction = {
  id: string
  step: number
  title: string
  description: string
  duration_seconds: number
  step_type: string
  step_config: Record<string, unknown>
}

export type SessionAccessInfo = {
  access_count: number
  remaining_access: number
  show_reminder: boolean
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
  is_locked: boolean
  image_cover: string
  week_number: number | 0
  instructions: SessionInstruction[]
  access: SessionAccessInfo | null
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

function mapStep(step: SessionStepRow): SessionInstruction {
  return {
    id: step.id,
    step: step.step_number,
    title: step.title,
    description: step.description ?? '',
    duration_seconds: step.duration_seconds,
    step_type: step.step_type,
    step_config: step.step_config ?? {},
  }
}

function mapSession(s: SessionRow, steps: SessionStepRow[]): SessionData {
  return {
    id: s.id,
    slug: s.slug,
    session_name: s.session_name,
    detail_short: s.detail_short ?? '',
    detail_full: s.detail_full ?? [],
    icon: s.icon_url ?? '',
    total_instruction: s.total_instruction ?? 0,
    duration: s.duration ?? '',
    is_locked: s.is_locked ?? true,
    image_cover: s.image_cover_url ?? '',
    week_number: s.week_number ?? 0,
    instructions: steps
      .filter((step) => step.session_id === s.id)
      .map(mapStep),
    access: null,
  }
}

function mapAccessInfo(completedCount: number): SessionAccessInfo {
  const remaining = Math.max(0, MAX_ACCESS_LIMIT - completedCount)
  return {
    access_count: completedCount,
    remaining_access: remaining,
    show_reminder: remaining > 0,
  }
}

// ─── Fetch all sessions ──────────────────────────────────────────────────────

export async function fetchAllSessions(): Promise<SessionData[]> {
  const supabase = await createClient()

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select(`
      id, slug, session_name, detail_short, detail_full,
      icon_url, total_instruction, duration, image_cover_url,
      sort_order, week_number, is_locked
    `)
    .order('sort_order', { ascending: true })
    .returns<SessionRow[]>()

  if (sessionsError || !sessions) {
    console.error('fetchAllSessions error:', sessionsError)
    return []
  }

  const sessionIds = sessions.map((s) => s.id)

  const { data: steps, error: stepsError } = await supabase
    .from('session_steps')
    .select(`
      id, session_id, step_number, title, description,
      duration_seconds, step_type, step_config
    `)
    .in('session_id', sessionIds)
    .order('step_number', { ascending: true })
    .returns<SessionStepRow[]>()

  if (stepsError) {
    console.error('fetchAllSessions steps error:', stepsError)
    return []
  }

  return sessions.map((s) => mapSession(s, steps ?? []))
}

// ─── Fetch single session by slug ───────────────────────────────────────────
// userId opsional: kalau dikasih, sekalian dihitung access_count (completion count)
// user tersebut di sesi ini, buat kebutuhan reminder.

export async function fetchSessionBySlug(
  slug: string,
  userId?: string
): Promise<SessionData | null> {
  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id, slug, session_name, detail_short, detail_full,
      icon_url, total_instruction, duration, image_cover_url,
      week_number, sort_order, is_locked 
    `)
    .eq('slug', slug)
    .single<SessionRow>()

  if (sessionError || !session) {
    console.error('fetchSessionBySlug session error:', sessionError)
    return null
  }

  const { data: steps, error: stepsError } = await supabase
    .from('session_steps')
    .select(`
      id, session_id, step_number, title, description,
      duration_seconds, step_type, step_config
    `)
    .eq('session_id', session.id)
    .order('step_number', { ascending: true })
    .returns<SessionStepRow[]>()

  if (stepsError) {
    console.error('fetchSessionBySlug steps error:', stepsError)
    return null
  }

  const result = mapSession(session, steps ?? [])

  if (userId) {
    const { count, error: completionsError } = await supabase
      .from('session_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('session_id', session.id)
      .eq('status', 'completed')

    if (completionsError) {
      console.error('fetchSessionBySlug completions error:', completionsError)
    } else {
      result.access = mapAccessInfo(count ?? 0)
    }
  }

  return result
}