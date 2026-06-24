"use server"

import { createClient } from "@/lib/supabase/server";
import type {
  UserResponseSummary,
  SessionResponseSummary,
  UserSessionDetail,
  CompletionDetail,
  CompletionRow,
} from "@/types/user-responses"

export async function getUserResponsesSummary(
  page: number = 0,
  search: string = ""
): Promise<{ data: UserResponseSummary[]; error: string | null }> {
  const supabase = await createClient()
  const limit = 20
  const offset = page * limit

  const { data, error } = await supabase.rpc("get_user_responses_summary", {
    p_limit: limit,
    p_offset: offset,
    p_search: search || null,
  })

  if (error) return { data: [], error: error.message }
  return { data: data as UserResponseSummary[], error: null }
}

export async function getSessionResponsesSummary(
  page: number = 0,
  search: string = ""
): Promise<{ data: SessionResponseSummary[]; error: string | null }> {
  const supabase = await createClient()
  const limit = 20
  const offset = page * limit

  const { data, error } = await supabase.rpc("get_session_responses_summary", {
    p_limit: limit,
    p_offset: offset,
    p_search: search || null,
  })

  if (error) return { data: [], error: error.message }
  return { data: data as SessionResponseSummary[], error: null }
}

export async function getUserSessionDetail(
  userId: string
): Promise<{ data: UserSessionDetail[]; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_user_session_detail", {
    p_user_id: userId,
  })

  if (error) return { data: [], error: error.message }
  return { data: data as UserSessionDetail[], error: null }
}

export async function getCompletionDetail(
  completionId: string
): Promise<{ data: CompletionDetail | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_completion_detail", {
    p_completion_id: completionId,
  })

  if (error) return { data: null, error: error.message }
  return { data: data as CompletionDetail, error: null }
}

export async function getSessionCompletions(
  sessionId: string
): Promise<{ data: CompletionRow[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_session_completions", {
    p_session_id: sessionId,
  })

  if (error) return { data: null, error: error.message }
  return { data: data as CompletionRow[], error: null }
}