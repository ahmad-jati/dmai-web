'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthStateListener() {
  const router = useRouter()
  const prevUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUserId = session?.user?.id ?? null

      if (prevUserId.current === undefined) {
        prevUserId.current = currentUserId
        return
      }

      if (currentUserId !== prevUserId.current) {
        prevUserId.current = currentUserId
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}