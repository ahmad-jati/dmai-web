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
import { StepTypeForm, BodyPart } from './step-type-form'
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
  duration_seconds: 60,
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [audioFile, setAudioFile] = useState<File | null>(null)

  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [bodyPartsLoading, setBodyPartsLoading] = useState(false)

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm(emptyStep(nextStepNumber))
      setImageFile(null)
      setAudioFile(null)
      setImagePreview('')
    }
  }, [open, nextStepNumber])

  // Fetch body_parts once on first open
  useEffect(() => {
    if (!open || bodyParts.length > 0) return
    const fetch = async () => {
      setBodyPartsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('body_parts')
        .select('id, part_key, label_id, region, sort_order')
        .order('sort_order', { ascending: true })
      if (!error && data) setBodyParts(data as BodyPart[])
      setBodyPartsLoading(false)
    }
    fetch()
  }, [open])

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

    const { data: inserted, error: insertErr } = await supabase
      .from('session_steps')
      .insert({
        session_id: sessionId,
        step_number: nextStepNumber,
        title: form.title,
        description: form.description,
        duration_seconds: form.duration_seconds,
        step_type: form.step_type,
        step_config: form.step_config,
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

    const newId = inserted.id
    let finalImageUrl = ''
    let finalAudioUrl = ''

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `steps/${newId}/image.${ext}`
      const { error: upErr } = await supabase.storage
        .from('session-assets')
        .upload(path, imageFile, { upsert: true })
      if (!upErr) {
        const { data: d } = supabase.storage.from('session-assets').getPublicUrl(path)
        finalImageUrl = d.publicUrl
      }
    }

    if (audioFile) {
      const ext = audioFile.name.split('.').pop()
      const path = `steps/${newId}/audio.${ext}`
      const { error: upErr } = await supabase.storage
        .from('session-assets')
        .upload(path, audioFile, { upsert: true })
      if (!upErr) {
        const { data: d } = supabase.storage.from('session-assets').getPublicUrl(path)
        finalAudioUrl = d.publicUrl
      }
    }

    if (finalImageUrl || finalAudioUrl) {
      await supabase
        .from('session_steps')
        .update({ image_url: finalImageUrl, audio_url: finalAudioUrl })
        .eq('id', newId)
    }

    const newStep: SessionStep = {
      ...form,
      id: newId,
      step_number: nextStepNumber,
      image_url: finalImageUrl,
      audio_url: finalAudioUrl,
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
          imageFile={imageFile}
          imagePreview={imagePreview}
          audioFile={audioFile}
          onImageChange={(file, preview) => {
            setImageFile(file)
            setImagePreview(preview)
          }}
          onAudioChange={(file) => setAudioFile(file)}
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