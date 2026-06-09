import type { Metadata } from "next"
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "User Info — DMAI Admin",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="flex bg-white">
        <div className="fixed inset-y-0 left-0 z-40 h-screen">
          <AdminSidebar />
        </div>
        <main className="flex-1 ml-60 min-h-dvh overflow-y-auto">
          {children}
        </main>
        <Toaster position="top-right" />
      </div>
    </AdminAuthGuard>
  )
}