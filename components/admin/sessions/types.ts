// ─── Step & Session Types ──────────────────────────────────────────────────────

export type StepType =
  | 'form'
  | 'video'
  | 'narration'
  | 'body_map'
  | 'external_embed'
  | 'game'

export type SessionStep = {
  id: string
  session_id?: string
  step_number: number
  title: string
  description: string
  duration_seconds: number
  image_url: string
  audio_url: string
  step_type: StepType
  step_config: Record<string, unknown>
}

export type SessionRecord = {
  id: string
  slug: string
  session_name: string
  detail_short: string
  detail_full: string[]
  image_cover_url: string
  total_instruction: number | null
  duration: string | null
  sort_order: number | null
  week_number: number | null
  is_locked: boolean
  steps: SessionStep[]
}

export type SessionRaw = {
  id: string
  slug: string
  session_name: string
  detail_short: string
  detail_full: string[]
  image_cover_url: string
  total_instruction: number | null
  duration: string | null
  sort_order: number | null
  week_number: number | null
  is_locked: boolean
  session_steps: SessionStep[]
}

export type SessionMeta = {
  session_name: string
  slug: string
  detail_short: string
  detail_full: [string, string]
  image_cover_url: string
  week_number: string
  duration: string
  total_instruction: string
}

export const STEP_TYPE_LABELS: Record<StepType, string> = {
  narration: 'Narasi / Panduan Suara',
  form: 'Form Input',
  video: 'Video Edukasi',
  body_map: 'Body Map',
  external_embed: 'External Embed',
  game: 'Game Interaktif',
}

export const STEP_TYPE_COLORS: Record<StepType, string> = {
  narration: 'bg-blue-50 text-blue-700 border-blue-200',
  form: 'bg-amber-50 text-amber-700 border-amber-200',
  video: 'bg-purple-50 text-purple-700 border-purple-200',
  body_map: 'bg-green-50 text-green-700 border-green-200',
  external_embed: 'bg-orange-50 text-orange-700 border-orange-200',
  game: 'bg-pink-50 text-pink-700 border-pink-200',
}
