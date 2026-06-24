import { notFound } from "next/navigation"
import { getSessionCompletions } from "../../action"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/format-duration"
import { MOOD_LABEL, MOOD_COLOR } from "@/types/user-responses"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr"
import { Route } from "next"

type Props = { params: Promise<{ sessionId: string }> }

export default async function SessionResponseDetailPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from("sessions")
    .select("session_name, week_number")
    .eq("id", sessionId)
    .single()

    console.log(session)

  if (!session) notFound()

  const { data: completions, error: completionsError } = await getSessionCompletions(sessionId)
  if (completionsError) {
    console.error(completionsError)
  }

  console.log(completions)

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/user-responses">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{session?.session_name}</h1>
          {session?.week_number != null && ( 
            <Badge variant="outline" className="mt-1">Minggu {session?.week_number}</Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Total penyelesaian</p>
        <p className="text-3xl font-bold mt-1">{completions?.length}</p>
      </div>

      {/* Completion list */}
      {completions?.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada yang menyelesaikan sesi ini.</p>
      ) : (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Pengguna yang Menyelesaikan
          </h2>
          {completions?.map((c) => {
            const durationSeconds =
              c.started_at && c.completed_at
                ? Math.floor(
                    (new Date(c.completed_at).getTime() - new Date(c.started_at).getTime()) / 1000
                  )
                : null
            const preMood =
              (c.pre_feedback ?? []).find((f) => f.feedback_point === "pre")?.mood ?? null
            const postMood =
              (c.post_feedback ?? []).find((f) => f.feedback_point === "post")?.mood ?? null

            return (
              <Link
                key={c.completion_id}
                href={`/admin/user-responses/completion/${c.completion_id}` as Route}
                className="block rounded-lg border p-4 hover:bg-muted/40 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{c.full_name ?? "-"}</p>
                  <Badge
                    variant={c.status === "completed" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {c.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.email ?? "-"}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                  <span>
                    {c.completed_at
                      ? format(new Date(c.completed_at), "d MMM yyyy, HH:mm", { locale: id })
                      : "-"}
                  </span>
                  <span>Durasi: {durationSeconds != null ? formatDuration(durationSeconds) : "-"}</span>
                  {preMood && (
                    <span>
                      Pre:{" "}
                      <span className={cn("font-medium", MOOD_COLOR[preMood])}>
                        {MOOD_LABEL[preMood]}
                      </span>
                    </span>
                  )}
                  {postMood && (
                    <span>
                      Post:{" "}
                      <span className={cn("font-medium", MOOD_COLOR[postMood])}>
                        {MOOD_LABEL[postMood]}
                      </span>
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}