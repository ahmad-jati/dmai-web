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
  TrashIcon,
  PlusIcon,
  FloppyDiskIcon,
  MusicNoteIcon,
  SpeakerHighIcon,
} from "@phosphor-icons/react"

// ─── Types ────────────────────────────────────────────────────────────────────

type MusicRecord = {
  id: string
  title: string
  composer: string
  audio_url: string
  duration_seconds: number
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function MusicSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-muted rounded w-48" />
        <div className="h-8 bg-muted rounded w-32" />
      </div>
      <div className="border border-border">
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/40 border-b border-border">
          {[10, 40, 20, 15, 15].map((w, i) => (
            <div key={i} className={`h-3 bg-muted rounded`} style={{ width: `${w}%` }} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0"
            style={{ animationDelay: `${i * 50}ms` }}>
            <div className="w-8 h-3 bg-muted/60 rounded" />
            <div className="flex-1 h-3 bg-muted rounded" />
            <div className="w-32 h-3 bg-muted/70 rounded" />
            <div className="w-24 h-8 bg-muted/40 rounded-sm" />
            <div className="w-20 h-8 bg-muted/40 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Music Form Dialog (shared for Add + Edit) ───────────────────────────────

type MusicForm = {
  title: string
  composer: string
  duration_seconds: number
  audio_url: string
}

function MusicFormDialog({
  mode,
  initial,
  open,
  onSaved,
  onClose,
}: {
  mode: "add" | "edit"
  initial: MusicRecord | null
  open: boolean
  onSaved: (record: MusicRecord) => void
  onClose: () => void
}) {
  const emptyForm: MusicForm = { title: '', composer: '', duration_seconds: 0, audio_url: '' }
  const [form, setForm] = useState<MusicForm>(emptyForm)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const audioRef = useRef<HTMLInputElement>(null)

  // Sync form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initial) {
        setForm({
          title: initial.title,
          composer: initial.composer,
          duration_seconds: initial.duration_seconds,
          audio_url: initial.audio_url,
        })
      } else {
        setForm(emptyForm)
      }
      setAudioFile(null)
    }
  }, [open, mode, initial])

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioFile(file)

    // Auto-fill duration from the audio file
    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    audio.addEventListener('loadedmetadata', () => {
      setForm((f) => ({ ...f, duration_seconds: Math.round(audio.duration) }))
      URL.revokeObjectURL(url)
    })
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Judul wajib diisi'); return }
    if (!form.composer.trim()) { toast.error('Komposer wajib diisi'); return }
    if (mode === "add" && !audioFile) { toast.error('File audio wajib dipilih'); return }

    setSaving(true)
    const supabase = createClient()
    let finalAudioUrl = form.audio_url

    if (audioFile) {
      const ext = audioFile.name.split('.').pop()
      const safeTitle = form.title.trim().replace(/\s+/g, '-').toLowerCase()
      const path = `music/${safeTitle}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('music')
        .upload(path, audioFile, { upsert: true })
      if (upErr) {
        toast.error('Gagal upload audio', { description: upErr.message })
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('music').getPublicUrl(path)
      finalAudioUrl = urlData.publicUrl
    }

    const payload = {
      title: form.title.trim(),
      composer: form.composer.trim(),
      audio_url: finalAudioUrl,
      duration_seconds: form.duration_seconds,
    }

    if (mode === "add") {
      const { data, error } = await supabase
        .from('background_music')
        .insert(payload)
        .select()
        .single()

      if (error || !data) {
        toast.error('Gagal menambah musik', { description: error?.message })
      } else {
        toast.success('Musik ditambahkan')
        onSaved(data as MusicRecord)
      }
    } else if (mode === "edit" && initial) {
      const { data, error } = await supabase
        .from('background_music')
        .update(payload)
        .eq('id', initial.id)
        .select()
        .single()

      if (error || !data) {
        toast.error('Gagal menyimpan', { description: error?.message })
      } else {
        toast.success('Tersimpan', { description: 'Musik berhasil diperbarui.' })
        onSaved(data as MusicRecord)
      }
    }

    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Tambah Musik Baru" : "Edit Musik"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="music-title">Judul</Label>
            <Input
              id="music-title"
              placeholder="cth. Air on the G String"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="music-composer">Komposer</Label>
            <Input
              id="music-composer"
              placeholder="cth. J. S. Bach"
              value={form.composer}
              onChange={(e) => setForm((f) => ({ ...f, composer: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="music-duration">
              Durasi (detik)
              <span className="ml-1.5 text-muted-foreground font-normal text-xs">
                — otomatis terisi saat upload file
              </span>
            </Label>
            <Input
              id="music-duration"
              type="number"
              min={0}
              value={form.duration_seconds}
              onChange={(e) => setForm((f) => ({ ...f, duration_seconds: Number(e.target.value) }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>File Audio</Label>

            {/* Preview existing audio in edit mode when no new file picked */}
            {mode === "edit" && form.audio_url && !audioFile && (
              <audio controls src={form.audio_url} className="w-full h-10" />
            )}

            {audioFile ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MusicNoteIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{audioFile.name}</span>
                {form.duration_seconds > 0 && (
                  <span className="shrink-0 text-xs">({fmtDuration(form.duration_seconds)})</span>
                )}
              </div>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={() => audioRef.current?.click()}
              className="w-fit rounded-sm gap-2 [&_svg]:size-3.5 bg-background hover:bg-lemon text-foreground"
            >
              <SpeakerHighIcon className="w-4 h-4" />
              {mode === "edit" && form.audio_url ? 'Ganti Audio' : 'Upload Audio'}
            </Button>
            <input
              ref={audioRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudioChange}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-sm text-sm hover:bg-destructive/50">
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-sm gap-2 text-sm [&_svg]:size-4 bg-background hover:bg-lemon text-foreground"
          >
            {saving
              ? <><Spinner className="shrink-0 text-foreground" /> Menyimpan...</>
              : mode === "add"
                ? <><PlusIcon className="w-4 h-4" /> Tambah Musik</>
                : <><FloppyDiskIcon className="w-4 h-4" /> Simpan Perubahan</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteMusicDialog({
  record,
  open,
  onDeleted,
  onClose,
}: {
  record: MusicRecord | null
  open: boolean
  onDeleted: (id: string) => void
  onClose: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!record) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('background_music')
      .delete()
      .eq('id', record.id)

    if (error) {
      const hint = error.code === '42501'
        ? 'Pastikan RLS policy admin sudah diterapkan di Supabase.'
        : error.message
      toast.error('Gagal menghapus', { description: hint })
    } else {
      toast.success('Musik dihapus')
      onDeleted(record.id)
    }
    setDeleting(false)
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Hapus Musik?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{record.title}</span> oleh{' '}
          <span className="font-medium text-foreground">{record.composer}</span> akan dihapus secara permanen.
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-sm text-sm">
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-sm gap-2 text-sm [&_svg]:size-4 bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting
              ? <><Spinner className="shrink-0 text-white" /> Menghapus...</>
              : <><TrashIcon className="w-4 h-4" /> Ya, Hapus</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MusicManager() {
  const [records, setRecords] = useState<MusicRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)

  // Edit dialog
  const [editTarget, setEditTarget] = useState<MusicRecord | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<MusicRecord | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Currently previewing
  const [previewId, setPreviewId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('background_music')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        toast.error('Gagal memuat musik', { description: error.message })
      } else {
        setRecords((data ?? []) as MusicRecord[])
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleAdded = useCallback((record: MusicRecord) => {
    setRecords((prev) => [record, ...prev])
    setAddOpen(false)
  }, [])

  const handleEdited = useCallback((record: MusicRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)))
    setEditOpen(false)
    setEditTarget(null)
  }, [])

  const handleDeleted = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setDeleteOpen(false)
    setDeleteTarget(null)
  }, [])

  const totalDuration = records.reduce((s, r) => s + r.duration_seconds, 0)

  if (loading) return <MusicSkeleton />

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Musik Latar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {records.length} lagu · Total durasi {fmtDuration(totalDuration)}
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          size="sm"
          className="rounded-sm gap-1.5 [&_svg]:size-3.5 bg-background hover:bg-lemon text-foreground"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Tambah Musik
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead className="w-44">Komposer</TableHead>
              <TableHead className="w-24 text-center">Durasi</TableHead>
              <TableHead className="w-28">Ditambahkan</TableHead>
              <TableHead className="w-20 text-center">Preview</TableHead>
              <TableHead className="text-center w-28">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12 text-sm">
                  Belum ada musik. Klik Tambah Musik untuk memulai.
                </TableCell>
              </TableRow>
            ) : (
              records.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell className="text-center text-muted-foreground text-sm">{i + 1}.</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0">
                        <MusicNoteIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{r.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.composer}</TableCell>
                  <TableCell className="text-center text-sm tabular-nums">{fmtDuration(r.duration_seconds)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-sm gap-1 [&_svg]:size-3.5 px-2 hover:bg-muted"
                      onClick={() => setPreviewId(previewId === r.id ? null : r.id)}
                    >
                      <SpeakerHighIcon className="w-3.5 h-3.5" />
                      {previewId === r.id ? 'Tutup' : 'Play'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-sm gap-1 bg-background hover:bg-lemon text-foreground [&_svg]:size-3.5 px-2"
                        onClick={() => { setEditTarget(r); setEditOpen(true) }}
                      >
                        <PencilSimpleIcon className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-sm gap-1 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive [&_svg]:size-3.5 px-2"
                        onClick={() => { setDeleteTarget(r); setDeleteOpen(true) }}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Inline audio preview row */}
      {previewId && (
        <div className="border border-border rounded-sm p-3 bg-muted/30 flex items-center gap-3">
          <MusicNoteIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-sm font-medium truncate">
              {records.find((r) => r.id === previewId)?.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {records.find((r) => r.id === previewId)?.composer}
            </p>
          </div>
          <audio
            controls
            autoPlay
            src={records.find((r) => r.id === previewId)?.audio_url}
            className="flex-1 h-8"
          />
        </div>
      )}

      {/* Dialogs */}
      <MusicFormDialog
        mode="add"
        initial={null}
        open={addOpen}
        onSaved={handleAdded}
        onClose={() => setAddOpen(false)}
      />

      <MusicFormDialog
        mode="edit"
        initial={editTarget}
        open={editOpen}
        onSaved={handleEdited}
        onClose={() => { setEditOpen(false); setEditTarget(null) }}
      />

      <DeleteMusicDialog
        record={deleteTarget}
        open={deleteOpen}
        onDeleted={handleDeleted}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null) }}
      />
    </div>
  )
}