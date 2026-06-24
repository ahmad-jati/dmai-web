import { notFound } from "next/navigation"
import Link from "next/link"
import { getCompletionDetail } from "../../action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatDuration } from "@/lib/format-duration"
import { MOOD_LABEL, MOOD_COLOR } from "@/types/user-responses"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr"
import { FileIcon, MapPinAreaIcon, ClockIcon, CalendarIcon } from "@phosphor-icons/react/dist/ssr"
import { Route } from "next"

type Props = { params: Promise<{ completionId: string }> }

export default async function CompletionDetailPage({ params }: Props) {
  const { completionId } = await params
  const { data, error } = await getCompletionDetail(completionId)

  if (error || !data) notFound()

  const { completion, feedback, form_responses, body_map_responses } = data

  // Back link: kalau dari session view atau user view kita nggak tau,
  // fallback ke list utama. Bisa dikembangkan pakai searchParams nanti.
  const backHref = `/admin/user-responses/${completion.user_id}`

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backHref as Route}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{completion.session_name}</h1>
          <p className="text-muted-foreground text-sm">
            {completion.full_name} — {completion.email}
          </p>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{completion.full_name ?? "-"}</p>
          <Badge>{completion.status}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="h-3 w-3" />
            Mulai:{" "}
            {completion.started_at
              ? format(new Date(completion.started_at), "d MMM yyyy, HH:mm:ss", { locale: id })
              : "-"}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="h-3 w-3" />
            Selesai:{" "}
            {completion.completed_at
              ? format(new Date(completion.completed_at), "d MMM yyyy, HH:mm:ss", { locale: id })
              : "-"}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon className="h-3 w-3" />
            Durasi:{" "}
            {completion.duration_seconds != null
              ? formatDuration(completion.duration_seconds)
              : "-"}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-xs pt-1">
          {feedback.pre && (
            <span>
              Mood Pre:{" "}
              <span className={cn("font-semibold", MOOD_COLOR[feedback.pre.mood])}>
                {MOOD_LABEL[feedback.pre.mood]}
              </span>
              {feedback.pre.note && (
                <span className="text-muted-foreground"> — {feedback.pre.note}</span>
              )}
            </span>
          )}
          {feedback.post && (
            <span>
              Mood Post:{" "}
              <span className={cn("font-semibold", MOOD_COLOR[feedback.post.mood])}>
                {MOOD_LABEL[feedback.post.mood]}
              </span>
              {feedback.post.note && (
                <span className="text-muted-foreground"> — {feedback.post.note}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Form Responses */}
      {form_responses && form_responses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Respons Form</h2>
          </div>
          {form_responses.map((fr, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Step {fr.step_number} — {fr.step_title}
              </p>
              <div className="space-y-1.5">
                {Object.entries(fr.responses).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-muted-foreground text-xs">{key}: </span>
                    <span className="font-medium">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Body Map Responses */}
      {body_map_responses && body_map_responses.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <div className="flex items-center gap-2">
            <MapPinAreaIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Respons Body Map</h2>
          </div>
          {body_map_responses.map((bm, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{bm.step_title}</p>
              <div className="flex flex-wrap gap-1.5">
                {bm.selected_parts.map((part) => (
                  <Badge key={part} variant="secondary" className="text-xs">
                    {part}
                  </Badge>
                ))}
              </div>
              {bm.sensation && (
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs">Sensasi: </span>
                  <span className="font-medium capitalize">{bm.sensation}</span>
                </p>
              )}
              {bm.note && (
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs">Catatan: </span>
                  {bm.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!form_responses?.length && !body_map_responses?.length && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Tidak ada respons form atau body map pada sesi ini.
        </p>
      )}
    </div>
  )
}