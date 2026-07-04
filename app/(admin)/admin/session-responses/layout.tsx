import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Session Responses — DMAI Admin",
}

export default function UserResponsesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}