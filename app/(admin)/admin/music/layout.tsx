import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "BGM Music — DAMAI Admin",
}

export default function AdminMusicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}