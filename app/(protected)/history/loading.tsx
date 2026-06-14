import { Section } from "@/components/layout/section-wrapper"

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="bg-lavender flex gap-8 items-center md:min-h-[calc(60dvh-52px)]">
        <div className="flex lg:gap-6 gap-3 items-start w-full lg:items-center">
          <div className="rounded-3xl lg:w-120 lg:h-120 w-24 h-24 bg-foreground/8 animate-pulse lg:block hidden" />
          <div className="flex flex-col lg:gap-6 gap-4 w-full lg:h-120 h-full overflow-hidden">
            <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold">Riwayat Sesi</h2>
            {Array.from({ length: 3 }).map((_, gi) => (
              <div key={gi} className="flex flex-col gap-3 animate-pulse">
                <div className="xs:h-4 h-3 bg-foreground/10 rounded w-24" />
                <div className="grid 2xs:grid-cols-2 grid-cols-1 xs:gap-6 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="xs:h-14 h-12 bg-background rounded-xl border border-foreground/10" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}