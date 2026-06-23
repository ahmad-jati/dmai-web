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

// ─── Step-config sub-shapes ─────────────────────────────────────────────────────
// These describe what can live inside `SessionStep.step_config` for each step type.
// step_config itself stays as `Record<string, unknown>` (it's a jsonb column), but
// the form components narrow/cast to these when reading/writing it.

export type FormQuestionType = 'emoji_scale' | 'slider' | 'text_input' | 'textarea'

export type FormQuestion = {
  _key: string
  label: string
  type: FormQuestionType
}

export type NarrationSubStep = {
  _key: string
  title: string
  description: string
  duration_seconds: number
  audio_file?: File
  audio_url: string
  audio_preview?: string
  image_file?: File
  image_url: string
  image_preview?: string
}

export type BodyPart = {
  id: string
  part_key: string
  label_id: string
  region: string
  sort_order: number | null
}

export type NarrationStepConfigData = {
  sub_steps?: NarrationSubStep[]
}

export type FormStepConfigData = {
  questions?: FormQuestion[]
}

export type VideoStepConfigData = {
  youtube_url?: string
  credit?: string
}

export type BodyMapStepConfigData = {
  section_label?: string
}

export type ExternalEmbedStepConfigData = {
  embed_url?: string
  embed_label?: string
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