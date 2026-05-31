'use client'

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  UsersIcon,
  DatabaseIcon,
  SignOutIcon,
  HouseIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react"
import { Route } from "next"

type AdminSidebarProps = {
  activeTab?: string
  onTabChange?: (tab: "users" | "sessions") => void
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const get = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setAdminEmail(user?.email ?? null)
    }
    get()
  }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border flex flex-col bg-background">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-border">
        <p className="font-semibold text-lg tracking-tight">DMAI</p>
        <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        <SidebarLink
          href="/admin"
          icon={<UsersIcon className="w-4 h-4" />}
          label="Pengguna"
          active={pathname === "/admin" || pathname?.startsWith("/admin/users")}
        />
        <SidebarLink
          href="/admin/sessions"
          icon={<DatabaseIcon className="w-4 h-4" />}
          label="Sesi Terapi"
          active={pathname?.startsWith("/admin/sessions") ?? false}
        />

        <div className="mt-3 pt-3 border-t border-border">
          <Link
            href="/homepage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <HouseIcon className="w-4 h-4" />
            Lihat Homepage
            <ArrowSquareOutIcon className="w-3 h-3 ml-auto opacity-60" />
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground truncate px-3 mb-2">{adminEmail}</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium bg-red/20 text-foreground hover:bg-red/30 transition-colors rounded-md"
        >
          <SignOutIcon className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      href={`${href}` as Route}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors
        ${active
          ? "bg-foreground text-background rounded-md"
          : "text-foreground hover:bg-muted rounded-md"
        }`}
    >
      {icon}
      {label}
    </Link>
  )
}