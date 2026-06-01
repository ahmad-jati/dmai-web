'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
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
} from "@phosphor-icons/react"
import { Badge } from "../ui/badge"
import Image from "next/image"

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Skeleton Components ──────────────────────────────────────────────────────

function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-6 bg-muted rounded w-56" />
        <div className="h-3.5 bg-muted/60 rounded w-40" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-5 bg-white border border-border rounded-md animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-3 bg-muted rounded" />
                <div className="h-3.5 bg-muted rounded w-32" />
              </div>
              <div className="h-5 bg-muted rounded-full w-16" />
            </div>
            <div className="pl-7 flex flex-col gap-1.5">
              <div className="h-2.5 bg-muted/60 rounded w-full" />
              <div className="h-2.5 bg-muted/50 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepsTableSkeleton() {
  return (
    <div className="border border-border animate-pulse">
      <div className="h-10 bg-muted/40 border-b border-border" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
          <div className="w-8 h-3 bg-muted rounded" />
          <div className="w-12 h-12 bg-muted rounded-md shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-2.5 bg-muted/60 rounded w-2/3" />
          </div>
          <div className="w-16 h-3 bg-muted rounded" />
          <div className="w-16 h-7 bg-muted rounded-sm" />
        </div>
      ))}
    </div>
  )
}

// ─── Session Metadata Editor Dialog ──────────────────────────────────────────

type SessionMeta = {
  session_name: string
  slug: string
  detail_short: string
  detail_full: string[]
  image_cover_url: string
}

