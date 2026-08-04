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
// Always the most recently requested payload across ALL usePresence callers
// (PresenceTracker's 'active' and StepperExercise's 'in_session' both write here).
// This is what actually gets tracked once the channel is ready — never a payload
// captured in a stale subscribe() closure.
let globalLatestPayload: PresencePayload | null = null

function getOrCreateChannel(userId: string): RealtimeChannel {
  if (globalChannel) return globalChannel
  const supabase = createClient()
  globalChannel = supabase.channel('dmai:online', {
    config: { presence: { key: userId } },
  })
  return globalChannel
}

// Records the caller's desired payload and, if the channel is already
// subscribed, tracks it immediately. If the channel is still connecting,
// the payload is picked up as soon as SUBSCRIBED fires (see subscribe
// callback below) — nothing is silently dropped.
function trackWhenReady(payload: PresencePayload) {
  globalLatestPayload = payload
  if (globalChannel && globalSubscribeStatus === 'SUBSCRIBED') {
    globalChannel.track(payload)
  }
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
        // Track whatever the most recently requested payload is at the
        // moment we actually become SUBSCRIBED — not whichever payload
        // happened to trigger this subscribe() call. Two usePresence
        // instances (layout's 'active' and stepper's 'in_session') can
        // both mount before the socket finishes connecting; without this,
        // whichever one lost the race to initiate subscribe() would win
        // permanently, leaving some users stuck on 'active'.
        if (status === 'SUBSCRIBED' && globalLatestPayload) {
          channel.track(globalLatestPayload)
        }
      })
    }

    // Register this instance's payload as the latest desired state, and
    // track it right away if the channel already happens to be ready.
    trackWhenReady(payload)

    return () => {
      // When stepper (in_session) unmounts: fall back to active, don't untrack
      if (payload.status === 'in_session' && globalActivePayload) {
        trackWhenReady(globalActivePayload)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload?.user_id])

  // Re-track when status/session changes (e.g. layout→active, stepper→in_session)
  useEffect(() => {
    if (!payload || !globalChannel) return

    // Keep globalActivePayload fresh
    if (payload.status === 'active') {
      globalActivePayload = payload
    }

    // Even if the channel isn't SUBSCRIBED yet, record this as the latest
    // desired payload so the subscribe callback (or the next trackWhenReady
    // call) picks it up instead of dropping it on the floor.
    trackWhenReady(payload)
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
  if (globalActivePayload) {
    trackWhenReady(globalActivePayload)
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