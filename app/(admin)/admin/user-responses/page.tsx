import { Suspense } from "react"
import { UserResponsesClient } from "./_components/user-responses-client"

export const metadata = { title: "User Responses | DMAI Admin" }

export default function UserResponsesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Responses</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Data respons pengguna dari setiap sesi yang telah diselesaikan
        </p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Memuat data...</div>}>
        <UserResponsesClient />
      </Suspense>
    </div>
  )
}