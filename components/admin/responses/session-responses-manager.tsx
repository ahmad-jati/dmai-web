'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import type { SessionSummary } from "@/lib/session-helper"

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground italic border border-dashed border-border rounded-xl">
      {text}
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-6 bg-muted rounded w-52" />
        <div className="h-3.5 bg-muted/60 rounded w-72" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[52px] bg-muted/50 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SessionResponsesManager() {
  const router = useRouter()

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("id, session_name, week_number, sort_order")
        .order("sort_order", { ascending: true })

      const { data: completionsData } = await supabase
        .from("session_completions")
        .select("session_id")

      const completionCountMap = new Map<string, number>()
      for (const c of completionsData ?? []) {
        completionCountMap.set(c.session_id, (completionCountMap.get(c.session_id) ?? 0) + 1)
      }

      const sessionList: SessionSummary[] = (sessionsData ?? []).map((s) => ({
        id: s.id,
        session_name: s.session_name,
        week_number: s.week_number,
        total_completed: completionCountMap.get(s.id) ?? 0,
      }))

      setSessions(sessionList)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <PageSkeleton />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Respons Sesi</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{sessions.length} sesi tersedia</p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState text="Belum ada sesi" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-5">#</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[60%]">Sesi</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[20%]">Week</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[20%]">Penyelesaian</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr
                  key={s.id}
                  onClick={() => router.push(`/admin/session-responses/${s.id}`)}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm truncate text-foreground/80">{i + 1}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm truncate leading-tight">{s.session_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {s.week_number != null ? `Week ${s.week_number}` : "Tanpa minggu"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{s.total_completed}</span> selesai
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ArrowSquareOutIcon className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground inline transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}