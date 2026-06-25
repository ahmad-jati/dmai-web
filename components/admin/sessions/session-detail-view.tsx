'use client'

import { useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  PencilSimpleIcon,
  ArrowLeftIcon,
  FloppyDiskIcon,
  ImageIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpRightIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { Route } from 'next'
import { StepEditorDialog } from './step-editor-dialog'
import { AddStepDialog } from './add-step-dialog'
import { DeleteStepDialog } from './delete-step-dialog'
import { SessionRecord, SessionStep, SessionMeta, STEP_TYPE_LABELS, STEP_TYPE_COLORS, NarrationSubStep } from './types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse step_config safely — Supabase jsonb columns sometimes return as a JSON string.
 * Always returns a plain object, never a string.
 */
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

/**
 * Strip all File/Blob/runtime-only fields from step_config before sending to DB.
 * Also handles the case where step_config is a JSON string (Supabase jsonb quirk).
 */
function sanitizeStepConfig(config: unknown): Record<string, unknown> {
  const obj = parseStepConfig(config)
  const strip = (val: unknown): unknown => {
    if (val instanceof File || val instanceof Blob) return undefined
    if (Array.isArray(val)) return val.map(strip).filter((v) => v !== undefined)
    if (val !== null && typeof val === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (['audio_file', 'image_file', 'image_preview', 'audio_preview'].includes(k)) continue
        const stripped = strip(v)
        if (stripped !== undefined) out[k] = stripped
      }
      return out
    }
    return val
  }
  return strip(obj) as Record<string, unknown>
}

// ─── Delete Session Dialog ─────────────────────────────────────────────────────

function DeleteSessionDialog({
  session,
  open,
  onDeleted,
  onClose,
}: {
  session: SessionRecord
  open: boolean
  onDeleted: () => void
  onClose: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()

    // Delete all steps first (FK constraint)
    await supabase.from('session_steps').delete().eq('session_id', session.id)
    const { error } = await supabase.from('sessions').delete().eq('id', session.id)

    if (error) {
      toast.error('Gagal menghapus sesi', { description: error.message })
      setDeleting(false)
      return
    }

    toast.success('Sesi dihapus')
    onDeleted()
  }

  const slugMatch = confirm === session.slug

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setConfirm('') } }}>
      <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <WarningCircleIcon weight="fill" className="w-5 h-5" />
            Hapus Sesi?
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Sesi <span className="font-semibold text-foreground">{session.session_name}</span> dan
            semua stepnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              Ketik <span className="font-mono font-semibold text-foreground">{session.slug}</span> untuk konfirmasi
            </Label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={session.slug}
              className="text-sm font-mono"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onClose(); setConfirm('') }} className="rounded-sm text-sm">
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting || !slugMatch}
            className="rounded-sm gap-2 text-sm [&_svg]:size-4 bg-destructive text-white hover:bg-destructive/90 disabled:opacity-40"
          >
            {deleting ? <Spinner className="shrink-0 text-white" /> : <TrashIcon className="w-4 h-4" />}
            {deleting ? 'Menghapus...' : 'Ya, Hapus Sesi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sessionToMeta(session: SessionRecord): SessionMeta {
  return {
    session_name: session.session_name,
    slug: session.slug,
    detail_short: session.detail_short,
    detail_full: [session.detail_full[0] ?? '', session.detail_full[1] ?? ''],
    image_cover_url: session.image_cover_url ?? '',
    week_number: session.week_number?.toString() ?? '',
    duration: session.duration ?? '',
    total_instruction: session.total_instruction?.toString() ?? '',
  }
}

function metaChanged(original: SessionRecord, form: SessionMeta, coverFile: File | null): boolean {
  if (coverFile) return true
  if (form.session_name !== original.session_name) return true
  if (form.slug !== original.slug) return true
  if (form.detail_short !== original.detail_short) return true
  if (form.detail_full[0] !== (original.detail_full[0] ?? '')) return true
  if (form.detail_full[1] !== (original.detail_full[1] ?? '')) return true
  if (form.week_number !== (original.week_number?.toString() ?? '')) return true
  if (form.duration !== (original.duration ?? '')) return true
  if (form.total_instruction !== (original.total_instruction?.toString() ?? '')) return true
  return false
}

// ─── Main component ────────────────────────────────────────────────────────────

interface SessionDetailViewProps {
  session: SessionRecord
  onBack: () => void
  onSessionUpdated: (updated: SessionRecord) => void
  onSessionDeleted: (id: string) => void
}

