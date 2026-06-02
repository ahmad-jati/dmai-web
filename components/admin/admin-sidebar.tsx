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
import { Button } from "../ui/button"

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
    <aside className="w-60 h-full border-r border-border flex flex-col bg-background ">
      {/* Brand */}
      <div className="px-6 py-5">
        <p className="font-semibold text-h1 tracking-tight">DMAI</p>
        <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2.5 px-3 py-4">

        <div className="border-t border-border"></div>
        <SidebarLink
          href="/admin"
          icon={<UsersIcon className="w-4 h-4" />}
          label="User Info"
          active={pathname === "/admin" || pathname?.startsWith("/admin/users")}
        />
        <SidebarLink
          href="/admin/sessions"
          icon={<DatabaseIcon className="w-4 h-4" />}
          label="Sesi Terapi"
          active={pathname?.startsWith("/admin/sessions") ?? false}
        />

        <div className="pt-2 border-t border-border">
          <Link
            href="/homepage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors rounded-md"
          >
            <HouseIcon className="w-4 h-4" />
            Lihat Homepage
            <ArrowSquareOutIcon className="w-3 h-3 ml-auto opacity-60" />
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 border-t border-border pt-4 flex flex-col items-center gap-3">
        <p className="text-sm text-foreground truncate w-full text-center font-medium">Hi, {adminEmail}</p>
        <Button
          variant={'ghost'}
          onClick={logout}
          className="[&_svg]:size-4 flex items-center gap-2 w-full rounded-md border-2 border-destructive/20 text-destructive hover:bg-destructive/10"
        >
          <SignOutIcon className="w-4 h-4" />
          Logout
        </Button>
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
      className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors font-semibold
        ${active
          ? "bg-white text-foreground rounded-md"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-md"
        }`}
    >
      {icon}
      {label}
    </Link>
  )
}