'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { FloppyDiskIcon } from '@phosphor-icons/react'
import { StepTypeForm } from './step-type-form'
import { SessionStep, STEP_TYPE_LABELS, STEP_TYPE_COLORS, BodyPart, NarrationSubStep } from './types'

function parseConfig(raw: unknown): Record<string, unknown> {
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

type StepEditorDialogProps = {
  step: SessionStep | null
  open: boolean
  onSave: (step: SessionStep) => Promise<void> | void
  onClose: () => void
}

export function StepEditorDialog({ step, open, onSave, onClose }: StepEditorDialogProps) {
  const [form, setForm] = useState<SessionStep | null>(null)
  const [saving, setSaving] = useState(false)
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [bodyPartsLoading, setBodyPartsLoading] = useState(false)

  // Reset + normalize whenever the target step changes
  useEffect(() => {
    if (!step) return
    // Always parse step_config — Supabase jsonb can return as a string "{}"
    const parsedConfig = parseConfig(step.step_config)

    // Normalize narration sub_steps: add _key if missing
    let normalizedConfig: Record<string, unknown> = parsedConfig
    if (step.step_type === 'narration') {
      const rawSubs = Array.isArray(parsedConfig.sub_steps)
        ? (parsedConfig.sub_steps as NarrationSubStep[])
        : []
      normalizedConfig = {
        ...parsedConfig,
        sub_steps: rawSubs.map((s) =>
          s._key ? s : { ...s, _key: `db-${Math.random().toString(36).slice(2, 8)}` }
        ),
      }
    }

    setForm({ ...step, step_config: normalizedConfig })
  }, [step])

  // Fetch body_parts once on first open
  useEffect(() => {
    if (!open || bodyParts.length > 0) return
    const load = async () => {
      setBodyPartsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('body_parts')
        .select('id, part_key, label_id, region, sort_order')
        .order('sort_order', { ascending: true })
        .returns<BodyPart[]>()
      if (!error && data) setBodyParts(data)
      setBodyPartsLoading(false)
    }
    load()
  }, [open])

  const handleFormChange = useCallback((patch: Partial<SessionStep>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  if (!form) return null

  // Count sub-steps for narration badge
  const subStepCount = form.step_type === 'narration'
    ? (Array.isArray(form.step_config?.sub_steps) ? (form.step_config.sub_steps as unknown[]).length : 0)
    : null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[92vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2.5 flex-wrap">
            <DialogTitle>Edit Step {form.step_number}</DialogTitle>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-xs font-medium ${
                STEP_TYPE_COLORS[form.step_type ?? 'narration']
              }`}
            >
              {STEP_TYPE_LABELS[form.step_type ?? 'narration']}
            </span>
            {subStepCount !== null && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-sm border border-border">
                {subStepCount} sub-step{subStepCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </DialogHeader>

        <StepTypeForm
          form={form}
          setForm={handleFormChange}
          bodyParts={bodyParts}
          bodyPartsLoading={bodyPartsLoading}
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
            onClick={handleSave}
            disabled={saving}
            className="rounded-sm gap-2 text-sm [&_svg]:size-4 bg-background hover:bg-lemon text-foreground"
          >
            {saving ? (
              <Spinner className="shrink-0 text-foreground" />
            ) : (
              <FloppyDiskIcon className="w-4 h-4" />
            )}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}