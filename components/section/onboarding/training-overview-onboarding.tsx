'use client'

import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchAllSessions, type SessionData } from "@/lib/data-detail-session.client"

function SkeletonCard() {
  return (
    <div className="flex flex-col justify-between items-end xs:gap-4 gap-2 bg-background/60 p-3 xs:rounded-lg rounded-md border border-foreground/20 xs:h-24 h-20 animate-pulse">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="xs:h-3 h-2.5 bg-foreground/10 rounded w-3/4" />
        <div className="xs:h-2.5 h-2 bg-foreground/8 rounded w-full" />
      </div>
      <div className="xs:h-6 h-5 xs:w-10 w-8 bg-foreground/8 rounded" />
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
    <div className="flex flex-col xs:gap-8 gap-4 items-center">
      
      <div className="flex flex-col gap-3 sm:max-w-180 lg:px-6 sm:px-20 xl:hidden">
        <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold text-center">Discover 7 mindful sessions designed to support your journey. </h2>
        <p className="sm:text-p/5 xs:text-sm/4 text-xs/3.5 text-center font-medium">Setiap sesi dirancang khusus untuk membantumu lebih dalam memahami, menerima, dan mengubah apa yang kamu rasakan.</p>
      </div>
      <div className="flex gap-4 items-start h-full w-full">
        <div className="w-89 xl:h-119 h-full xl:block hidden">
          <Image
            src={'/tropicaline/compress/Being-okay.png'}
            alt="Being Okay (Tropicaline Illustrations)"
            width={2000}
            height={2000}
            priority
            unoptimized
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
                    className="flex flex-col justify-between items-end xs:gap-4 gap-1 bg-background dark:bg-foreground dark:text-background text-foreground p-3 lg:rounded-lg md:rounded-lg rounded-md border border-foreground w-full group"
                  >
                    <div className="flex flex-col w-full justify-start gap-1">
                      <p className="xs:text-p/5 text-sm/4 font-bold">{session.session_name}</p>
                      <p className="font-medium xs:text-sm/4.5 text-xs/4">{session.detail_short}</p>
                    </div>
                    <div className="xs:h-8 h-6 flex justify-end">
                      <Image
                        src={session.icon}
                        alt={`${session.session_name} icon`}
                        width={400}
                        height={400}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
