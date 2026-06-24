"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MagnifyingGlassIcon, ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { getUserResponsesSummary, getSessionResponsesSummary } from "../action"
import type { UserResponseSummary, SessionResponseSummary } from "@/types/user-responses"
import { UserListTable } from "./user-list-table"
import { SessionListTable } from "./session-list-table"
import { useDebounce } from "@/lib/hooks/useDebounce"

const PAGE_SIZE = 20

export function UserResponsesClient() {
  const [tab, setTab] = useState<"user" | "session">("user")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [isPending, startTransition] = useTransition()

  const [userData, setUserData] = useState<UserResponseSummary[]>([])
  const [sessionData, setSessionData] = useState<SessionResponseSummary[]>([])
  const [hasMore, setHasMore] = useState(true)

  const fetchData = useCallback(() => {
    startTransition(async () => {
      if (tab === "user") {
        const { data } = await getUserResponsesSummary(page, debouncedSearch)
        setUserData(data)
        setHasMore(data.length === PAGE_SIZE)
      } else {
        const { data } = await getSessionResponsesSummary(page, debouncedSearch)
        setSessionData(data)
        setHasMore(data.length === PAGE_SIZE)
      }
    })
  }, [tab, page, debouncedSearch])

  useEffect(() => {
    setPage(0)
  }, [tab, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "user" | "session")}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="session">Per Sesi</TabsTrigger>
            <TabsTrigger value="user">Per User</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tab === "user" ? "Cari nama / email..." : "Cari nama sesi..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="session" className="mt-4">
          <SessionListTable data={sessionData} isLoading={isPending} />
        </TabsContent>

        <TabsContent value="user" className="mt-4">
          <UserListTable data={userData} isLoading={isPending} />
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">Halaman {page + 1}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isPending}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || isPending}
          >
            Selanjutnya
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}