'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type PresenceStatus = 'active' | 'in_session'

export type PresencePayload = {
  user_id: string
  email: string
  status: PresenceStatus
  session_id?: string
  session_name?: string
  session_slug?: string
  joined_at: string
}

// Singleton channel — one per tab, shared between PresenceTracker and StepperExercise
let globalChannel: RealtimeChannel | null = null
let globalSubscribeStatus: string = ''

function getOrCreateChannel(userId: string): RealtimeChannel {
  if (globalChannel) return globalChannel
  const supabase = createClient()
  globalChannel = supabase.channel('dmai:online', {
    config: { presence: { key: userId } },
  })
  return globalChannel
}

export function usePresence(payload: PresencePayload | null) {
  const subscribedRef = useRef(false)

  const stableKey = payload
    ? JSON.stringify({
        user_id: payload.user_id,
        status: payload.status,
        session_id: payload.session_id ?? null,
        session_name: payload.session_name ?? null,
      })
    : null

  // Create channel and subscribe once per user
  useEffect(() => {
    if (!payload) return

    const channel = getOrCreateChannel(payload.user_id)

    if (globalSubscribeStatus === '') {
      globalSubscribeStatus = 'PENDING'
      channel.subscribe((status) => {
        globalSubscribeStatus = status
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true
          channel.track(payload)
        }
      })
    }

    return () => {
      // Only untrack in_session on unmount (stepper leaving)
      // The base 'active' tracker in layout stays alive
      if (payload.status === 'in_session' && subscribedRef.current) {
        channel.untrack()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload?.user_id])

  // Re-track when status or session changes
  useEffect(() => {
    if (!payload || !globalChannel || globalSubscribeStatus !== 'SUBSCRIBED') return
    globalChannel.track(payload)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey])
}

export function usePresenceSubscriber(
  onSync: (users: PresencePayload[]) => void
) {
  const onSyncRef = useRef(onSync)
  useEffect(() => { onSyncRef.current = onSync }, [onSync])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('dmai:online')

    const handleSync = () => {
      const raw = channel.presenceState<PresencePayload>()
      const users = Object.values(raw).map((entries) => entries[entries.length - 1])
      onSyncRef.current(users)
    }

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleSync)
      .on('presence', { event: 'leave' }, handleSync)
      .subscribe((status) => {
        // On first subscribe, immediately read whatever state is already there
        // so we don't miss users who joined before this subscriber connected
        if (status === 'SUBSCRIBED') handleSync()
      })

    return () => { supabase.removeChannel(channel) }
  }, [])
}