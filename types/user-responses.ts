export type UserResponseSummary = {
  user_id: string
  full_name: string | null
  email: string | null
  total_sessions_completed: number
  last_completed_at: string | null
}

export type SessionResponseSummary = {
  session_id: string
  session_name: string
  session_slug: string
  week_number: number | null
  total_completions: number
  last_completed_at: string | null
}

export type UserSessionDetail = {
  completion_id: string
  session_name: string
  session_slug: string
  week_number: number | null
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  status: string
  pre_mood: string | null
  post_mood: string | null
}

export type CompletionDetail = {
  completion: {
    id: string
    user_id: string
    full_name: string | null
    email: string | null
    session_name: string
    session_slug: string
    started_at: string | null
    completed_at: string | null
    duration_seconds: number | null
    status: string
  }
  feedback: {
    pre: { mood: string; note: string | null } | null
    post: { mood: string; note: string | null } | null
  }
  form_responses: Array<{
    step_number: number
    step_title: string
    responses: Record<string, unknown>
  }> | null
  body_map_responses: Array<{
    step_title: string
    selected_parts: string[]
    sensation: string | null
    note: string | null
    created_at: string
  }> | null
}

type FeedbackRow = { mood: string; feedback_point: string }

export type CompletionRow = {
  completion_id: string
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  status: string
  full_name: string | null
  email: string | null
  pre_feedback: FeedbackRow[] | null
  post_feedback: FeedbackRow[] | null
}

export type SessionCompletionRow = {
  completion_id: string
  full_name: string | null
  email: string | null
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  status: string
  pre_mood: string | null
  post_mood: string | null
}

export const MOOD_LABEL: Record<string, string> = {
  sangat_baik: "Sangat Baik",
  baik: "Baik",
  netral: "Netral",
  kurang_baik: "Kurang Baik",
  buruk: "Buruk",
}

export const MOOD_COLOR: Record<string, string> = {
  sangat_baik: "text-green-600",
  baik: "text-emerald-500",
  netral: "text-yellow-500",
  kurang_baik: "text-orange-500",
  buruk: "text-red-500",
}