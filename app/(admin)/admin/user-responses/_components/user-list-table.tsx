"use client"

import { useRouter } from "next/navigation"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import type { UserResponseSummary } from "@/types/user-responses"

type Props = {
  data: UserResponseSummary[]
  isLoading: boolean
}

export function UserListTable({ data, isLoading }: Props) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Tidak ada data ditemukan.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-center">Sesi Selesai</TableHead>
            <TableHead>Terakhir Aktif</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => (
            <TableRow
              key={user.user_id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/admin/user-responses/${user.user_id}` as Parameters<typeof router.push>[0])}
            >
              <TableCell className="font-medium">{user.full_name ?? "-"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{user.email ?? "-"}</TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5">
                  {user.total_sessions_completed}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {user.last_completed_at
                  ? formatDistanceToNow(new Date(user.last_completed_at), {
                      addSuffix: true,
                      locale: id,
                    })
                  : "Belum pernah"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}