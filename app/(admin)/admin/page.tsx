'use client'

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  UsersIcon,
  DatabaseIcon,
  SignOutIcon,
  EnvelopeIcon,
  MagicWandIcon,
  CheckCircleIcon,
  WarningIcon,
  PencilSimpleIcon,
  XIcon,
  ImageIcon,
  SpeakerHighIcon,
  ArrowLeftIcon,
  FloppyDiskIcon,
  SpinnerIcon,
} from "@phosphor-icons/react"

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRecord = {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

type SessionStep = {
  id: string
  step_number: number
  title: string
  description: string
  duration_seconds: number
  image_url: string
  audio_url: string
}

type SessionStepRaw = {
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
  steps: SessionStep[]
}

type SessionRaw = {
  id: string
  slug: string
  session_name: string
  detail_short: string
  session_steps: SessionStepRaw[]
}

type Toast = { type: "success" | "error"; message: string } | null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit",
  })
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastBanner({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [toast, onClose])

  if (!toast) return null

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border font-medium text-sm shadow-lg
      ${toast.type === "success"
        ? "bg-green-soft border-foreground text-foreground"
        : "bg-red/20 border-red text-foreground"}`}
    >
      {toast.type === "success"
        ? <CheckCircleIcon weight="fill" className="w-5 h-5 text-green" />
        : <WarningIcon weight="fill" className="w-5 h-5 text-red" />}
      {toast.message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ onToast }: { onToast: (t: Toast) => void }) {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false })
      setUsers((data as UserRecord[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const sendResetLink = async (email: string, userId: string) => {
    setSending(userId)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw error
      onToast({ type: "success", message: `Reset password dikirim ke ${email}` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengirim link"
      onToast({ type: "error", message })
    }
    setSending(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2 font-semibold">Pengguna Terdaftar</h2>
        <p className="text-sm text-muted-foreground mt-1">{users.length} pengguna ditemukan</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <UsersIcon className="w-12 h-12 opacity-30" />
          <p>Belum ada pengguna terdaftar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1.5fr_2fr_1.5fr_auto] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Nama</span>
            <span>Email</span>
            <span>Terdaftar</span>
            <span>Aksi</span>
          </div>
          {users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[1.5fr_2fr_1.5fr_auto] gap-4 items-center px-4 py-3 rounded-2xl bg-background border border-border hover:border-foreground/40 transition-colors"
            >
              <p className="font-medium text-sm truncate">
                {u.full_name ?? <span className="text-muted-foreground italic">—</span>}
              </p>
              <div className="flex items-center gap-2 min-w-0">
                <EnvelopeIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-sm truncate">{u.email}</p>
              </div>
              <div>
                <p className="text-sm">{fmtDate(u.created_at)}</p>
                <p className="text-xs text-muted-foreground">{fmtTime(u.created_at)}</p>
              </div>
              <button
                onClick={() => sendResetLink(u.email, u.id)}
                disabled={sending === u.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lavender border border-foreground/20 hover:border-foreground/60 text-xs font-medium transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {sending === u.id
                  ? <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                  : <MagicWandIcon className="w-3.5 h-3.5" />}
                Reset Password
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step Editor Modal ────────────────────────────────────────────────────────

function StepEditor({
  step,
  onSave,
  onClose,
}: {
  step: SessionStep
  onSave: (updated: SessionStep) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<SessionStep>({ ...step })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setForm((f) => ({ ...f, image_url: URL.createObjectURL(file) }))
    }
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
      setForm((f) => ({ ...f, audio_url: file.name }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    let finalImageUrl = form.image_url
    let finalAudioUrl = form.audio_url

    if (imageFile) {
      const ext = imageFile.name.split(".").pop()
      const path = `steps/${step.id}/image.${ext}`
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
      const path = `steps/${step.id}/audio.${ext}`
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

  return (
    <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-background border border-foreground rounded-5xl p-8 flex flex-col gap-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-h2 font-semibold">Edit Step {step.step_number}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Judul</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Deskripsi / Instruksi</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Durasi (detik)</span>
            <input
              type="number"
              value={form.duration_seconds}
              onChange={(e) => setForm((f) => ({ ...f, duration_seconds: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Gambar</span>
            <div className="flex items-center gap-4">
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded-xl border border-border"
                />
              )}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{imageFile?.name ?? "File saat ini"}</p>
                <button
                  onClick={() => imageRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-input text-sm hover:border-foreground transition-colors w-fit"
                >
                  <ImageIcon className="w-4 h-4" />
                  Ganti Gambar
                </button>
                <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Audio Narasi</span>
            <div className="flex flex-col gap-1.5">
              {(form.audio_url && !audioFile) && (
                <audio controls src={form.audio_url} className="w-full h-10" />
              )}
              {audioFile && (
                <p className="text-xs text-muted-foreground">File baru: {audioFile.name}</p>
              )}
              <button
                onClick={() => audioRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-input text-sm hover:border-foreground transition-colors w-fit"
              >
                <SpeakerHighIcon className="w-4 h-4" />
                Ganti Audio
              </button>
              <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioChange} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {saving ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <FloppyDiskIcon className="w-4 h-4" />}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-border text-sm font-medium hover:border-foreground transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sessions Tab ─────────────────────────────────────────────────────────────

function SessionsTab({ onToast }: { onToast: (t: Toast) => void }) {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<SessionRecord | null>(null)
  const [editingStep, setEditingStep] = useState<SessionStep | null>(null)

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
          (a: SessionStepRaw, b: SessionStepRaw) => a.step_number - b.step_number
        ),
      }))

      setSessions(mapped)
      setLoading(false)
    }
    load()
  }, [])

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
      onToast({ type: "error", message: "Gagal menyimpan: " + error.message })
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession?.id
            ? { ...s, steps: s.steps.map((st) => (st.id === updated.id ? updated : st)) }
            : s
        )
      )
      setActiveSession((prev) =>
        prev ? { ...prev, steps: prev.steps.map((st) => (st.id === updated.id ? updated : st)) } : null
      )
      onToast({ type: "success", message: "Step berhasil disimpan!" })
      setEditingStep(null)
    }
  }, [activeSession, onToast])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (activeSession) {
    return (
      <>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveSession(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:border-foreground transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Semua Sesi
            </button>
            <div>
              <h2 className="text-h2 font-semibold">{activeSession.session_name}</h2>
              <p className="text-sm text-muted-foreground">{activeSession.steps.length} steps</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {activeSession.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border hover:border-foreground/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-celeste border border-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  {step.step_number}
                </div>

                {step.image_url && (
                  <img
                    src={step.image_url}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{step.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{step.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{step.duration_seconds}s</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {step.audio_url && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-lg bg-muted">
                      <SpeakerHighIcon className="w-3.5 h-3.5" />
                      Audio
                    </div>
                  )}
                  <button
                    onClick={() => setEditingStep(step)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lemon border border-foreground/20 hover:border-foreground/60 text-xs font-medium transition-all"
                  >
                    <PencilSimpleIcon className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingStep && (
          <StepEditor
            step={editingStep}
            onSave={handleSaveStep}
            onClose={() => setEditingStep(null)}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2 font-semibold">Kelola Sesi Terapi</h2>
        <p className="text-sm text-muted-foreground mt-1">Pilih sesi untuk mengedit step-nya</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSession(s)}
            className="flex flex-col items-start gap-2 p-5 rounded-2xl bg-background border border-border hover:border-foreground hover:shadow-sm transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <p className="font-semibold">{s.session_name}</p>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {s.steps.length} steps
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{s.detail_short}</p>
            <p className="text-xs text-muted-foreground font-mono">{s.slug}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "sessions">("users")
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)
  const router = useRouter()

  useEffect(() => {
    const get = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setAdminEmail(user?.email ?? null)
    }
    get()
  }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="w-64 shrink-0 border-r border-border flex flex-col bg-background">
        <div className="px-6 py-6 border-b border-border">
          <p className="font-semibold" style={{ fontSize: "var(--text-app-name)" }}>DMAI</p>
          <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-4 py-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full
              ${activeTab === "users" ? "bg-foreground text-background" : "hover:bg-muted text-foreground"}`}
          >
            <UsersIcon className="w-4 h-4" />
            Pengguna
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full
              ${activeTab === "sessions" ? "bg-foreground text-background" : "hover:bg-muted text-foreground"}`}
          >
            <DatabaseIcon className="w-4 h-4" />
            Sesi Terapi
          </button>
        </nav>

        <div className="px-4 pb-6 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground truncate px-1 mb-3">{adminEmail}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-red/20 text-foreground hover:bg-red/30 transition-colors"
          >
            <SignOutIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {activeTab === "users"
          ? <UsersTab onToast={setToast} />
          : <SessionsTab onToast={setToast} />}
      </main>

      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}