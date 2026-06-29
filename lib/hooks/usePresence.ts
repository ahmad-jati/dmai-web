'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ─── Types ──────────────────────────────────────────────────────────────────────

export type PresenceStatus = 'browsing' | 'in_session'

export type PresencePayload = {
  user_id: string
  email: string
  status: PresenceStatus
  session_id?: string
  session_name?: string
  session_slug?: string
  step_index?: number
  step_type?: string
  joined_at: string
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Tracks the current user's presence on the shared 'dmai:online' channel.
 *
 * Channel is created once on mount and reused for the lifetime of the component.
 * When trackable fields change (status, step, etc), we re-track on the same
 * channel instead of tearing it down — this avoids the CLOSED/reopen loop.
 *
 * joined_at is intentionally excluded from the re-track trigger so that
 * new Date().toISOString() on every render doesn't cause infinite loops.
 */
export function usePresence(payload: PresencePayload | null) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  const subscribedRef = useRef(false)

  // ── Mount/unmount: create channel once ───────────────────────────────────────
  useEffect(() => {
    if (!payload) return

    const supabase = supabaseRef.current
    const channel = supabase.channel('dmai:online', {
      config: { presence: { key: payload.user_id } },
    })

    channelRef.current = channel

    channel.subscribe((status) => {
      console.log('[Presence] subscribe status:', status)
      if (status === 'SUBSCRIBED') {
        subscribedRef.current = true
        channel.track(payload).then((result) => {
          console.log('[Presence] initial track result:', result)
        })
      }
    })

    return () => {
      subscribedRef.current = false
      channel.untrack().then(() => {
        supabase.removeChannel(channel)
      })
    }
  // Only run on mount — payload changes handled by the effect below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload?.user_id])

  // ── Re-track when payload fields change (not joined_at) ──────────────────────
  // Stringify only the stable fields so new Date() doesn't trigger this
  const stableKey = payload
    ? JSON.stringify({
        status: payload.status,
        session_id: payload.session_id,
        session_name: payload.session_name,
        session_slug: payload.session_slug,
        step_index: payload.step_index,
        step_type: payload.step_type,
      })
    : null

  useEffect(() => {
    if (!payload || !channelRef.current || !subscribedRef.current) return
    channelRef.current.track(payload).then((result) => {
      console.log('[Presence] re-track result:', result)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey])
}

// ─── Admin subscriber ────────────────────────────────────────────────────────────

/**
 * Subscribes to the presence channel and calls onSync whenever the state changes.
 * Used by the admin panel — does NOT track itself.
 */
export function usePresenceSubscriber(
  onSync: (users: PresencePayload[]) => void
) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('dmai:online')

    channel
      .on('presence', { event: 'sync' }, () => {
        const raw = channel.presenceState<PresencePayload>()
        console.log('[PresenceSubscriber] sync raw:', raw)
        const users = Object.values(raw).map((entries) => entries[entries.length - 1])
        onSync(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('[PresenceSubscriber] join:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('[PresenceSubscriber] leave:', leftPresences)
      })

    channel.subscribe((status) => {
      console.log('[PresenceSubscriber] channel status:', status)
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onSync])
}