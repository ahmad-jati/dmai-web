'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePresence } from '@/lib/hooks/usePresence'
import type { PresencePayload } from '@/lib/hooks/usePresence'

// joined_at stored in sessionStorage so refresh doesn't create a new presence entry
function getJoinedAt(userId: string): string {
  const key = `dmai_joined_at_${userId}`
  try {
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const now = new Date().toISOString()
    sessionStorage.setItem(key, now)
    return now
  } catch {
    return new Date().toISOString()
  }
}

export function PresenceTracker() {
  const [payload, setPayload] = useState<PresencePayload | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return
      setPayload({
        user_id: user.id,
        email: user.email ?? '',
        status: 'active',
        joined_at: getJoinedAt(user.id),
      })
    })
  }, [])

  usePresence(payload)
  return null
}