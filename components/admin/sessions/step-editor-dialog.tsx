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
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { FloppyDiskIcon } from '@phosphor-icons/react'
import { StepTypeForm, BodyPart } from './step-type-form'
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [audioFile, setAudioFile] = useState<File | null>(null)

  // Body parts — fetched once when dialog first opens
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [bodyPartsLoading, setBodyPartsLoading] = useState(false)

  // Reset form whenever the target step changes
  useEffect(() => {
    if (step) {
      setForm({ ...step })
      setImageFile(null)
      setAudioFile(null)
      setImagePreview(step.image_url ?? '')
    }
  }, [step])

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
    setForm((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    const supabase = createClient()
    let finalImageUrl = form.image_url
    let finalAudioUrl = form.audio_url

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `steps/${form.id}/image.${ext}`
      const { error: upErr } = await supabase.storage
        .from('session-assets')
        .upload(path, imageFile, { upsert: true })
      if (upErr) {
        toast.error('Gagal upload gambar', { description: upErr.message })
      } else {
        const { data: urlData } = supabase.storage.from('session-assets').getPublicUrl(path)
        finalImageUrl = urlData.publicUrl
      }
    }

    if (audioFile) {
      const ext = audioFile.name.split('.').pop()
      const path = `steps/${form.id}/audio.${ext}`
      const { error: upErr } = await supabase.storage
        .from('session-assets')
        .upload(path, audioFile, { upsert: true })
      if (upErr) {
        toast.error('Gagal upload audio', { description: upErr.message })
      } else {
        const { data: urlData } = supabase.storage.from('session-assets').getPublicUrl(path)
        finalAudioUrl = urlData.publicUrl
      }
    }

    await onSave({ ...form, image_url: finalImageUrl, audio_url: finalAudioUrl })
    setSaving(false)
  }

  if (!form) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[92vh] overflow-y-auto"
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