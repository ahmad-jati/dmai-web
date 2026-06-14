import { createClient } from '@/lib/supabase/client'

// Re-export the type so client components can import it from here
export type SessionData = Awaited<ReturnType<typeof fetchAllSessions>>[number]

const SELECT = `
  id, slug, session_name, detail_short, detail_full,
  icon_url, total_instruction, duration, image_cover_url,
  session_steps (
    step_number, title, description, duration_seconds, image_url, audio_url
  )
`

function mapSession(s: any) {
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
    instructions: [...(s.session_steps ?? [])]
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((step: any) => ({
        step: step.step_number,
        title: step.title,
        description: step.description ?? '',
        duration_seconds: step.duration_seconds,
        image: step.image_url ?? '',
        audio: step.audio_url ?? '',
      })),
  }
}

export async function fetchAllSessions() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select(SELECT)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data.map(mapSession)
}

export async function fetchSessionBySlug(slug: string) {
  const supabase = await createClient()
  const { data: s, error } = await supabase
    .from('sessions')
    .select(`
      id, slug, session_name, detail_short, detail_full,
      icon_url, total_instruction, duration, image_cover_url,
      session_steps (
        step_number, title, description, duration_seconds, image_url, audio_url
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !s) return null

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
    instructions: [...(s.session_steps ?? [])]
      .sort((a, b) => a.step_number - b.step_number)
      .map((step) => ({
        step: step.step_number,
        title: step.title,
        description: step.description ?? '',
        duration_seconds: step.duration_seconds,
        image: step.image_url ?? '',
        audio: step.audio_url ?? '',
      })),
  }
}