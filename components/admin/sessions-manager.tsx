'use client'

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  PencilSimpleIcon,
  ArrowLeftIcon,
  FloppyDiskIcon,
  ImageIcon,
  SpeakerHighIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react"
import { Badge } from "../ui/badge"
import Image from "next/image"
import Link from "next/link"
import { Route } from "next"

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStep = {
  id: string
  step_number: number
  title: string
  description: string
  duration_seconds: number
  image_url: string
  audio_url: string
}

type SessionRecord = {
  id: string
  slug: string
  session_name: string
  detail_short: string
  detail_full: string[]
  image_cover_url: string
  steps: SessionStep[]
}

type SessionRaw = {
  id: string
  slug: string
  session_name: string
  detail_short: string
  detail_full: string[]
  image_cover_url: string
  session_steps: SessionStep[]
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-6 bg-muted rounded w-56" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-4 bg-white border border-border rounded-sm animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-muted rounded-sm shrink-0" />
              <div className="flex flex-col gap-1 flex-1">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2.5 bg-muted/60 rounded w-1/2" />
              </div>
            </div>
            <div className="h-2.5 bg-muted/50 rounded w-full" />
            <div className="h-2.5 bg-muted/40 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step Editor Dialog (Edit existing) ───────────────────────────────────────

function StepEditorDialog({
  step,
  open,
  onSave,
  onClose,
}: {
  step: SessionStep | null
  open: boolean
  onSave: (updated: SessionStep) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<SessionStep | null>(null)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const imageRef = useRef<HTMLInputElement>(null!)
  const audioRef = useRef<HTMLInputElement>(null!)

  useEffect(() => {
    if (step) {
      setForm({ ...step })
      setImageFile(null)
      setAudioFile(null)
      setImagePreview(step.image_url)
    }
  }, [step])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && form) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAudioFile(file)
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    const supabase = createClient()
    let finalImageUrl = form.image_url
    let finalAudioUrl = form.audio_url

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `steps/${form.id}/image.${ext}`
      const { error: upErr } = await supabase.storage.from('session-assets').upload(path, imageFile, { upsert: true })
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
      const { error: upErr } = await supabase.storage.from('session-assets').upload(path, audioFile, { upsert: true })
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Step {form.step_number}</DialogTitle>
        </DialogHeader>

        <StepFormFields
          form={form}
          setForm={setForm as React.Dispatch<React.SetStateAction<SessionStep>>}
          imagePreview={imagePreview}
          imageFile={imageFile}
          audioFile={audioFile}
          imageRef={imageRef}
          audioRef={audioRef}
          onImageChange={handleImageChange}
          onAudioChange={handleAudioChange}
        />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-sm text-sm hover:bg-destructive/50">Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-sm gap-2 text-sm [&_svg]:size-4 bg-background hover:bg-lemon text-foreground">
            {saving ? <Spinner className="shrink-0 text-foreground" /> : <FloppyDiskIcon className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add Step Dialog ───────────────────────────────────────────────────────────

type NewStepForm = {
  title: string
  description: string
  duration_seconds: number
  image_url: string
  audio_url: string
}

function AddStepDialog({
  sessionId,
  nextStepNumber,
  open,
  onAdded,
  onClose,
}: {
  sessionId: string
  nextStepNumber: number
  open: boolean
  onAdded: (step: SessionStep) => void
  onClose: () => void
}) {
  const emptyForm: NewStepForm = { title: '', description: '', duration_seconds: 60, image_url: '', audio_url: '' }
  const [form, setForm] = useState<NewStepForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const imageRef = useRef<HTMLInputElement>(null!)
  const audioRef = useRef<HTMLInputElement>(null!)

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm(emptyForm)
      setImageFile(null)
      setAudioFile(null)
      setImagePreview('')
    }
  }, [open])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAudioFile(file)
  }

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error('Nama step wajib diisi'); return }
    setSaving(true)
    const supabase = createClient()

    // 1. Insert the step row first to get its ID
    const { data: inserted, error: insertErr } = await supabase
      .from('session_steps')
      .insert({
        session_id: sessionId,
        step_number: nextStepNumber,
        title: form.title,
        description: form.description,
        duration_seconds: form.duration_seconds,
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

    // 2. Upload files using the new ID
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `steps/${newId}/image.${ext}`
      const { error: upErr } = await supabase.storage.from('session-assets').upload(path, imageFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('session-assets').getPublicUrl(path)
        finalImageUrl = urlData.publicUrl
      }
    }

    if (audioFile) {
      const ext = audioFile.name.split('.').pop()
      const path = `steps/${newId}/audio.${ext}`
      const { error: upErr } = await supabase.storage.from('session-assets').upload(path, audioFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('session-assets').getPublicUrl(path)
        finalAudioUrl = urlData.publicUrl
      }
    }

    // 3. Update URLs if files were uploaded
    if (finalImageUrl || finalAudioUrl) {
      await supabase
        .from('session_steps')
        .update({ image_url: finalImageUrl, audio_url: finalAudioUrl })
        .eq('id', newId)
    }

    const newStep: SessionStep = {
      id: newId,
      step_number: nextStepNumber,
      title: form.title,
      description: form.description,
      duration_seconds: form.duration_seconds,
      image_url: finalImageUrl,
      audio_url: finalAudioUrl,
    }

    toast.success('Step ditambahkan')
    onAdded(newStep)
    setSaving(false)
  }

  // Reuse form fields with a SessionStep-compatible partial setter
  const asSessionStep: SessionStep = { id: '', step_number: nextStepNumber, ...form }
  const setAsSessionStep: React.Dispatch<React.SetStateAction<SessionStep>> = (updater) => {
    setForm((prev) => {
      const current: SessionStep = { id: '', step_number: nextStepNumber, ...prev }
      const next = typeof updater === 'function' ? updater(current) : updater
      return { title: next.title, description: next.description, duration_seconds: next.duration_seconds, image_url: next.image_url, audio_url: next.audio_url }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Tambah Step {nextStepNumber}</DialogTitle>
        </DialogHeader>

        <StepFormFields
          form={asSessionStep}
          setForm={setAsSessionStep}
          imagePreview={imagePreview}
          imageFile={imageFile}
          audioFile={audioFile}
          imageRef={imageRef}
          audioRef={audioRef}
          onImageChange={handleImageChange}
          onAudioChange={handleAudioChange}
        />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-sm text-sm hover:bg-destructive/50">Batal</Button>
          <Button onClick={handleAdd} disabled={saving} className="rounded-sm gap-2 text-sm [&_svg]:size-4 bg-background hover:bg-lemon text-foreground">
            {saving ? <Spinner className="shrink-0 text-foreground" /> : <PlusIcon className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Tambah Step'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Step Confirm Dialog ────────────────────────────────────────────────

function DeleteStepDialog({
  step,
  open,
  remainingSteps,
  onDeleted,
  onClose,
}: {
  step: SessionStep | null
  open: boolean
  remainingSteps: SessionStep[]
  onDeleted: (id: string, renumbered: { id: string; step_number: number }[]) => void
  onClose: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!step) return
    setDeleting(true)
    const supabase = createClient()

    // 1. Delete the target step
    const { error } = await supabase
      .from('session_steps')
      .delete()
      .eq('id', step.id)

    if (error) {
      console.error('[DeleteStep] Supabase error:', error)
      // code 42501 = RLS policy violation (admin policies not set up)
      const hint = error.code === '42501'
        ? 'Pastikan RLS policy admin sudah diterapkan di Supabase (lihat admin_rls_policies.sql)'
        : error.message
      toast.error('Gagal menghapus step', { description: hint })
      setDeleting(false)
      return
    }

    // 2. Re-number the remaining steps in the DB so there are no gaps
    const siblings = remainingSteps
      .filter((s) => s.id !== step.id)
      .sort((a, b) => a.step_number - b.step_number)

    const renumbered: { id: string; step_number: number }[] = []
    for (let i = 0; i < siblings.length; i++) {
      const newNum = i + 1
      if (siblings[i].step_number !== newNum) {
        const { error: upErr } = await supabase
          .from('session_steps')
          .update({ step_number: newNum })
          .eq('id', siblings[i].id)
        if (upErr) console.warn('[DeleteStep] Renumber error:', upErr)
      }
      renumbered.push({ id: siblings[i].id, step_number: newNum })
    }

    toast.success('Step dihapus')
    onDeleted(step.id, renumbered)
    setDeleting(false)
  }

  if (!step) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Hapus Step {step.step_number}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Step <span className="font-medium text-foreground">{step.title}</span> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-sm text-sm">Batal</Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-sm gap-2 text-sm [&_svg]:size-4 bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? <Spinner className="shrink-0 text-white" /> : <TrashIcon className="w-4 h-4" />}
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Shared Step Form Fields ──────────────────────────────────────────────────

function StepFormFields({
  form,
  setForm,
  imagePreview,
  imageFile,
  audioFile,
  imageRef,
  audioRef,
  onImageChange,
  onAudioChange,
}: {
  form: SessionStep
  setForm: React.Dispatch<React.SetStateAction<SessionStep>>
  imagePreview: string
  imageFile: File | null
  audioFile: File | null
  imageRef: React.RefObject<HTMLInputElement>
  audioRef: React.RefObject<HTMLInputElement>
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAudioChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="step-title">Nama Step</Label>
        <Input
          id="step-title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="step-desc">Instruksi</Label>
        <Textarea
          id="step-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="step-duration">Durasi (detik)</Label>
        <Input
          id="step-duration"
          type="number"
          value={form.duration_seconds}
          onChange={(e) => setForm((f) => ({ ...f, duration_seconds: Number(e.target.value) }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Gambar</Label>
        <div className="flex items-center gap-4">
          {imagePreview && (
            <Image
              src={imagePreview}
              alt="preview"
              width={60}
              height={60}
              className="w-20 h-20 object-cover border border-border rounded-sm shrink-0 bg-muted-foreground/10"
              unoptimized
            />
          )}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground truncate max-w-48">
              {imageFile?.name ?? (imagePreview ? 'File saat ini' : 'Belum ada gambar')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => imageRef.current?.click()}
              className="w-fit rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground"
            >
              <ImageIcon className="w-4 h-4" />
              {imagePreview ? 'Ganti Gambar' : 'Upload Gambar'}
            </Button>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Audio Narasi</Label>
        {form.audio_url && !audioFile && (
          <audio controls src={form.audio_url} className="w-full h-10" />
        )}
        {audioFile && (
          <p className="text-xs text-muted-foreground">File baru: {audioFile.name}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => audioRef.current?.click()}
          className="w-fit rounded-sm gap-2 [&_svg]:size-3.5 bg-background hover:bg-lemon text-foreground"
        >
          <SpeakerHighIcon className="w-4 h-4" />
          {form.audio_url ? 'Ganti Audio' : 'Upload Audio'}
        </Button>
        <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={onAudioChange} />
      </div>
    </div>
  )
}

// ─── Session Detail / Edit View ────────────────────────────────────────────────

type SessionMeta = {
  session_name: string
  slug: string
  detail_short: string
  detail_full: [string, string]
  image_cover_url: string
}

function sessionToMeta(session: SessionRecord): SessionMeta {
  return {
    session_name: session.session_name,
    slug: session.slug,
    detail_short: session.detail_short,
    detail_full: [session.detail_full[0] ?? '', session.detail_full[1] ?? ''],
    image_cover_url: session.image_cover_url ?? '',
  }
}

function metaChanged(original: SessionRecord, form: SessionMeta, coverFile: File | null): boolean {
  if (coverFile) return true
  if (form.session_name !== original.session_name) return true
  if (form.slug !== original.slug) return true
  if (form.detail_short !== original.detail_short) return true
  if (form.detail_full[0] !== (original.detail_full[0] ?? '')) return true
  if (form.detail_full[1] !== (original.detail_full[1] ?? '')) return true
  return false
}

function SessionDetailView({
  session,
  onBack,
  onSessionUpdated,
}: {
  session: SessionRecord
  onBack: () => void
  onSessionUpdated: (updated: SessionRecord) => void
}) {
  const [steps, setSteps] = useState<SessionStep[]>(session.steps)

  // Edit step
  const [editingStep, setEditingStep] = useState<SessionStep | null>(null)
  const [stepEditorOpen, setStepEditorOpen] = useState(false)

  // Add step
  const [addStepOpen, setAddStepOpen] = useState(false)

  // Delete step
  const [deletingStep, setDeletingStep] = useState<SessionStep | null>(null)
  const [deleteStepOpen, setDeleteStepOpen] = useState(false)

  const [form, setForm] = useState<SessionMeta>(() => sessionToMeta(session))
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>(session.image_cover_url ?? '')
  const [saving, setSaving] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null!)

  const isDirty = metaChanged(session, form, coverFile)

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)) }
  }

  const handleSaveMeta = async () => {
    setSaving(true)
    const supabase = createClient()
    let finalCoverUrl = session.image_cover_url

    if (coverFile) {
      const ext = coverFile.name.split('.').pop()
      const path = `sessions/${session.id}/cover.${ext}`
      const { error: upErr } = await supabase.storage.from('session-assets').upload(path, coverFile, { upsert: true })
      if (upErr) { toast.error('Gagal upload cover', { description: upErr.message }); setSaving(false); return }
      const { data: urlData } = supabase.storage.from('session-assets').getPublicUrl(path)
      finalCoverUrl = urlData.publicUrl
    }

    const cleanedDetailFull = form.detail_full.filter((p) => p.trim() !== '')
    const { error } = await supabase
      .from('sessions')
      .update({ session_name: form.session_name, slug: form.slug, detail_short: form.detail_short, detail_full: cleanedDetailFull, image_cover_url: finalCoverUrl })
      .eq('id', session.id)

    if (error) {
      toast.error('Gagal menyimpan', { description: error.message })
    } else {
      const updatedSession: SessionRecord = { ...session, session_name: form.session_name, slug: form.slug, detail_short: form.detail_short, detail_full: cleanedDetailFull, image_cover_url: finalCoverUrl, steps }
      onSessionUpdated(updatedSession)
      setCoverFile(null)
      setCoverPreview(finalCoverUrl)
      toast.success('Tersimpan', { description: 'Sesi berhasil diperbarui.' })
    }
    setSaving(false)
  }

  const handleSaveStep = useCallback(async (updated: SessionStep) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('session_steps')
      .update({ title: updated.title, description: updated.description, duration_seconds: updated.duration_seconds, image_url: updated.image_url, audio_url: updated.audio_url })
      .eq('id', updated.id)

    if (error) {
      toast.error('Gagal menyimpan', { description: error.message })
    } else {
      setSteps((prev) => prev.map((st) => (st.id === updated.id ? updated : st)))
      toast.success('Tersimpan', { description: 'Step berhasil diperbarui.' })
      setStepEditorOpen(false)
      setEditingStep(null)
    }
  }, [])

  const handleStepAdded = useCallback((step: SessionStep) => {
    setSteps((prev) => [...prev, step].sort((a, b) => a.step_number - b.step_number))
    setAddStepOpen(false)
  }, [])

  const handleStepDeleted = useCallback((id: string, renumbered: { id: string; step_number: number }[]) => {
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== id)
      // Apply the step_numbers that were actually written to the DB
      const numMap = new Map(renumbered.map((r) => [r.id, r.step_number]))
      return filtered
        .map((s) => ({ ...s, step_number: numMap.get(s.id) ?? s.step_number }))
        .sort((a, b) => a.step_number - b.step_number)
    })
    setDeleteStepOpen(false)
    setDeletingStep(null)
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <Button variant="link" size="sm" onClick={onBack} className="[&_svg]:size-3.5 rounded-sm gap-2 p-0 text-sm w-fit">
        <ArrowLeftIcon className="w-4 h-4" />
        Kembali
      </Button>

      <div className="flex gap-8 items-start">
        {/* ── Meta Edit Form ── */}
        <div className="flex flex-col gap-5 w-80 shrink-0">
        
          <Link 
            href={`/session/${session.slug}` as Route}
            className="text-2xl font-semibold underline-none flex items-center gap-3 group hover:underline underline-offset-2 "
            target="_blank"
            rel="noopener noreferrer"
          >
            {session.session_name}
            <ArrowUpRightIcon className="w-4 h-4 group-hover:inline hidden"/>
          </Link>

          <div className="flex flex-col gap-2">
            <Label>Gambar Cover</Label>
            <div className="w-full aspect-square rounded-sm overflow-hidden border border-border bg-muted">
              {coverPreview ? (
                <Image src={coverPreview} alt="cover" width={320} height={320} className="w-full h-full object-cover bg-muted-foreground/10" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Belum ada gambar</div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => coverRef.current?.click()} className="w-fit rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground">
              <ImageIcon className="w-4 h-4" />
              {coverPreview ? 'Ganti Cover' : 'Upload Cover'}
            </Button>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            {coverFile && <p className="text-xs text-muted-foreground">{coverFile.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Deskripsi Singkat</Label>
            <Textarea value={form.detail_short} onChange={(e) => setForm((f) => ({ ...f, detail_short: e.target.value }))} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Deskripsi Lengkap</Label>
            {([0, 1] as const).map((i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Paragraf {i + 1}</span>
                <Textarea
                  value={form.detail_full[i]}
                  onChange={(e) => setForm((f) => { const arr: [string, string] = [...f.detail_full] as [string, string]; arr[i] = e.target.value; return { ...f, detail_full: arr } })}
                  rows={3}
                  placeholder={`Paragraf ${i + 1}`}
                  className="resize-none text-sm"
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSaveMeta} disabled={saving || !isDirty} className="rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground w-full disabled:bg-muted-foreground/10">
            {saving ? <Spinner className="shrink-0 text-foreground" /> : <FloppyDiskIcon className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>

        {/* ── Steps Table ── */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Steps ({steps.length})
            </h3>
            <Button
              size="sm"
              onClick={() => setAddStepOpen(true)}
              className="rounded-sm gap-1.5 [&_svg]:size-3.5 bg-background hover:bg-lemon text-foreground"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Tambah Step
            </Button>
          </div>

          <div className="border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12 text-center">Step</TableHead>
                  <TableHead className="w-16">Gambar</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="w-20 text-center">Durasi</TableHead>
                  <TableHead className="text-center w-28">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell className="text-center font-semibold text-sm text-muted-foreground">
                      {step.step_number}
                    </TableCell>
                    <TableCell>
                      {step.image_url ? (
                        <Image src={step.image_url} alt={step.title ?? `Step ${step.step_number}`} width={48} height={48} className="w-12 h-12 object-cover border border-border rounded-sm bg-muted-foreground/10" unoptimized />
                      ) : (
                        <div className="w-12 h-12 bg-muted border border-border rounded-sm flex items-center justify-center text-xs text-muted-foreground">—</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{step.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-60">
                      <span className="line-clamp-1 truncate">{step.description}</span>
                    </TableCell>
                    <TableCell className="text-center text-sm">{step.duration_seconds}s</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-sm gap-1 bg-background hover:bg-celeste text-foreground [&_svg]:size-3.5 px-2"
                          onClick={() => { setEditingStep(step); setStepEditorOpen(true) }}
                        >
                          <PencilSimpleIcon className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-sm gap-1 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive [&_svg]:size-3.5 px-2"
                          onClick={() => { setDeletingStep(step); setDeleteStepOpen(true) }}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {steps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                      Belum ada step. Klik Tambah Step untuk memulai.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <StepEditorDialog
        step={editingStep}
        open={stepEditorOpen}
        onSave={handleSaveStep}
        onClose={() => { setStepEditorOpen(false); setEditingStep(null) }}
      />

      <AddStepDialog
        sessionId={session.id}
        nextStepNumber={steps.length + 1}
        open={addStepOpen}
        onAdded={handleStepAdded}
        onClose={() => setAddStepOpen(false)}
      />

      <DeleteStepDialog
        step={deletingStep}
        open={deleteStepOpen}
        remainingSteps={steps}
        onDeleted={handleStepDeleted}
        onClose={() => { setDeleteStepOpen(false); setDeletingStep(null) }}
      />
    </div>
  )
}

// ─── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({ session, onClick }: { session: SessionRecord; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2.5 p-3.5 bg-white border border-border hover:border-muted-foreground/40 hover:shadow-sm transition-all text-left rounded-sm group w-full"
    >
      <div className="flex items-start gap-3 w-full">
        <div className="w-14 h-14 rounded-sm overflow-hidden border border-border bg-muted shrink-0">
          {session.image_cover_url ? (
            <Image src={session.image_cover_url} alt={session.session_name} width={48} height={48} className="w-full h-full object-cover bg-muted-foreground/10" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xs text-muted-foreground">—</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <p className="font-semibold text-base leading-snug line-clamp-2 group-hover:underline underline-offset-2">{session.session_name}</p>
          <Badge variant="secondary" className="w-fit text-xs">{session.steps.length} steps</Badge>
        </div>
      </div>
      <p className="text-sm/4.5 text-muted-foreground line-clamp-2">{session.detail_short}</p>
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

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
          .select(`id, slug, session_name, detail_short, detail_full, image_cover_url, sort_order, session_steps (id, step_number, title, description, duration_seconds, image_url, audio_url)`)
          .order('sort_order', { ascending: true })

        if (error) { console.error('Failed to load sessions:', error); setSessions([]); return }

        const mapped: SessionRecord[] = ((data ?? []) as SessionRaw[]).map((s) => ({
          id: s.id, slug: s.slug, session_name: s.session_name, detail_short: s.detail_short,
          detail_full: s.detail_full ?? [], image_cover_url: s.image_cover_url ?? '',
          steps: [...(s.session_steps ?? [])].sort((a, b) => a.step_number - b.step_number),
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

  if (loading) return <AdminSkeleton />

  if (activeSession) {
    return (
      <SessionDetailView
        session={activeSession}
        onBack={() => setActiveSession(null)}
        onSessionUpdated={handleSessionUpdated}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Kelola Sesi Terapi</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{sessions.length} sesi tersedia</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} onClick={() => setActiveSession(s)} />
        ))}
      </div>
    </div>
  )
}