export function SessionDetailView({
  session,
  onBack,
  onSessionUpdated,
  onSessionDeleted,
}: SessionDetailViewProps) {
  const [steps, setSteps] = useState<SessionStep[]>(session.steps)

  const [editingStep, setEditingStep] = useState<SessionStep | null>(null)
  const [stepEditorOpen, setStepEditorOpen] = useState(false)
  const [addStepOpen, setAddStepOpen] = useState(false)
  const [deletingStep, setDeletingStep] = useState<SessionStep | null>(null)
  const [deleteStepOpen, setDeleteStepOpen] = useState(false)
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false)

  const [form, setForm] = useState<SessionMeta>(() => sessionToMeta(session))
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>(session.image_cover_url ?? '')
  const [saving, setSaving] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null!)

  const isDirty = metaChanged(session, form, coverFile)

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveMeta = async () => {
    setSaving(true)
    const supabase = createClient()
    let finalCoverUrl = session.image_cover_url

    if (coverFile) {
      const ext = coverFile.name.split('.').pop()
      const path = `sessions/${session.id}/cover.${ext}`
      const { error: upErr } = await supabase.storage
        .from('session-assets')
        .upload(path, coverFile, { upsert: true })
      if (upErr) {
        toast.error('Gagal upload cover', { description: upErr.message })
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('session-assets').getPublicUrl(path)
      finalCoverUrl = urlData.publicUrl
    }

    const cleanedDetailFull = form.detail_full.filter((p) => p.trim() !== '')
    const { data: savedSession, error } = await supabase
      .from('sessions')
      .update({
        session_name: form.session_name,
        slug: form.slug,
        detail_short: form.detail_short,
        detail_full: cleanedDetailFull,
        image_cover_url: finalCoverUrl,
        week_number: form.week_number ? Number(form.week_number) : null,
        duration: form.duration || null,
        total_instruction: form.total_instruction ? Number(form.total_instruction) : null,
      })
      .eq('id', session.id)
      .select()
      .single()

    if (error) {
      toast.error('Gagal menyimpan', { description: error.message })
    } else {
      const updatedSession: SessionRecord = {
        ...session,
        session_name: form.session_name,
        slug: form.slug,
        detail_short: form.detail_short,
        detail_full: cleanedDetailFull,
        image_cover_url: finalCoverUrl,
        week_number: form.week_number ? Number(form.week_number) : null,
        duration: form.duration || null,
        total_instruction: form.total_instruction ? Number(form.total_instruction) : null,
        steps,
      }
      onSessionUpdated(updatedSession)
      setCoverFile(null)
      setCoverPreview(finalCoverUrl)
      toast.success('Tersimpan', { description: 'Sesi berhasil diperbarui.' })
    }
    setSaving(false)
  }

  const handleSaveStep = useCallback(async (updated: SessionStep) => {
    const supabase = createClient()

    // Parse step_config — Supabase jsonb can come back as a string
    const parsedConfig = parseStepConfig(updated.step_config)

    // Merge in any sub-steps already on the form (they live in the parsed config)
    let finalConfig = sanitizeStepConfig(parsedConfig)

    if (updated.step_type === 'narration' && Array.isArray(parsedConfig.sub_steps)) {
      const uploadedSubSteps = await Promise.all(
        (parsedConfig.sub_steps as NarrationSubStep[]).map(async (sub, i) => {
          let audioUrl = sub.audio_url ?? ''
          let imageUrl = sub.image_url ?? ''

          if (sub.audio_file instanceof File) {
            const ext = sub.audio_file.name.split('.').pop()
            const path = `steps/${updated.id}/sub_${i}_audio.${ext}`
            const { error } = await supabase.storage
              .from('session-assets')
              .upload(path, sub.audio_file, { upsert: true })
            if (!error) {
              const { data } = supabase.storage.from('session-assets').getPublicUrl(path)
              audioUrl = data.publicUrl
            } else {
              console.error('[upload sub audio]', error)
            }
          }

          if (sub.image_file instanceof File) {
            const ext = sub.image_file.name.split('.').pop()
            const path = `steps/${updated.id}/sub_${i}_image.${ext}`
            const { error } = await supabase.storage
              .from('session-assets')
              .upload(path, sub.image_file, { upsert: true })
            if (!error) {
              const { data } = supabase.storage.from('session-assets').getPublicUrl(path)
              imageUrl = data.publicUrl
            } else {
              console.error('[upload sub image]', error)
            }
          }

          const { audio_file, image_file, image_preview, audio_preview, ...rest } = sub
          return { ...rest, audio_url: audioUrl, image_url: imageUrl }
        })
      )
      finalConfig = { ...finalConfig, sub_steps: uploadedSubSteps }
    }

    const { error } = await supabase
      .from('session_steps')
      .update({
        title: updated.title,
        description: updated.description,
        duration_seconds: updated.duration_seconds,
        image_url: updated.image_url ?? '',
        audio_url: updated.audio_url ?? '',
        step_type: updated.step_type,
        step_config: finalConfig,
      })
      .eq('id', updated.id)
      .select()
      .single()

    if (error) {
      console.error('[handleSaveStep] update error:', error)
      toast.error('Gagal menyimpan step', {
        description: error.code === '42501'
          ? 'Tidak ada izin. Pastikan RLS policy admin sudah diterapkan.'
          : error.message,
      })
    } else {
      setSteps((prev) => prev.map((st) =>
        st.id === updated.id ? { ...updated, step_config: finalConfig } : st
      ))
      toast.success('Tersimpan', { description: 'Step berhasil diperbarui.' })
      setStepEditorOpen(false)
      setEditingStep(null)
    }
  }, [])

  const handleStepAdded = useCallback((step: SessionStep) => {
    setSteps((prev) => [...prev, step].sort((a, b) => a.step_number - b.step_number))
    setAddStepOpen(false)
  }, [])

  const handleStepDeleted = useCallback(
    (id: string, renumbered: { id: string; step_number: number }[]) => {
      setSteps((prev) => {
        const filtered = prev.filter((s) => s.id !== id)
        const numMap = new Map(renumbered.map((r) => [r.id, r.step_number]))
        return filtered
          .map((s) => ({ ...s, step_number: numMap.get(s.id) ?? s.step_number }))
          .sort((a, b) => a.step_number - b.step_number)
      })
      setDeleteStepOpen(false)
      setDeletingStep(null)
    },
    []
  )

  return (
    <div className="flex flex-col gap-8">
      <Button
        variant="link"
        size="sm"
        onClick={onBack}
        className="[&_svg]:size-3.5 rounded-sm gap-2 p-0 text-sm w-fit"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Kembali
      </Button>

      <div className="flex gap-8 items-start">
        {/* ── Meta Edit Form ── */}
        <div className="flex flex-col gap-5 w-80 shrink-0">
          <Link
            href={`/session/${session.slug}` as Route}
            className="text-2xl font-semibold flex items-center gap-3 group hover:underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {session.session_name}
            <ArrowUpRightIcon className="w-4 h-4 group-hover:inline hidden" />
          </Link>

          <div className="flex flex-col gap-2">
            <Label>Gambar Cover</Label>
            <div className="w-full aspect-square rounded-sm overflow-hidden border border-border bg-muted">
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt="cover"
                  width={320}
                  height={320}
                  className="w-full h-full object-cover bg-muted-foreground/10"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Belum ada gambar
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => coverRef.current?.click()}
              className="w-fit rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground"
            >
              <ImageIcon className="w-4 h-4" />
              {coverPreview ? 'Ganti Cover' : 'Upload Cover'}
            </Button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
            {coverFile && <p className="text-xs text-muted-foreground">{coverFile.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Week</Label>
              <Input
                type="number"
                value={form.week_number}
                onChange={(e) => setForm((f) => ({ ...f, week_number: e.target.value }))}
                placeholder="e.g. 1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Durasi</Label>
              <Input
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                placeholder="e.g. 15 menit"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Total Instruksi</Label>
            <Input
              type="number"
              value={form.total_instruction}
              onChange={(e) => setForm((f) => ({ ...f, total_instruction: e.target.value }))}
              placeholder="e.g. 5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Deskripsi Singkat</Label>
            <Textarea
              value={form.detail_short}
              onChange={(e) => setForm((f) => ({ ...f, detail_short: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Deskripsi Lengkap</Label>
            {([0, 1] as const).map((i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Paragraf {i + 1}</span>
                <Textarea
                  value={form.detail_full[i]}
                  onChange={(e) =>
                    setForm((f) => {
                      const arr: [string, string] = [...f.detail_full] as [string, string]
                      arr[i] = e.target.value
                      return { ...f, detail_full: arr }
                    })
                  }
                  rows={3}
                  placeholder={`Paragraf ${i + 1}`}
                  className="resize-none text-sm"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleSaveMeta}
            disabled={saving || !isDirty}
            className="rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground w-full disabled:bg-muted-foreground/10"
          >
            {saving ? (
              <Spinner className="shrink-0 text-foreground" />
            ) : (
              <FloppyDiskIcon className="w-4 h-4" />
            )}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setDeleteSessionOpen(true)}
            className="rounded-sm gap-2 [&_svg]:size-4 w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
          >
            <TrashIcon className="w-4 h-4" />
            Hapus Sesi Ini
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
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead className="w-36">Tipe</TableHead>
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
                    <TableCell className="font-medium text-sm">{step.title}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-xs font-medium ${
                          STEP_TYPE_COLORS[step.step_type ?? 'narration']
                        }`}
                      >
                        {STEP_TYPE_LABELS[step.step_type ?? 'narration']}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm">{step.duration_seconds}s</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-sm gap-1 bg-background hover:bg-celeste text-foreground [&_svg]:size-3.5 px-2"
                          onClick={() => {
                            setEditingStep(step)
                            setStepEditorOpen(true)
                          }}
                        >
                          <PencilSimpleIcon className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-sm gap-1 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive [&_svg]:size-3.5 px-2"
                          onClick={() => {
                            setDeletingStep(step)
                            setDeleteStepOpen(true)
                          }}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {steps.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8 text-sm"
                    >
                      Belum ada step. Klik Tambah Step untuk memulai.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <StepEditorDialog
        step={editingStep}
        open={stepEditorOpen}
        onSave={handleSaveStep}
        onClose={() => {
          setStepEditorOpen(false)
          setEditingStep(null)
        }}
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
        onClose={() => {
          setDeleteStepOpen(false)
          setDeletingStep(null)
        }}
      />

      <DeleteSessionDialog
        session={session}
        open={deleteSessionOpen}
        onDeleted={() => {
          onSessionDeleted(session.id)
          onBack()
        }}
        onClose={() => setDeleteSessionOpen(false)}
      />
    </div>
  )
}