import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "User Responses — DMAI Admin",
}

export default function UserResponsesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}