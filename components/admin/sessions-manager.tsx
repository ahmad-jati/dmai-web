'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PlusIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AdminSkeleton } from './sessions/admin-skeleton'
import { SessionCard } from './sessions/session-card'
import { SessionDetailView } from './sessions/session-detail-view'
import { SessionRecord, SessionRaw } from './sessions/types'

export function SessionsManager() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<SessionRecord | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('sessions')
          .select(
            `id, slug, session_name, detail_short, detail_full, image_cover_url,
             sort_order, week_number, duration, total_instruction, is_locked,
             session_steps (id, step_number, title, description, duration_seconds,
               image_url, audio_url, step_type, step_config)`
          )
          .order('sort_order', { ascending: true })
          .returns<SessionRaw[]>()

        if (error) {
          console.error('Failed to load sessions:', error)
          setSessions([])
          return
        }

        const parseConfig = (raw: unknown): Record<string, unknown> => {
          if (!raw) return {}
          if (typeof raw === 'string') {
            try {
              return JSON.parse(raw) as Record<string, unknown>
            } catch {
              return {}
            }
          }
          return raw as Record<string, unknown>
        }

        const mapped: SessionRecord[] = (data ?? []).map((s) => ({
          id: s.id,
          slug: s.slug,
          session_name: s.session_name,
          detail_short: s.detail_short,
          detail_full: s.detail_full ?? [],
          image_cover_url: s.image_cover_url ?? '',
          total_instruction: s.total_instruction ?? null,
          duration: s.duration ?? null,
          sort_order: s.sort_order ?? null,
          week_number: s.week_number ?? null,
          is_locked: s.is_locked ?? true,
          steps: [...(s.session_steps ?? [])].map((step) => ({
            ...step,
            step_config: parseConfig(step.step_config),
          })).sort((a, b) => a.step_number - b.step_number),
        }))

        setSessions(mapped)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSessionUpdated = useCallback((updated: SessionRecord) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setActiveSession(updated)
  }, [])

  const handleLockToggled = useCallback((id: string, is_locked: boolean) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, is_locked } : s)))
  }, [])

  const handleSessionDeleted = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setActiveSession(null)
  }, [])

  if (loading) return <AdminSkeleton />

  if (activeSession) {
    return (
      <SessionDetailView
        session={activeSession}
        onBack={() => setActiveSession(null)}
        onSessionUpdated={handleSessionUpdated}
        onSessionDeleted={handleSessionDeleted}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Kelola Sesi Terapi</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{sessions.length} sesi tersedia</p>
        </div>
        <Button
          asChild
          size="sm"
          className="rounded-sm gap-1.5 [&_svg]:size-3.5 bg-background hover:bg-lemon text-foreground"
        >
          <Link href="/admin/sessions/new">
            <PlusIcon className="w-3.5 h-3.5" />
            Tambah Sesi
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {sessions.map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            onClick={() => setActiveSession(s)}
            onLockToggled={handleLockToggled}
          />
        ))}
      </div>
    </div>
  )
}