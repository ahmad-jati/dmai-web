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
import { SessionStep, StepType } from './types'

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

    // Strip File objects from step_config before inserting — they're not JSON-serializable
    const safeConfig = JSON.parse(JSON.stringify(form.step_config, (_, v) =>
      v instanceof File || v instanceof Blob ? undefined : v
    ))

    const { data: inserted, error: insertErr } = await supabase
      .from('session_steps')
      .insert({
        session_id: sessionId,
        step_number: nextStepNumber,
        title: form.title,
        description: form.description,
        duration_seconds: form.duration_seconds,
        step_type: form.step_type,
        step_config: safeConfig,
        image_url: '',
        audio_url: '',
      })
      .select()
      .single()

    if (insertErr || !inserted) {
      toast.error('Gagal menambah step', { description: insertErr?.message })
      setSaving(false)
      return
    }

    const newStep: SessionStep = {
      ...form,
      id: inserted.id,
      step_number: nextStepNumber,
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