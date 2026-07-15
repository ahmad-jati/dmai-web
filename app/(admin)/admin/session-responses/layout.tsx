import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Session Responses — DAMAI Admin",
}

export default function UserResponsesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}