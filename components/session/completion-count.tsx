'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { HeartIcon } from "@phosphor-icons/react"

export function CompletionCount({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchCount = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return
      const { count } = await supabase
        .from("session_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("session_slug", slug)
      setCount(count ?? 0)
    }
    fetchCount()
  }, [slug])

  return (
    <div className="flex items-center gap-1">
      <HeartIcon className="w-5 h-5" weight="fill" />
      {count === null
        ? <div className="h-4 w-40 bg-foreground/10 rounded animate-pulse" />
        : <p className="font-medium xs:text-p/5 text-xs/3.5">
            {count === 0
              ? "Kamu belum pernah mengikuti sesi ini"
              : `Kamu telah mengikuti sesi ini ${count} kali`}
          </p>
      }
    </div>
  )
}

export function CompletionCountMobile({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchCount = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return
      const { count } = await supabase
        .from("session_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("session_slug", slug)
      setCount(count ?? 0)
    }
    fetchCount()
  }, [slug])

  return (
    <div className="2md:hidden flex justify-center text-muted-foreground items-center gap-1 w-full">
      <HeartIcon className="w-4 h-4" weight="fill" />
      {count === null
        ? <div className="h-3.5 w-32 bg-foreground/10 rounded animate-pulse" />
        : <p className="font-medium xs:text-p/5 text-xs/3.5">
            {count === 0
              ? "Belum mengikuti sesi ini"
              : `Sesi diikuti ${count} kali`}
          </p>
      }
    </div>
  )
}