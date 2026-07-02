import type { Metadata } from "next"
import { Section } from "@/components/layout/section-wrapper"
import { UserHistory } from "@/components/section/user-history/user-history"

export const metadata: Metadata = {
  title: "History — DMAI",
  description: "Lihat progres dan riwayat lengkap sesi mindfulness-mu.",
}

export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="bg-lavender dark:bg-card flex gap-8 items-center">
        <UserHistory />
      </Section>
    </div>
  )
}