"use client"

import { useRouter } from "next/navigation"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import type { SessionResponseSummary } from "@/types/user-responses"

type Props = {
  data: SessionResponseSummary[]
  isLoading: boolean
}

export function SessionListTable({ data, isLoading }: Props) {
  const router = useRouter()
  console.log(data)

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
            <TableHead>Nama Sesi</TableHead>
            <TableHead>Minggu</TableHead>
            <TableHead className="text-center">Total Penyelesaian</TableHead>
            <TableHead>Terakhir Diselesaikan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((session) => (
            <TableRow
              key={session.session_id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/admin/user-responses/session/${session.session_id}` as Parameters<typeof router.push>[0])}
            >
              <TableCell className="font-medium">{session.session_name}</TableCell>
              <TableCell>
                {session.week_number != null ? (
                  <Badge variant="outline">Minggu {session.week_number}</Badge>
                ) : "-"}
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5">
                  {session.total_completions}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {session.last_completed_at
                  ? formatDistanceToNow(new Date(session.last_completed_at), {
                      addSuffix: true,
                      locale: id,
                    })
                  : "Belum ada"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}