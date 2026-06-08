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
    <section className="bg-lemon flex flex-col gap-8 items-center">
      
      <div className="flex flex-col gap-3 sm:max-w-180 lg:px-6 sm:px-20 xl:hidden">
        <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold text-center">Discover 7 mindful sessions designed to support your journey. </h2>
        <p className="font-medium sm:text-p/5 text-sm/4 text-center">Setiap sesi dirancang khusus untuk membantumu lebih dalam memahami, menerima, dan mengubah apa yang kamu rasakan.</p>
      </div>
      <div className="flex gap-4 items-start h-full w-full">
        <div className="w-76 xl:h-102 h-full xl:block hidden">
          <Image
            src={'/tropicaline/Being-okay.png'}
            alt="Being Okay (Tropicaline Illustrations)"
            width={2000}
            height={2000}
            priority
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col gap-6 ">
          <div className="xl:flex flex-col gap-3 max-w-180 hidden">
            <h2 className="text-h2/7 font-semibold">Discover 7 mindful sessions designed to support your journey. </h2>
            <p className="font-medium text-p/5">Setiap sesi dirancang khusus untuk membantumu lebih dalam memahami, menerima, dan mengubah apa yang kamu rasakan.</p>
          </div>

          <div className="grid xl:grid-cols-4 md:grid-cols-3 xs:grid-cols-2 grid-cols-1 gap-3.5 w-full">
            {loading
              ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
              : sessions.map((session) => (
                  <div
                    key={session.slug}
                    className="flex flex-col justify-between items-end gap-4 bg-background p-3 rounded-lg border border-foreground w-full"
                  >
                    <div className="flex flex-col w-full justify-start gap-1">
                      <p className="font-bold text-p/5 ">{session.session_name}</p>
                      <p className="font-medium text-sm/4">{session.detail_short}</p>
                    </div>
                    <div>
                      <Image
                        src={session.icon}
                        alt={`${session.session_name} icon`}
                        width={400}
                        height={400}
                        className="w-full h-8 object-contain"
                        unoptimized
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