import { createClient } from '@/lib/supabase/server'

export async function fetchAllSessions() {
  const supabase = await createClient()

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select(`
      id, slug, session_name, detail_short, detail_full,
      icon_url, total_instruction, duration, image_cover_url,
      sort_order, week_number, is_locked
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

  return sessions.map((s) => ({
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
    week_number: s.week_number ?? null,
    instructions: (steps ?? [])
      .filter((step) => step.session_id === s.id)
      .map((step) => ({
        id: step.id,
        step: step.step_number,
        title: step.title,
        description: step.description ?? '',
        duration_seconds: step.duration_seconds,
        image: step.image_url ?? '',
        audio: step.audio_url ?? '',
        step_type: step.step_type,
        step_config: step.step_config ?? {},
      })),
  }))
}

export async function fetchSessionBySlug(slug: string) {
  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id, slug, session_name, detail_short, detail_full,
      icon_url, total_instruction, duration, image_cover_url,
      week_number, sort_order
    `)
    .eq('slug', slug)
    .single()

    console.log(session)

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

  return {
    id: session.id,
    slug: session.slug,
    session_name: session.session_name,
    detail_short: session.detail_short ?? '',
    detail_full: session.detail_full ?? [],
    icon: session.icon_url ?? '',
    total_instruction: session.total_instruction ?? 0,
    duration: session.duration ?? '',
    image_cover: session.image_cover_url ?? '',
    week_number: session.week_number ?? null,
    is_locked: session.is_locked ?? true,
    instructions: (steps ?? []).map((step) => ({
      id: step.id,
      step: step.step_number,
      title: step.title,
      description: step.description ?? '',
      duration_seconds: step.duration_seconds,
      image: step.image_url ?? '',
      audio: step.audio_url ?? '',
      step_type: step.step_type,
      step_config: step.step_config ?? {},
    })),
  }
}