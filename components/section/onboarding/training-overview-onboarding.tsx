'use client'

import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchAllSessions, type SessionData } from "@/lib/data-detail-session";

function SkeletonCard() {
  return (
    <div className="flex flex-col justify-between items-end gap-4 bg-background/60 p-3 rounded-lg border border-foreground/20 h-24 animate-pulse">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="h-3 bg-foreground/10 rounded w-3/4" />
        <div className="h-2.5 bg-foreground/8 rounded w-full" />
      </div>
      <div className="h-6 w-10 bg-foreground/8 rounded" />
    </div>
  )
}

export function TrainingOverviewOnboarding() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllSessions().then((data) => {
      setSessions(data)
      setLoading(false)
    })
  }, [])

  return (
    <section className="bg-lemon">
      <div className="flex gap-4 items-start">
        <div className="w-76 h-102">
          <Image
            src={'/tropicaline/Being-okay.png'}
            alt="Being Okay (Tropicaline Illustrations)"
            width={2000}
            height={2000}
            priority
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col gap-3 max-w-180">
            <h2>Discover 7 mindful sessions designed to support your journey.</h2>
            <p className="font-medium">Setiap sesi dirancang khusus untuk membantumu lebih dalam memahami, menerima, dan mengubah apa yang kamu rasakan.</p>
          </div>

          <div className="grid grid-cols-4 gap-3.5">
            {loading
              ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
              : sessions.map((session) => (
                  <div
                    key={session.slug}
                    className="flex flex-col justify-between items-end gap-4 bg-background p-3 rounded-lg border border-foreground"
                  >
                    <div className="flex flex-col gap-1 text-sm">
                      <p className="font-bold">{session.session_name}</p>
                      <p className="font-medium">{session.detail_short}</p>
                    </div>
                    <div>
                      <Image
                        src={session.icon}
                        alt={`${session.session_name} icon`}
                        width={400}
                        height={400}
                        className="w-full h-8 object-contain"
                      />
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </section>
  )
}