function SessionMetaEditorDialog({
  session,
  open,
  onSave,
  onClose,
}: {
  session: SessionRecord | null
  open: boolean
  onSave: (updated: SessionMeta & { id: string }) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<SessionMeta>({
    session_name: '',
    slug: '',
    detail_short: '',
    detail_full: [''],
    image_cover_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session) {
      setForm({
        session_name: session.session_name,
        slug: session.slug,
        detail_short: session.detail_short,
        detail_full: session.detail_full.length > 0 ? [...session.detail_full] : [''],
        image_cover_url: session.image_cover_url ?? '',
      })
      setCoverFile(null)
    }
  }, [session])

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setForm((f) => ({ ...f, image_cover_url: URL.createObjectURL(file) }))
    }
  }

  const handleDetailFullChange = (index: number, value: string) => {
    setForm((f) => {
      const arr = [...f.detail_full]
      arr[index] = value
      return { ...f, detail_full: arr }
    })
  }

  const addParagraph = () => {
    setForm((f) => ({ ...f, detail_full: [...f.detail_full, ''] }))
  }

  const removeParagraph = (index: number) => {
    setForm((f) => ({
      ...f,
      detail_full: f.detail_full.filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    const supabase = createClient()
    let finalCoverUrl = form.image_cover_url

    if (coverFile) {
      const ext = coverFile.name.split('.').pop()
      const path = `sessions/${session.id}/cover.${ext}`
      const { error: upErr } = await supabase.storage
        .from('session-assets')
        .upload(path, coverFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('session-assets').getPublicUrl(path)
        finalCoverUrl = urlData.publicUrl
      }
    }

    await onSave({
      id: session.id,
      ...form,
      image_cover_url: finalCoverUrl,
      detail_full: form.detail_full.filter((p) => p.trim() !== ''),
    })
    setSaving(false)
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Sesi — {session.session_name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Session name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meta-name">Nama Sesi</Label>
            <Input
              id="meta-name"
              value={form.session_name}
              onChange={(e) => setForm((f) => ({ ...f, session_name: e.target.value }))}
              disabled
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meta-slug">
              Slug
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">(URL identifier)</span>
            </Label>
            <Input
              id="meta-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              className="font-mono text-sm"
              disabled
            />
          </div>

          {/* Detail short */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meta-short">Deskripsi Singkat</Label>
            <Input
              id="meta-short"
              value={form.detail_short}
              onChange={(e) => setForm((f) => ({ ...f, detail_short: e.target.value }))}
            />
          </div>

          {/* Detail full paragraphs */}
          <div className="flex flex-col gap-2">
            {/* <div className="flex items-center justify-between">
              <Label>Deskripsi Lengkap</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addParagraph}
                className="h-7 px-2 gap-1.5 text-xs [&_svg]:size-3 text-muted-foreground hover:text-foreground"
              >
                <PlusIcon />
                Tambah Paragraf
              </Button>
            </div> */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta-short">Deskripsi Panjang (Untuk detail session)</Label>
              {form.detail_full.map((para, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Textarea
                    value={para}
                    onChange={(e) => handleDetailFullChange(i, e.target.value)}
                    rows={3}
                    placeholder={`Paragraf ${i + 1}`}
                    className="resize-none text-sm flex-1"
                  />
                  {form.detail_full.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParagraph(i)}
                      className="h-8 w-8 p-0 shrink-0 mt-0.5 [&_svg]:size-3.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <TrashIcon />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cover image */}
          <div className="flex flex-col gap-2">
            <Label>Gambar Cover</Label>
            <div className="flex items-center gap-4">
              {form.image_cover_url && (
                <Image
                  src={form.image_cover_url}
                  alt="cover preview"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover border border-border rounded-md shrink-0"
                />
              )}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground truncate max-w-48">
                  {coverFile?.name ?? (form.image_cover_url ? 'File saat ini' : 'Belum ada gambar')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => coverRef.current?.click()}
                  className="w-fit rounded-md gap-2 [&_svg]:size-4 hover:bg-celeste"
                >
                  <ImageIcon className="w-4 h-4" />
                  {form.image_cover_url ? 'Ganti Cover' : 'Upload Cover'}
                </Button>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-md text-sm hover:bg-destructive/20"
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md gap-2 text-sm [&_svg]:size-4 bg-celeste"
          >
            {saving ? <Spinner className="shrink-0" /> : <FloppyDiskIcon className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Step Editor Dialog ───────────────────────────────────────────────────────

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
  const imageRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step) {
      setForm({ ...step })
      setImageFile(null)
      setAudioFile(null)
    }
  }, [step])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && form) {
      setImageFile(file)
      setForm((f) => f ? ({ ...f, image_url: URL.createObjectURL(file) }) : f)
    }
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && form) {
      setAudioFile(file)
      setForm((f) => f ? ({ ...f, audio_url: file.name }) : f)
    }
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
      const { error: upErr } = await supabase.storage
        .from('session-assets')
        .upload(path, imageFile, { upsert: true })
      if (!upErr) {
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
      if (!upErr) {
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
        className="max-w-xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Step {form.step_number}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="step-title">Nama Step</Label>
            <Input
              id="step-title"
              value={form.title}
              onChange={(e) => setForm((f) => f ? ({ ...f, title: e.target.value }) : f)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="step-desc">Instruksi</Label>
            <Textarea
              id="step-desc"
              value={form.description}
              onChange={(e) => setForm((f) => f ? ({ ...f, description: e.target.value }) : f)}
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
              onChange={(e) => setForm((f) => f ? ({ ...f, duration_seconds: Number(e.target.value) }) : f)}
            />
          </div>

          {/* Image */}
          <div className="flex flex-col gap-2">
            <Label>Gambar</Label>
            <div className="flex items-center gap-4">
              {form.image_url && (
                <Image
                  src={form.image_url}
                  alt="preview"
                  width={60}
                  height={60}
                  className="w-20 h-20 object-cover border border-border rounded-md shrink-0"
                />
              )}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground truncate max-w-48">
                  {imageFile?.name ?? 'File saat ini'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageRef.current?.click()}
                  className="w-fit rounded-md gap-2 [&_svg]:size-4 hover:bg-celeste"
                >
                  <ImageIcon className="w-4 h-4" />
                  Ganti Gambar
                </Button>
                <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </div>
          </div>

          {/* Audio */}
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
              className="w-fit rounded-md gap-2 [&_svg]:size-3.5 hover:bg-celeste"
            >
              <SpeakerHighIcon className="w-4 h-4" />
              Ganti Audio
            </Button>
            <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioChange} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-md text-sm hover:bg-destructive/20">
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md gap-2 text-sm [&_svg]:size-4 bg-celeste"
          >
            {saving ? <Spinner className="shrink-0" /> : <FloppyDiskIcon className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Session Steps View ───────────────────────────────────────────────────────

function SessionStepsView({
  session,
  onBack,
}: {
  session: SessionRecord
  onBack: (updated: SessionRecord) => void
}) {
  const [steps, setSteps] = useState<SessionStep[]>(session.steps)
  const [editingStep, setEditingStep] = useState<SessionStep | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const handleSaveStep = useCallback(async (updated: SessionStep) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('session_steps')
      .update({
        title: updated.title,
        description: updated.description,
        duration_seconds: updated.duration_seconds,
        image_url: updated.image_url,
        audio_url: updated.audio_url,
      })
      .eq('id', updated.id)

    if (error) {
      toast.error('Gagal menyimpan', { description: error.message })
    } else {
      setSteps((prev) => prev.map((st) => (st.id === updated.id ? updated : st)))
      toast.success('Tersimpan', { description: 'Step berhasil diperbarui.' })
      setEditorOpen(false)
      setEditingStep(null)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <Button
          variant="link"
          size="sm"
          onClick={() => onBack({ ...session, steps })}
          className="[&_svg]:size-3.5 rounded-md gap-2 p-0 text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{session.session_name}</h2>
        </div>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-12 text-center">Step</TableHead>
              <TableHead className="w-20">Gambar</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="w-20 text-center">Durasi</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
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
                    <Image
                      src={step.image_url}
                      alt={step.title ?? `Step ${step.step_number}`}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover border border-border rounded-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted border border-border rounded-md flex items-center justify-center text-xs text-muted-foreground">
                      —
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-sm">{step.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-60">
                  <span className="line-clamp-1 truncate">{step.description}</span>
                </TableCell>
                <TableCell className="text-center text-sm">{step.duration_seconds}s</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm gap-1.5 hover:bg-celeste [&_svg]:size-3.5"
                    onClick={() => { setEditingStep(step); setEditorOpen(true) }}
                  >
                    <PencilSimpleIcon className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StepEditorDialog
        step={editingStep}
        open={editorOpen}
        onSave={handleSaveStep}
        onClose={() => { setEditorOpen(false); setEditingStep(null) }}
      />
    </div>
  )
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({
  session,
  index,
  onClick,
  onEdit,
}: {
  session: SessionRecord
  index: number
  onClick: () => void
  onEdit: (e: React.MouseEvent) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 p-5 bg-white border border-border hover:border-muted-foreground/40 hover:shadow-sm transition-all text-left rounded-md group relative">
      {/* Cover image strip */}
      {session.image_cover_url && (
        <div className="w-full h-40 mb-1 rounded-md overflow-hidden border border-border">
          <Image
            src={session.image_cover_url}
            alt={session.session_name}
            width={400}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 w-full">
        <button
          onClick={onClick}
          className="flex items-center gap-2.5 flex-1 text-left hover:underline underline-offset-2"
        >
          <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{index + 1}.</span>
          <p className="font-semibold text-sm">{session.session_name}</p>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={'secondary'}>{session.steps.length} steps</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-6 w-6 p-0 rounded-sm [&_svg]:size-3 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <PencilSimpleIcon />
          </Button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 pl-7">{session.detail_short}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SessionsManager() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<SessionRecord | null>(null)
  const [editingMeta, setEditingMeta] = useState<SessionRecord | null>(null)
  const [metaEditorOpen, setMetaEditorOpen] = useState(false)

  const columns = useMemo(() => {
    const mid = Math.ceil(sessions.length / 2)
    return [sessions.slice(0, mid), sessions.slice(mid)]
  }, [sessions])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            id, slug, session_name, detail_short, detail_full,
            image_cover_url, created_at,
            session_steps (
              id, step_number, title, description,
              duration_seconds, image_url, audio_url
            )
          `)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Failed to load sessions:', error)
          setSessions([])
          return
        }

        const mapped: SessionRecord[] = ((data ?? []) as SessionRaw[]).map((s) => ({
          id: s.id,
          slug: s.slug,
          session_name: s.session_name,
          detail_short: s.detail_short,
          detail_full: s.detail_full ?? [],
          image_cover_url: s.image_cover_url ?? '',
          steps: [...(s.session_steps ?? [])].sort((a, b) => a.step_number - b.step_number),
        }))

        setSessions(mapped)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSaveMeta = useCallback(async (updated: SessionMeta & { id: string }) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('sessions')
      .update({
        session_name: updated.session_name,
        slug: updated.slug,
        detail_short: updated.detail_short,
        detail_full: updated.detail_full,
        image_cover_url: updated.image_cover_url,
      })
      .eq('id', updated.id)

    if (error) {
      toast.error('Gagal menyimpan', { description: error.message })
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === updated.id
            ? {
                ...s,
                session_name: updated.session_name,
                slug: updated.slug,
                detail_short: updated.detail_short,
                detail_full: updated.detail_full,
                image_cover_url: updated.image_cover_url,
              }
            : s
        )
      )
      toast.success('Tersimpan', { description: 'Sesi berhasil diperbarui.' })
      setMetaEditorOpen(false)
      setEditingMeta(null)
    }
  }, [])

  if (loading) return <AdminSkeleton />

  if (activeSession) {
    return (
      <SessionStepsView
        session={activeSession}
        onBack={(updated) => {
          setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
          setActiveSession(null)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold">Kelola Sesi Terapi</h2>
          
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-3">
            {column.map((s, rowIndex) => {
              const displayIndex =
                colIndex === 0 ? rowIndex : columns[0].length + rowIndex
              return (
                <SessionCard
                  key={s.id}
                  session={s}
                  index={displayIndex}
                  onClick={() => setActiveSession(s)}
                  onEdit={(e) => {
                    e.stopPropagation()
                    setEditingMeta(s)
                    setMetaEditorOpen(true)
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      <SessionMetaEditorDialog
        session={editingMeta}
        open={metaEditorOpen}
        onSave={handleSaveMeta}
        onClose={() => { setMetaEditorOpen(false); setEditingMeta(null) }}
      />
    </div>
  )
}