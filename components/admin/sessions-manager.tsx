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
  DatabaseIcon,
} from "@phosphor-icons/react"

// ─── Types ──────────────────────────────────────────────────────────────────

type SessionStep = {
  id: string
  step_number: number
  title: string
  description: string
  duration_seconds: number
  image_url: string
  audio_url: string
}

type SessionStepRaw = SessionStep

type SessionRecord = {
  id: string
  slug: string
  session_name: string
  detail_short: string
  steps: SessionStep[]
}

type SessionRaw = {
  id: string
  slug: string
  session_name: string
  detail_short: string
  session_steps: SessionStepRaw[]
}

// ─── Step Editor Dialog ──────────────────────────────────────────────────────

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
      const ext = imageFile.name.split(".").pop()
      const path = `steps/${form.id}/image.${ext}`
      const { error: upErr } = await supabase.storage
        .from("session-assets")
        .upload(path, imageFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("session-assets").getPublicUrl(path)
        finalImageUrl = urlData.publicUrl
      }
    }

    if (audioFile) {
      const ext = audioFile.name.split(".").pop()
      const path = `steps/${form.id}/audio.${ext}`
      const { error: upErr } = await supabase.storage
        .from("session-assets")
        .upload(path, audioFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("session-assets").getPublicUrl(path)
        finalAudioUrl = urlData.publicUrl
      }
    }

    await onSave({ ...form, image_url: finalImageUrl, audio_url: finalAudioUrl })
    setSaving(false)
  }

  if (!form) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Step {form.step_number}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="step-title">Judul</Label>
            <Input
              id="step-title"
              value={form.title}
              onChange={(e) => setForm((f) => f ? ({ ...f, title: e.target.value }) : f)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="step-desc">Deskripsi / Instruksi</Label>
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
              className="w-40"
            />
          </div>

          {/* Image */}
          <div className="flex flex-col gap-2">
            <Label>Gambar</Label>
            <div className="flex items-center gap-4">
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="preview"
                  className="w-20 h-20 object-cover border border-border"
                />
              )}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground truncate max-w-48">
                  {imageFile?.name ?? "File saat ini"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageRef.current?.click()}
                  className="w-fit rounded-md gap-2"
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
              className="w-fit rounded-md gap-2"
            >
              <SpeakerHighIcon className="w-4 h-4" />
              Ganti Audio
            </Button>
            <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioChange} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-md">
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-md gap-2">
            {saving ? <Spinner className="shrink-0" /> : <FloppyDiskIcon className="w-4 h-4" />}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Session Steps View (table) ──────────────────────────────────────────────

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
      .from("session_steps")
      .update({
        title: updated.title,
        description: updated.description,
        duration_seconds: updated.duration_seconds,
        image_url: updated.image_url,
        audio_url: updated.audio_url,
      })
      .eq("id", updated.id)

    if (error) {
      toast.error("Gagal menyimpan", { description: error.message })
    } else {
      setSteps((prev) => prev.map((st) => (st.id === updated.id ? updated : st)))
      toast.success("Tersimpan", { description: "Step berhasil diperbarui." })
      setEditorOpen(false)
      setEditingStep(null)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBack({ ...session, steps })}
          className="rounded-md gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Semua Sesi
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{session.session_name}</h2>
          <p className="text-sm text-muted-foreground">{steps.length} steps · <span className="font-mono">{session.slug}</span></p>
        </div>
      </div>

      {/* Steps table */}
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-12 text-center">Step</TableHead>
              <TableHead className="w-16">Gambar</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="w-20 text-center">Durasi</TableHead>
              <TableHead className="w-16 text-center">Audio</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {steps.map((step) => (
              <TableRow key={step.id}>
                <TableCell className="text-center font-semibold text-sm">
                  {step.step_number}
                </TableCell>
                <TableCell>
                  {step.image_url
                    ? <img src={step.image_url} alt="" className="w-12 h-12 object-cover border border-border" />
                    : <div className="w-12 h-12 bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">—</div>
                  }
                </TableCell>
                <TableCell className="font-medium text-sm">{step.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-60">
                  <span className="line-clamp-2">{step.description}</span>
                </TableCell>
                <TableCell className="text-center text-sm">{step.duration_seconds}s</TableCell>
                <TableCell className="text-center">
                  {step.audio_url
                    ? <SpeakerHighIcon className="w-4 h-4 text-muted-foreground mx-auto" />
                    : <span className="text-muted-foreground text-xs">—</span>
                  }
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md gap-1.5"
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

// ─── Session Card ────────────────────────────────────────────────────────────

function SessionCard({
  session,
  index,
  onClick,
}: {
  session: SessionRecord
  index: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 p-5 bg-background border border-border hover:border-foreground hover:shadow-sm transition-all text-left group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-muted-foreground w-5">{index + 1}.</span>
          <p className="font-semibold text-sm">{session.session_name}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
          {session.steps.length} steps
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 pl-7">{session.detail_short}</p>

      {/* Slug + CTA */}
      <div className="flex items-center justify-between pl-7">
        <span className="text-xs font-mono text-muted-foreground">{session.slug}</span>
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
          Edit steps
          <PencilSimpleIcon className="w-3 h-3" />
        </span>
      </div>
    </button>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SessionsManager() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<SessionRecord | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("sessions")
        .select(`
          id, slug, session_name, detail_short,
          session_steps (
            id, step_number, title, description,
            duration_seconds, image_url, audio_url
          )
        `)
        .order("created_at")

      const mapped: SessionRecord[] = ((data ?? []) as SessionRaw[]).map((s) => ({
        id: s.id,
        slug: s.slug,
        session_name: s.session_name,
        detail_short: s.detail_short,
        steps: (s.session_steps ?? []).sort(
          (a, b) => a.step_number - b.step_number
        ),
      }))

      setSessions(mapped)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted animate-pulse border border-border" />
        ))}
      </div>
    )
  }

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
        <DatabaseIcon className="w-5 h-5 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">Kelola Sesi Terapi</h2>
          <p className="text-sm text-muted-foreground">Pilih sesi untuk mengedit step-nya</p>
        </div>
      </div>

      {/* Session cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {sessions.map((s, i) => (
          <SessionCard
            key={s.id}
            session={s}
            index={i}
            onClick={() => setActiveSession(s)}
          />
        ))}
      </div>
    </div>
  )
}