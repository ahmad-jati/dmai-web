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
import { StepTypeForm, BodyPart, NarrationSubStep } from './step-type-form'
import { SessionStep, STEP_TYPE_LABELS, STEP_TYPE_COLORS } from './types'

interface StepEditorDialogProps {
  step: SessionStep | null
  open: boolean
  onSave: (updated: SessionStep) => Promise<void>
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
    const normalized = { ...step }
    // DB-loaded sub_steps won't have _key — add it so React keys and update logic work
    if (step.step_type === 'narration' && Array.isArray(step.step_config?.sub_steps)) {
      normalized.step_config = {
        ...step.step_config,
        sub_steps: (step.step_config.sub_steps as Record<string, unknown>[]).map((s) =>
          (s as NarrationSubStep)._key
            ? s
            : { ...s, _key: `db-${Math.random().toString(36).slice(2, 8)}` }
        ),
      }
    }
    setForm(normalized)
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
      if (!error && data) setBodyParts(data as BodyPart[])
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[92vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <DialogTitle>Edit Step {form.step_number}</DialogTitle>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-xs font-medium ${
                STEP_TYPE_COLORS[form.step_type ?? 'narration']
              }`}
            >
              {STEP_TYPE_LABELS[form.step_type ?? 'narration']}
            </span>
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