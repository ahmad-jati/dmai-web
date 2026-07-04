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

// ─── Singleton state (per browser tab) ──────────────────────────────────────────
let globalChannel: RealtimeChannel | null = null
let globalSubscribeStatus: string = ''
// Always keep the last 'active' payload so we can fall back to it
// when the stepper unmounts (user finishes/exits a session)
let globalActivePayload: PresencePayload | null = null

function getOrCreateChannel(userId: string): RealtimeChannel {
  if (globalChannel) return globalChannel
  const supabase = createClient()
  globalChannel = supabase.channel('dmai:online', {
    config: { presence: { key: userId } },
  })
  return globalChannel
}

// ─── usePresence ─────────────────────────────────────────────────────────────────

export function usePresence(payload: PresencePayload | null) {
  const stableKey = payload
    ? JSON.stringify({
        user_id: payload.user_id,
        status: payload.status,
        session_id: payload.session_id ?? null,
        session_name: payload.session_name ?? null,
      })
    : null

  // Subscribe channel once on mount (keyed by user_id)
  useEffect(() => {
    if (!payload) return

    // Store active payload globally so stepper can fall back to it on unmount
    if (payload.status === 'active') {
      globalActivePayload = payload
    }

    const channel = getOrCreateChannel(payload.user_id)

    if (globalSubscribeStatus === '') {
      globalSubscribeStatus = 'PENDING'
      channel.subscribe((status) => {
        globalSubscribeStatus = status
        if (status === 'SUBSCRIBED') {
          channel.track(payload)
        }
      })
    }

    return () => {
      // When stepper (in_session) unmounts: fall back to active, don't untrack
      if (payload.status === 'in_session' && globalChannel && globalActivePayload) {
        globalChannel.track(globalActivePayload)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload?.user_id])

  // Re-track when status/session changes (e.g. layout→active, stepper→in_session)
  useEffect(() => {
    if (!payload || !globalChannel || globalSubscribeStatus !== 'SUBSCRIBED') return

    // Keep globalActivePayload fresh
    if (payload.status === 'active') {
      globalActivePayload = payload
    }

    globalChannel.track(payload)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey])
}

// ─── Manual reset ────────────────────────────────────────────────────────────────

/**
 * Call this explicitly when a session completes — don't rely on unmount alone,
 * since the parent page may keep StepperExercise mounted after onDone() fires
 * (e.g. showing a result screen in the same component tree).
 */
export function markPresenceActive() {
  if (globalChannel && globalActivePayload && globalSubscribeStatus === 'SUBSCRIBED') {
    globalChannel.track(globalActivePayload)
  }
}

// ─── usePresenceSubscriber ───────────────────────────────────────────────────────

export function usePresenceSubscriber(
  onSync: (users: PresencePayload[]) => void
): { refresh: () => void } {
  const onSyncRef = useRef(onSync)
  useEffect(() => { onSyncRef.current = onSync }, [onSync])

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('dmai:online')
    channelRef.current = channel

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
        if (status === 'SUBSCRIBED') handleSync()
      })

    return () => {
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [])

  const refresh = () => {
    if (!channelRef.current) return
    const raw = channelRef.current.presenceState<PresencePayload>()
    const users = Object.values(raw).map((entries) => entries[entries.length - 1])
    onSyncRef.current(users)
  }

  return { refresh }
}