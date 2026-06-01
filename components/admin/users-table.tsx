'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { toast } from "sonner"
import {
  MagicWandIcon,
  SpinnerIcon,
  UsersIcon,
  ShieldIcon,
} from "@phosphor-icons/react"

// ─── Types ─────────────────────────────────────────────────────────────────

type UserRecord = {
  id: string
  email: string
  full_name: string | null
  created_at: string
  role: "admin" | "user"
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const PAGE_SIZE = 10

// ─── Skeleton ───────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Section header skeleton */}
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-4 h-4 bg-muted rounded" />
        <div className="h-3.5 bg-muted rounded w-20" />
        <div className="h-3.5 bg-muted/60 rounded w-8" />
      </div>

      {/* Table skeleton */}
      <div className="border border-border">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/40 border-b border-border animate-pulse">
          <div className="w-8 h-3 bg-muted rounded" />
          <div className="flex-1 h-3 bg-muted rounded w-20" />
          <div className="flex-1 h-3 bg-muted rounded w-28" />
          <div className="w-24 h-3 bg-muted rounded" />
          <div className="w-28 h-3 bg-muted rounded" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="w-8 h-3 bg-muted/60 rounded" />
            <div className="flex-1 h-3 bg-muted rounded" style={{ width: `${55 + Math.random() * 30}%` }} />
            <div className="flex-1 h-3 bg-muted/70 rounded" style={{ width: `${60 + Math.random() * 25}%` }} />
            <div className="w-20 h-3 bg-muted/60 rounded" />
            <div className="w-28 h-7 bg-muted/40 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminPageSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {/* Page title */}
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-6 bg-muted rounded w-48" />
        <div className="h-3.5 bg-muted/60 rounded w-64" />
      </div>
      <TableSkeleton rows={2} />
      <TableSkeleton rows={6} />
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function UserTableSection({
  title,
  icon,
  users,
  page,
  totalPages,
  onPageChange,
  sending,
  onResetPassword,
}: {
  title: string
  icon: React.ReactNode
  users: UserRecord[]
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  sending: string | null
  onResetPassword: (email: string, id: string) => void
}) {
  const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-sm">{title}</h3>
        <span className="text-sm text-muted-foreground ml-1">({users.length})</span>
      </div>

      {/* Table */}
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="w-60">Nama</TableHead>
              <TableHead className="w-60">Email</TableHead>
              <TableHead className="w-30">Terdaftar</TableHead>
              <TableHead className="text-center w-10">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((u, i) => (
                <TableRow key={u.id}>
                  <TableCell className="text-center text-muted-foreground text-sm w-12">
                    {(page - 1) * PAGE_SIZE + i + 1}.
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {u.full_name ?? <span className="text-muted-foreground italic">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(u.created_at)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={sending === u.id}
                      onClick={() => onResetPassword(u.email, u.id)}
                      className="rounded-md gap-1.5 hover:bg-celeste [&_svg]:size-3.5"
                    >
                      {sending === u.id
                        ? <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                        : <MagicWandIcon className="w-3.5 h-3.5" />}
                      Reset Password
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className={page === 1 ? "pointer-events-none opacity-40 rounded-md" : "cursor-pointer rounded-md hover:bg-muted-foreground/20"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <Button
                  variant={p === page ? "default" : "ghost"}
                  size="sm"
                  className="w-8 h-8 p-0 rounded-md font-medium text-sm hover:bg-muted-foreground/20"
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </Button>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                className={page === totalPages ? "pointer-events-none opacity-40 rounded-md" : "cursor-pointer rounded-md hover:bg-muted-foreground/20"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UsersTable() {
  const [allUsers, setAllUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [adminPage, setAdminPage] = useState(1)
  const [userPage, setUserPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false })

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")

      const roleMap = new Map<string, "admin" | "user">()
      for (const r of roles ?? []) {
        roleMap.set(r.user_id, r.role)
      }

      const users: UserRecord[] = (profiles ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        created_at: p.created_at,
        role: roleMap.get(p.id) ?? "user",
      }))

      setAllUsers(users)
      setLoading(false)
    }
    load()
  }, [])

  const sendResetLink = async (email: string, userId: string) => {
    setSending(userId)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw error
      toast.success("Link terkirim", { description: `Reset password dikirim ke ${email}` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengirim link"
      toast.error("Gagal", { description: message })
    }
    setSending(null)
  }

  const admins = allUsers.filter((u) => u.role === "admin")
  const users = allUsers.filter((u) => u.role !== "admin")

  const adminTotalPages = Math.ceil(admins.length / PAGE_SIZE) || 1
  const userTotalPages = Math.ceil(users.length / PAGE_SIZE) || 1

  if (loading) return <AdminPageSkeleton />

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">User Terdaftar</h2>
        <p className="text-sm text-muted-foreground">
          {allUsers.length} User total — {admins.length} admin, {users.length} user biasa
        </p>
      </div>

      <UserTableSection
        title="Admin"
        icon={<ShieldIcon className="w-4 h-4 text-muted-foreground" />}
        users={admins}
        page={adminPage}
        totalPages={adminTotalPages}
        onPageChange={setAdminPage}
        sending={sending}
        onResetPassword={sendResetLink}
      />

      <UserTableSection
        title="User Biasa"
        icon={<UsersIcon className="w-4 h-4 text-muted-foreground" />}
        users={users}
        page={userPage}
        totalPages={userTotalPages}
        onPageChange={setUserPage}
        sending={sending}
        onResetPassword={sendResetLink}
      />
    </div>
  )
}