'use client'

import { usePathname } from "next/navigation"
import { UsersTable } from "@/components/admin/users-table"
import { SessionsManager } from "@/components/admin/sessions-manager"
import { OnlineUsersPanel } from "@/components/admin/online-users-panel"

export default function AdminPage() {
  const pathname = usePathname()
  const isSessionsTab = pathname?.startsWith("/admin/sessions")

  return (
    <div className="flex gap-6 p-10 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {isSessionsTab ? <SessionsManager /> : <UsersTable />}
      </div>

      <div className="w-80 shrink-0 sticky top-10">
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <OnlineUsersPanel />
        </div>
      </div>
    </div>
  )
}