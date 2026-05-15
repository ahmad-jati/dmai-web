import Image from "next/image";
import { data_session } from "@/lib/data-detail-session";

export function TrainingOverviewOnboarding() {
  return (
    <section className="bg-lemon">
      <div className="flex gap-4 items-start">
        <div className="w-76 h-102">
          <Image
            src={'/tropicaline/Being-okay.png'}
            alt="Being Okay (Tropicaline Illustrations)"
            width={2000}
            height={2000}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col gap-3 max-w-180">
            <h2>Discover 7 mindful sessions designed to support your journey.</h2>
            <p className="font-medium">Setiap sesi dirancang khusus untuk membantumu lebih dalam memahami, menerima, dan mengubah apa yang kamu rasakan.</p>
          </div>

          <div className="grid grid-cols-4 gap-3.5">
            {
              data_session.map((session) => (
                <div
                  key={session.session_name}
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