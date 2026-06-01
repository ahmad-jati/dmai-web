'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type CompletionRecord = {
  id: string
  session_slug: string
  session_name: string
  completed_at: string
}

type GroupedHistory = {
  dateLabel: string
  items: CompletionRecord[]
}

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function groupByDate(records: CompletionRecord[]): GroupedHistory[] {
  const map = new Map<string, CompletionRecord[]>()
  for (const record of records) {
    const label = formatDateLabel(record.completed_at)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(record)
  }
  return Array.from(map.entries()).map(([dateLabel, items]) => ({ dateLabel, items }))
}

function HistorySkeletonContent() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {Array.from({ length: 2 }).map((_, gi) => (
        <div key={gi} className="flex flex-col gap-4">
          <div className="h-3.5 bg-foreground/10 rounded w-48" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-background rounded-2xl border border-foreground/15" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function HistoryList() {
  const [grouped, setGrouped] = useState<GroupedHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("session_completions")
        .select("id, session_slug, session_name, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })

      setGrouped(groupByDate((data as CompletionRecord[]) ?? []))
      setLoading(false)
    }

    fetchHistory()
  }, [])

  return (
    <div className="flex items-center gap-6">
      <div className="w-76 h-120">
        <Image
          src={'/tropicaline/Being-Still.png'}
          alt="Being Okay (Tropicaline Illustrations)"
          width={2000}
          height={2000}
          priority
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex-1 flex flex-col gap-3.5 items-start">
        <h1 className="text-h1">Session History</h1>

        <div className="h-108 pr-2 pb-2 overflow-y-auto w-full">
          {loading ? (
            <HistorySkeletonContent />
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Kamu belum menyelesaikan sesi apapun.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {grouped.map((group) => (
                <div key={group.dateLabel} className="flex flex-col gap-4">
                  <p className="text-md font-medium text-muted-foreground">
                    {group.dateLabel}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="w-full flex items-start gap-4 p-3 rounded-2xl bg-background text-foreground border border-foreground"
                      >
                        <div className="flex-1 flex flex-col gap-2">
                          <p className="text-lg font-semibold">{item.session_name}</p>
                          <p className="text-sm font-medium">
                            Selesai pukul {formatTime(item.completed_at)}
                          </p>
                          <Button
                            className="bg-white w-fit px-6 py-2 font-medium rounded-full"
                            size="sm"
                            asChild
                          >
                            <Link href={`/session/${item.session_slug}`}>
                              Lihat sesi
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}