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
  MusicNotesIcon,
  ClipboardTextIcon,
  WifiHighIcon,
  UserSwitchIcon,
  CaretDownIcon,
} from "@phosphor-icons/react"
import { Route } from "next"
import { Button } from "../ui/button"

function getInitials(fullName: string | null, email: string) {
  const source = (fullName ?? "").trim() || email
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

type SessionLite = { id: string; session_name: string; week_number: number | null }

export function AdminSidebar() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [adminName, setAdminName] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionLite[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  const onSessionRoute = pathname?.startsWith("/admin/user-responses/session") ?? false
  const [sessionsOpen, setSessionsOpen] = useState(onSessionRoute)

  useEffect(() => {
    if (onSessionRoute) setSessionsOpen(true)
  }, [onSessionRoute])

  useEffect(() => {
    const get = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      setAdminName(user?.user_metadata?.full_name ?? null)
      setAdminEmail(user?.email ?? null)

      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("id, session_name, week_number")
        .order("sort_order", { ascending: true })
      setSessions(sessionsData ?? [])

      setIsLoading(false)
    }
    get()
  }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <aside className="w-60 h-full border-r border-border flex flex-col bg-background">
      {/* Brand */}
      <div className="px-6 py-5">
        <p className="font-semibold text-h1 tracking-tight">DMAI</p>
        <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col px-3 py-4 gap-6 overflow-y-auto">

        <SidebarGroup label="Pengguna">
          <SidebarLink
            href="/admin"
            icon={<UsersIcon className="w-4 h-4" />}
            label="User Info"
            active={pathname === "/admin" || (pathname?.startsWith("/admin/users") ?? false)}
          />
          <SidebarLink
            href="/admin/online"
            icon={<WifiHighIcon className="w-4 h-4" />}
            label="Aktivitas Online"
            active={pathname?.startsWith("/admin/online") ?? false}
          />
        </SidebarGroup>

        <SidebarGroup label="Sesi">
          <SidebarLink
            href="/admin/sessions"
            icon={<DatabaseIcon className="w-4 h-4" />}
            label="Sesi Terapi"
            active={pathname?.startsWith("/admin/sessions") ?? false}
          />
          <SidebarLink
            href="/admin/music"
            icon={<MusicNotesIcon className="w-4 h-4" />}
            label="Musik Latar"
            active={pathname?.startsWith("/admin/music") ?? false}
          />
        </SidebarGroup>

        <SidebarGroup label="Respons Sesi">
          <SidebarLink
            href="/admin/session-responses"
            icon={<ClipboardTextIcon className="w-4 h-4" />}
            label="Aktivitas Sesi"
            active={pathname?.startsWith("/admin/session-responses") ?? false}
          />

          <SidebarLink
            href="/admin/user-responses"
            icon={<UserSwitchIcon className="w-4 h-4" />}
            label="Riwayat User"
            active={pathname?.startsWith("/admin/user-responses") ?? false}
          />
        </SidebarGroup>

      </nav>

      {/* Footer */}
      <div className="p-3 pb-5 border-t border-border flex flex-col gap-3">
        <div className="">
          <Link
            href="/beranda"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors rounded-md"
          >
            <HouseIcon className="w-4 h-4" />
            Lihat Beranda
            <ArrowSquareOutIcon className="w-3 h-3 ml-auto opacity-60" />
          </Link>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-32 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-2 min-w-0 bg-muted/30 rounded-lg">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-foreground/90 text-background">
              {getInitials(adminName, adminEmail ?? "")}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm/4.5 text-foreground font-semibold truncate">
                {adminName ?? "Tanpa nama"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {adminEmail}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
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

function SidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
        {label}
      </p>
      {children}
    </div>
  )
}

function SidebarLink({ href, icon, label, active }: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href as Route}
      className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors font-semibold rounded-sm
        ${active
          ? "bg-foreground/90 text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        }`}
    >
      {icon}
      {label}
    </Link>
  )
}