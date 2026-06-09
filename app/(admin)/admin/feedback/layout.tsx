import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Feedback — DMAI Admin",
}

export default function AdminFeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}