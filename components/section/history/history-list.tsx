'use client'

import Image from "next/image";
import { data_session } from "@/lib/data-detail-session";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HistoryList(){
  return (
    <div className="flex items-center gap-6">
      <div className="w-76 h-132">
        <Image
          src={'/tropicaline/Being-Still.png'}
          alt="Being Okay (Tropicaline Illustrations)"
          width={2000}
          height={2000}
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>
      <div className="flex-1 flex flex-col gap-3.5 items-start">
        <h1 className="text-h1">Session History</h1>
        <div className=" h-108 pr-2 pb-2 overflow-y-auto">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="text-md font-medium text-muted-foreground"> Minggu, 17 Mei 2026</p>
              <div className="grid grid-cols-3 gap-2">
                {data_session.slice(0, 20).map((session) => (
                  <div
                    key={session.session_name}
                    className="w-full flex items-start gap-4 p-3 rounded-2xl bg-background text-foreground border border-foreground"
                  >
                    <Image
                      src={session.icon}
                      alt={`${session.session_name} icon`}
                      width={400}
                      height={400}
                      className="w-6 h-6 object-contain"
                    />

                    <div className="flex-1 flex flex-col gap-2">
                      <p className="text-lg font-semibold">{session.session_name}</p>
                      <p className="text-sm font-medium">Terakhir diakses 24:40 WITA</p>

                      <Button className="bg-white w-fit px-6 py-2 font-medium rounded-full" size={'sm'} asChild>
                        <Link href={`/session/motivation`}>Lihat sesi</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-md font-medium text-muted-foreground"> Minggu, 17 Mei 2026</p>
              <div className="grid grid-cols-3 gap-2">
                {data_session.slice(0, 20).map((session) => (
                  <div
                    key={session.session_name}
                    className="w-full flex items-start gap-4 p-3 rounded-2xl bg-background text-foreground border border-foreground"
                  >
                    <Image
                      src={session.icon}
                      alt={`${session.session_name} icon`}
                      width={400}
                      height={400}
                      className="w-6 h-6 object-contain"
                    />

                    <div className="flex-1 flex flex-col gap-2">
                      <p className="text-lg font-semibold">{session.session_name}</p>
                      <p className="text-sm font-medium">Terakhir diakses 24:40 WITA</p>

                      <Button className="bg-white w-fit px-6 py-2  font-medium rounded-full" size={'sm'} asChild>
                        <Link href={`/session/motivation`}>Lihat sesi</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}