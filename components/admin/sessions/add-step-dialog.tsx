'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { PlusIcon } from '@phosphor-icons/react'
import { StepTypeForm } from './step-type-form'
import { SessionStep, StepType, NarrationSubStep } from './types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseStepConfig(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>
  return {}
}

/** Strip File/Blob refs and any leftover blob: preview urls before hitting the DB. */
function stripRuntimeArtifacts(value: unknown): unknown {
  if (value instanceof File || value instanceof Blob) return undefined
  if (typeof value === 'string' && value.startsWith('blob:')) return undefined
  if (Array.isArray(value)) {
    return value.map(stripRuntimeArtifacts).filter((v) => v !== undefined)
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (['audio_file', 'image_file', 'audio_preview', 'image_preview'].includes(k)) continue
      const stripped = stripRuntimeArtifacts(v)
      if (stripped !== undefined) out[k] = stripped
    }
    return out
  }
  return value
}

interface AddStepDialogProps {
  sessionId: string
  nextStepNumber: number
  open: boolean
  onAdded: (step: SessionStep) => void
  onClose: () => void
}

const emptyStep = (stepNumber: number): SessionStep => ({
  id: '',
  session_id: undefined,
  step_number: stepNumber,
  title: '',
  description: '',
  duration_seconds: 0,
  image_url: '',
  audio_url: '',
  step_type: 'narration' as StepType,
  step_config: {},
})

export function AddStepDialog({
  sessionId,
  nextStepNumber,
  open,
  onAdded,
  onClose,
}: AddStepDialogProps) {
  const [form, setForm] = useState<SessionStep>(() => emptyStep(nextStepNumber))
  const [saving, setSaving] = useState(false)

  // Reset on open
  useEffect(() => {
    if (open) setForm(emptyStep(nextStepNumber))
  }, [open, nextStepNumber])


  const handleFormChange = useCallback((patch: Partial<SessionStep>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }, [])

  

  const handleAdd = async () => {
    if (!form.title.trim()) {
      toast.error('Nama step wajib diisi')
      return
    }
    setSaving(true)
    const supabase = createClient()

    const parsedConfig = parseStepConfig(form.step_config)
    const isNarrationWithSubSteps =
      form.step_type === 'narration' && Array.isArray(parsedConfig.sub_steps)

    // Narration steps insert with an empty config first, upload the sub-step
    // audio/image files, then patch step_config with the real storage URLs.
    // (Same two-phase approach as the session detail edit flow — we need the
    // step's id before we know the storage path.)
    const { data: inserted, error: insertErr } = await supabase
      .from('session_steps')
      .insert({
        session_id: sessionId,
        step_number: nextStepNumber,
        title: form.title,
        description: form.description,
        duration_seconds: form.duration_seconds,
        step_type: form.step_type,
        step_config: isNarrationWithSubSteps ? {} : stripRuntimeArtifacts(parsedConfig),
      })
      .select()
      .single()

    if (insertErr || !inserted) {
      toast.error('Gagal menambah step', { description: insertErr?.message })
      setSaving(false)
      return
    }

    const stepId = inserted.id as string
    let finalConfig: Record<string, unknown> = stripRuntimeArtifacts(parsedConfig) as Record<string, unknown>

    if (isNarrationWithSubSteps) {
      const rawSubSteps = parsedConfig.sub_steps as NarrationSubStep[]

      const uploadedSubSteps = await Promise.all(
        rawSubSteps.map(async (sub, i) => {
          let audioUrl = sub.audio_url ?? ''
          let imageUrl = sub.image_url ?? ''

          if (sub.audio_file instanceof File) {
            const ext = sub.audio_file.name.split('.').pop()
            const path = `steps/${stepId}/sub_${i}_audio.${ext}`
            const { error } = await supabase.storage.from('session-assets').upload(path, sub.audio_file, { upsert: true })
            if (!error) {
              const { data } = supabase.storage.from('session-assets').getPublicUrl(path)
              audioUrl = data.publicUrl
            } else {
              console.error('[upload sub audio]', error)
            }
          }

          if (sub.image_file instanceof File) {
            const ext = sub.image_file.name.split('.').pop()
            const path = `steps/${stepId}/sub_${i}_image.${ext}`
            const { error } = await supabase.storage.from('session-assets').upload(path, sub.image_file, { upsert: true })
            if (!error) {
              const { data } = supabase.storage.from('session-assets').getPublicUrl(path)
              imageUrl = data.publicUrl
            } else {
              console.error('[upload sub image]', error)
            }
          }

          return stripRuntimeArtifacts({ ...sub, audio_url: audioUrl, image_url: imageUrl }) as Record<string, unknown>
        })
      )

      finalConfig = { sub_steps: uploadedSubSteps }

      const { error: updateErr } = await supabase
        .from('session_steps')
        .update({ step_config: finalConfig })
        .eq('id', stepId)

      if (updateErr) {
        toast.error('Step tersimpan, tapi gagal menyimpan file audio/gambar', { description: updateErr.message })
      }
    }

    const newStep: SessionStep = {
      ...form,
      id: stepId,
      step_number: nextStepNumber,
      step_config: finalConfig,
      image_url: '',
      audio_url: '',
    }

    toast.success('Step ditambahkan')
    onAdded(newStep)
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[92vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tambah Step {nextStepNumber}</DialogTitle>
        </DialogHeader>

        <StepTypeForm
          form={form}
          setForm={handleFormChange}
        />

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-sm text-sm hover:bg-destructive/50"
          >
            Batal
          </Button>
          <Button
            onClick={handleAdd}
            disabled={saving}
            className="rounded-sm gap-2 text-sm [&_svg]:size-4 bg-background hover:bg-lemon text-foreground"
          >
            {saving ? (
              <Spinner className="shrink-0 text-foreground" />
            ) : (
              <PlusIcon className="w-4 h-4" />
            )}
            {saving ? 'Menyimpan...' : 'Tambah Step'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}