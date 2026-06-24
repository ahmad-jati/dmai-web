import type { Metadata } from "next"
import { Section } from "@/components/layout/section-wrapper"
import { UserDashboard } from "@/components/section/user-dashboard/user-dashboard"

export const metadata: Metadata = {
  title: "Dashboard — DMAI",
  description: "Lihat progres dan riwayat lengkap sesi mindfulness-mu.",
}

export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="bg-lavender dark:bg-card flex gap-8 items-center">
        <UserDashboard />
      </Section>
    </div>
  )
}