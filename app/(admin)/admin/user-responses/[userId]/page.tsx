import { notFound } from "next/navigation"
import Link from "next/link"
import { getUserSessionDetail } from "../action"
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

type Props = { params: Promise<{ userId: string }> }

export default async function UserResponseDetailPage({ params }: Props) {
  const { userId } = await params

  // Ambil nama user
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single()

  if (!profile) notFound()

  const { data: sessions, error } = await getUserSessionDetail(userId)

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
          <h1 className="text-2xl font-semibold">{profile.full_name ?? "-"}</h1>
          <p className="text-muted-foreground text-sm">{profile.email ?? "-"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Total sesi diselesaikan</p>
        <p className="text-3xl font-bold mt-1">
          {sessions.filter((s) => s.status === "completed").length}
        </p>
      </div>

      {/* Session list */}
      {error ? (
        <p className="text-destructive text-sm">Gagal memuat data: {error}</p>
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada sesi yang diselesaikan.</p>
      ) : (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Riwayat Sesi
          </h2>
          {sessions.map((item) => (
            <Link
              key={item.completion_id}
              href={`/admin/user-responses/completion/${item.completion_id}` as Route}
              className="block rounded-lg border p-4 hover:bg-muted/40 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{item.session_name}</p>
                  {item.week_number != null && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Minggu {item.week_number}
                    </Badge>
                  )}
                </div>
                <Badge
                  variant={item.status === "completed" ? "default" : "secondary"}
                  className="text-xs shrink-0"
                >
                  {item.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Mulai:{" "}
                  {item.started_at
                    ? format(new Date(item.started_at), "d MMM yyyy, HH:mm", { locale: id })
                    : "-"}
                </span>
                <span>
                  Selesai:{" "}
                  {item.completed_at
                    ? format(new Date(item.completed_at), "d MMM yyyy, HH:mm", { locale: id })
                    : "-"}
                </span>
                <span>
                  Durasi:{" "}
                  {item.duration_seconds != null ? formatDuration(item.duration_seconds) : "-"}
                </span>
                {item.pre_mood && (
                  <span>
                    Pre Mood:{" "}
                    <span className={cn("font-medium", MOOD_COLOR[item.pre_mood])}>
                      {MOOD_LABEL[item.pre_mood]}
                    </span>
                  </span>
                )}
                {item.post_mood && (
                  <span>
                    Post Mood:{" "}
                    <span className={cn("font-medium", MOOD_COLOR[item.post_mood])}>
                      {MOOD_LABEL[item.post_mood]}
                    </span>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}