// lib/data-detail-session.ts
import { createClient } from '@/lib/supabase/client'

export type SessionInstruction = {
  step: number
  title: string
  description: string
  duration_seconds: number
  image: string
  audio: string
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
  instructions: SessionInstruction[]
  image_cover: string
}

export async function fetchAllSessions(): Promise<SessionData[]> {
  const supabase = createClient()
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id, slug, session_name, detail_short, detail_full,
      icon_url, total_instruction, duration, image_cover_url,
      session_steps (
        step_number, title, description, duration_seconds, image_url, audio_url
      )
    `)
    .order('created_at')

  if (error || !sessions) return []

  return sessions.map((s) => ({
    id: s.id,
    slug: s.slug,
    session_name: s.session_name,
    detail_short: s.detail_short ?? '',
    detail_full: s.detail_full ?? [],
    icon: s.icon_url ?? '',
    total_instruction: s.total_instruction ?? 0,
    duration: s.duration ?? '',
    image_cover: s.image_cover_url ?? '',
    instructions: (s.session_steps as any[])
      .sort((a, b) => a.step_number - b.step_number)
      .map((step) => ({
        step: step.step_number,
        title: step.title,
        description: step.description ?? '',
        duration_seconds: step.duration_seconds,
        image: step.image_url ?? '',
        audio: step.audio_url ?? '',
      })),
  }))
}

export async function fetchSessionBySlug(slug: string): Promise<SessionData | null> {
  const supabase = createClient()
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
    instructions: (s.session_steps as any[])
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