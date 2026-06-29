'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePresence } from '@/lib/hooks/usePresence'
import type { PresencePayload } from '@/lib/hooks/usePresence'

export function PresenceTracker() {
  const [payload, setPayload] = useState<PresencePayload | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      console.log('[PresenceTracker] user:', data.user?.email)

      const user = data.user
      if (!user) return
      setPayload({
        user_id: user.id,
        email: user.email ?? '',
        status: 'browsing',
        joined_at: new Date().toISOString(),
      })
    })
  }, [])

  usePresence(payload)

  return null
}