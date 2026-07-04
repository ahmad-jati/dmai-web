import { createClient } from "@/lib/supabase/server"

export async function fetchCompletionCount(slug: string): Promise<number | null> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) return null

  const { count } = await supabase
    .from("session_completions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("session_slug", slug)

  return count ?? 0
}