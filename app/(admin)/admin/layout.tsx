'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Toaster } from "@/components/ui/sonner"
import { FullPageSpinner } from "@/components/ui/spinner"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (roleData?.role === "admin") {
        setAuthorized(true)
      } else {
        router.replace("/homepage")
      }

      setChecking(false)
    }
    check()
  }, [router])

  if (checking) {
    return <FullPageSpinner text="Memeriksa akses..." />
  }

  if (!authorized) return null

  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster />
    </div>
  )
}