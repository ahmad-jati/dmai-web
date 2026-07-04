'use client'

import { usePathname } from "next/navigation"
import { UsersTable } from "@/components/admin/users-table"
import { SessionsManager } from "@/components/admin/sessions-manager"

export default function AdminPage() {
  const pathname = usePathname()
  const isSessionsTab = pathname?.startsWith("/admin/sessions")

  return (
    <div className="flex gap-6 p-10 items-start">
      <div className="flex-1 min-w-0">
        {isSessionsTab ? <SessionsManager /> : <UsersTable />}
      </div>
    </div>
  )
}