import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sessions Manager — DAMAI Admin",
}

export default function AdminSessionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}