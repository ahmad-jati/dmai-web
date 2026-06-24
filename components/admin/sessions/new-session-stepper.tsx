'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ImageIcon,
  SpeakerHighIcon,
  PlusIcon,
  TrashIcon,
  FloppyDiskIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import Image from 'next/image'
import { StepTypeForm, BodyPart, newKey, FormQuestion } from './step-type-form'
import { SessionMeta, StepType, STEP_TYPE_LABELS, STEP_TYPE_COLORS } from './types'

// ─── Constants ─────────────────────────────────────────────────────────────────
type DraftStep = {
  _key: string
  step_number: number
  title: string
  description: string
  duration_seconds: number
  step_type: StepType
  step_config: Record<string, unknown>
  image_file: File | null
  image_preview: string
  audio_file: File | null
}

type SessionInfoForm = Omit<SessionMeta, 'image_cover_url'>

// ─── Constants ─────────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { label: 'Info Sesi', desc: 'Nama, deskripsi, cover' },
  { label: 'Bangun Steps', desc: 'Susun langkah-langkah sesi' },
  { label: 'Review & Simpan', desc: 'Cek dan publikasikan' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function emptyDraftStep(num: number): DraftStep {
  return {
    _key: newKey(),
    step_number: num,
    title: '',
    description: '',
    duration_seconds: 60,
    step_type: 'narration',
    step_config: {},
    image_file: null,
    image_preview: '',
    audio_file: null,
  }
}

/** Sum all step durations → total seconds */
function calcTotalDurationSec(steps: DraftStep[]) {
  return steps.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
}

/** Format seconds → "X menit Y detik" or "X menit" */
function formatDuration(totalSec: number) {
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  if (mins === 0) return `${secs} detik`
  if (secs === 0) return `${mins} menit`
  return `${mins} menit ${secs} detik`
}

// ─── Stepper Header ────────────────────────────────────────────────────────────

function StepperHeader({ current }: { current: number }) {
  return (
    <div className="flex items-start gap-0">
      {WIZARD_STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors border-2',
                  done
                    ? 'bg-foreground text-background border-foreground'
                    : active
                    ? 'bg-background text-foreground border-foreground'
                    : 'bg-muted text-muted-foreground border-border',
                ].join(' ')}
              >
                {done ? <CheckIcon className="w-4 h-4" /> : i + 1}
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">{s.desc}</p>
              </div>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-3 mt-[-20px] transition-colors ${done ? 'bg-foreground' : 'bg-border'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Session Info ──────────────────────────────────────────────────────

function SessionInfoStep({
  form,
  setForm,
  coverFile,
  setCoverFile,
  coverPreview,
  setCoverPreview,
  autoStats,
}: {
  form: SessionInfoForm
  setForm: React.Dispatch<React.SetStateAction<SessionInfoForm>>
  coverFile: File | null
  setCoverFile: React.Dispatch<React.SetStateAction<File | null>>
  coverPreview: string
  setCoverPreview: React.Dispatch<React.SetStateAction<string>>
  /** Computed from steps: { totalSteps, durationLabel } */
  autoStats: { totalSteps: number; durationLabel: string }
}) {
  const coverRef = useRef<HTMLInputElement>(null!)

  const handleNameChange = (val: string) => {
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setForm((f) => ({ ...f, session_name: val, slug: f.slug || autoSlug }))
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-8 items-start">
      {/* Cover */}
      <div className="flex flex-col gap-3">
        <Label>Gambar Cover</Label>
        <div className="aspect-square w-full rounded-sm overflow-hidden border border-border bg-muted">
          {coverPreview ? (
            <Image src={coverPreview} alt="cover" width={260} height={260} className="w-full h-full object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="w-8 h-8 opacity-30" />
              <span className="text-xs">Belum ada gambar</span>
            </div>
          )}
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => coverRef.current?.click()}
          className="w-fit rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground"
        >
          <ImageIcon className="w-4 h-4" />
          {coverPreview ? 'Ganti Cover' : 'Upload Cover'}
        </Button>
        <input ref={coverRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) }
          }}
        />
        {coverFile && <p className="text-xs text-muted-foreground truncate">{coverFile.name}</p>}
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sn">Nama Sesi *</Label>
          <Input id="sn" value={form.session_name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Present Moment Awareness" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug (URL) *</Label>
          <Input id="slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="present-moment-awareness" />
          <p className="text-xs text-muted-foreground">URL: /session/<strong>{form.slug || '...'}</strong></p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="week">Week</Label>
            <Input id="week" type="number" value={form.week_number}
              onChange={(e) => setForm((f) => ({ ...f, week_number: e.target.value }))} placeholder="1" />
          </div>
          {/* Duration & total instruction: auto-derived, shown read-only with override */}
          <div className="flex flex-col gap-1.5">
            <Label>Durasi <span className="text-muted-foreground font-normal">(otomatis)</span></Label>
            <div className="flex items-center h-9 px-3 rounded-sm border border-border bg-muted text-sm text-muted-foreground">
              {autoStats.durationLabel || '0 detik'}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Total Step <span className="text-muted-foreground font-normal">(otomatis)</span></Label>
            <div className="flex items-center h-9 px-3 rounded-sm border border-border bg-muted text-sm text-muted-foreground">
              {autoStats.totalSteps} step
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds">Deskripsi Singkat</Label>
          <Textarea id="ds" value={form.detail_short}
            onChange={(e) => setForm((f) => ({ ...f, detail_short: e.target.value }))}
            placeholder="Ringkasan singkat tentang sesi ini..." rows={2} className="resize-none" />
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
                rows={3} placeholder={`Paragraf ${i + 1}...`} className="resize-none text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step Builder Card ─────────────────────────────────────────────────────────

function StepBuilderCard({
  step,
  total,
  onChange,
  onRemove,
  bodyParts,
  bodyPartsLoading,
}: {
  step: DraftStep
  total: number
  onChange: (updated: DraftStep) => void
  onRemove: () => void
  bodyParts: BodyPart[]
  bodyPartsLoading: boolean
}) {
  // Keep a local SessionStep-shaped state so StepTypeForm has stable, owned state.
  // Sync back to parent DraftStep via onChange on every change.
  const [localForm, setLocalForm] = useState({
    id: step._key,
    step_number: step.step_number,
    title: step.title,
    description: step.description,
    duration_seconds: step.duration_seconds,
    step_type: step.step_type,
    step_config: step.step_config,
    image_url: step.image_preview ?? '',
    audio_url: '',
  })

  // Sync incoming step prop → localForm when the step identity changes (e.g. type reset)
  const prevKeyRef = useRef(step._key)
  if (prevKeyRef.current !== step._key) {
    prevKeyRef.current = step._key
    setLocalForm({
      id: step._key,
      step_number: step.step_number,
      title: step.title,
      description: step.description,
      duration_seconds: step.duration_seconds,
      step_type: step.step_type,
      step_config: step.step_config,
      image_url: step.image_preview ?? '',
      audio_url: '',
    })
  }

  const handleChange = (patch: Partial<typeof localForm>) => {
    // When step_type changes, reset step_config
    const next = patch.step_type !== undefined && patch.step_type !== localForm.step_type
      ? { ...localForm, ...patch, step_config: {} }
      : { ...localForm, ...patch }
    setLocalForm(next)
    onChange({
      ...step,
      title: next.title,
      description: next.description,
      duration_seconds: next.duration_seconds,
      step_type: next.step_type,
      step_config: next.step_config,
    })
  }

  return (
    <div className="border border-border rounded-sm bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border">
        <div className="w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center shrink-0">
          {step.step_number}
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-xs font-medium ${STEP_TYPE_COLORS[localForm.step_type]}`}>
          {STEP_TYPE_LABELS[localForm.step_type]}
        </span>
        <div className="flex-1" />
        {total > 1 && (
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <StepTypeForm
          form={localForm}
          setForm={handleChange}
          bodyParts={bodyParts}
          bodyPartsLoading={bodyPartsLoading}
        />
      </div>
    </div>
  )
}

// ─── Steps Builder Page ────────────────────────────────────────────────────────

function StepsBuilderStep({
  steps,
  setSteps,
  bodyParts,
  bodyPartsLoading,
}: {
  steps: DraftStep[]
  setSteps: React.Dispatch<React.SetStateAction<DraftStep[]>>
  bodyParts: BodyPart[]
  bodyPartsLoading: boolean
}) {
  const totalSec = calcTotalDurationSec(steps)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Susun langkah-langkah yang dilalui pengguna. Tipe step menentukan tampilan dan inputnya.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary">{steps.length} step</Badge>
          <Badge variant="outline">{formatDuration(totalSec)}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step) => (
          <StepBuilderCard
            key={step._key}
            step={step}
            total={steps.length}
            bodyParts={bodyParts}
            bodyPartsLoading={bodyPartsLoading}
            onChange={(updated) =>
              setSteps((prev) => prev.map((s) => (s._key === step._key ? updated : s)))
            }
            onRemove={() =>
              setSteps((prev) => {
                const filtered = prev.filter((s) => s._key !== step._key)
                return filtered.map((s, i) => ({ ...s, step_number: i + 1 }))
              })
            }
          />
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => setSteps((prev) => [...prev, emptyDraftStep(prev.length + 1)])}
        className="rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground w-full border-dashed"
      >
        <PlusIcon className="w-4 h-4" />
        Tambah Step
      </Button>
    </div>
  )
}

// ─── Step 3: Review ────────────────────────────────────────────────────────────

function ReviewStep({
  info,
  coverPreview,
  steps,
}: {
  info: SessionInfoForm
  coverPreview: string
  steps: DraftStep[]
}) {
  const errors: string[] = []
  if (!info.session_name.trim()) errors.push('Nama sesi wajib diisi')
  if (!info.slug.trim()) errors.push('Slug wajib diisi')
  const empty = steps.filter((s) => !s.title.trim())
  if (empty.length > 0) errors.push(`${empty.length} step belum memiliki nama`)

  const totalSec = calcTotalDurationSec(steps)

  return (
    <div className="flex flex-col gap-6">
      {errors.length > 0 && (
        <div className="flex flex-col gap-2 p-4 bg-destructive/5 border border-destructive/20 rounded-sm">
          <div className="flex items-center gap-2 text-destructive">
            <WarningCircleIcon weight="fill" className="w-4 h-4" />
            <span className="text-sm font-semibold">Perlu diperbaiki sebelum menyimpan:</span>
          </div>
          <ul className="flex flex-col gap-1 pl-6 list-disc">
            {errors.map((e, i) => <li key={i} className="text-sm text-destructive">{e}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-[220px_1fr] gap-8 items-start">
        <div className="flex flex-col gap-3">
          <div className="aspect-square w-full rounded-sm overflow-hidden border border-border bg-muted">
            {coverPreview ? (
              <Image src={coverPreview} alt="cover" width={220} height={220} className="w-full h-full object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Tidak ada cover</div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-base">{info.session_name || '—'}</p>
            <p className="text-xs text-muted-foreground">/{info.slug || '—'}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {info.week_number && <Badge variant="outline" className="text-xs">Week {info.week_number}</Badge>}
              <Badge variant="outline" className="text-xs">{formatDuration(totalSec)}</Badge>
              <Badge variant="outline" className="text-xs">{steps.length} step</Badge>
            </div>
          </div>
          {info.detail_short && <p className="text-sm text-muted-foreground">{info.detail_short}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{steps.length} Step</p>
          <div className="flex flex-col gap-2">
            {steps.map((step) => {
              // Config summary per type
              let configSummary: React.ReactNode = null
              if (step.step_type === 'form') {
                const qs = (step.step_config.questions as FormQuestion[]) ?? []
                configSummary = qs.length > 0
                  ? <p className="text-xs text-muted-foreground">{qs.length} pertanyaan: {qs.map(q => q.label || '(kosong)').join(' · ')}</p>
                  : <p className="text-xs text-destructive italic">Belum ada pertanyaan</p>
              } else if (step.step_type === 'video') {
                const url = step.step_config.youtube_url as string
                configSummary = url
                  ? <p className="text-xs text-muted-foreground truncate">{url}</p>
                  : <p className="text-xs text-destructive italic">URL YouTube belum diisi</p>
              } else if (step.step_type === 'body_map') {
                const lbl = step.step_config.section_label as string
                configSummary = lbl
                  ? <p className="text-xs text-muted-foreground">{lbl}</p>
                  : <p className="text-xs text-muted-foreground italic">Label belum diisi</p>
              } else if (step.step_type === 'external_embed') {
                const url = step.step_config.embed_url as string
                configSummary = url
                  ? <p className="text-xs text-muted-foreground truncate">{url}</p>
                  : <p className="text-xs text-destructive italic">URL embed belum diisi</p>
              }

              return (
                <div key={step._key} className="flex items-start gap-3 p-3 border border-border rounded-sm bg-white">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                    {step.step_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {step.title || <span className="text-destructive italic">Nama kosong</span>}
                      </p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm border text-xs font-medium ${STEP_TYPE_COLORS[step.step_type]}`}>
                        {STEP_TYPE_LABELS[step.step_type]}
                      </span>
                      <span className="text-xs text-muted-foreground">{step.duration_seconds}s</span>
                    </div>
                    {configSummary}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {step.image_file && <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                    {step.audio_file && <SpeakerHighIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Stepper ──────────────────────────────────────────────────────────────

export function NewSessionStepper() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [info, setInfo] = useState<SessionInfoForm>({
    session_name: '',
    slug: '',
    detail_short: '',
    detail_full: ['', ''],
    week_number: '',
    duration: '',
    total_instruction: '',
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>([emptyDraftStep(1)])

  // Body parts — fetched once on mount
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [bodyPartsLoading, setBodyPartsLoading] = useState(true)

  useEffect(() => {
    const fetchBodyParts = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('body_parts')
        .select('id, part_key, label_id, region, sort_order')
        .order('sort_order', { ascending: true })
      if (!error && data) setBodyParts(data as BodyPart[])
      setBodyPartsLoading(false)
    }
    fetchBodyParts()
  }, [])

  // Auto-compute stats from steps
  const totalSec = calcTotalDurationSec(draftSteps)
  const autoStats = {
    totalSteps: draftSteps.length,
    durationLabel: formatDuration(totalSec),
  }

  const canGoNext = () => {
    if (currentStep === 0) return !!(info.session_name.trim() && info.slug.trim())
    if (currentStep === 1) return draftSteps.length > 0
    return true
  }

  const handleSave = async () => {
    if (!info.session_name.trim() || !info.slug.trim()) {
      toast.error('Nama sesi dan slug wajib diisi')
      return
    }
    const emptyTitles = draftSteps.filter((s) => !s.title.trim())
    if (emptyTitles.length > 0) {
      toast.error(`${emptyTitles.length} step belum memiliki nama`)
      return
    }

    setSaving(true)
    const supabase = createClient()

    try {
      const { count } = await supabase.from('sessions').select('id', { count: 'exact', head: true })
      const cleanedDetailFull = info.detail_full.filter((p) => p.trim() !== '')

      const { data: newSession, error: sessionErr } = await supabase
        .from('sessions')
        .insert({
          session_name: info.session_name,
          slug: info.slug,
          detail_short: info.detail_short,
          detail_full: cleanedDetailFull,
          week_number: info.week_number ? Number(info.week_number) : null,
          duration: formatDuration(totalSec),
          total_instruction: draftSteps.length,
          is_locked: true,
          sort_order: (count ?? 0) + 1,
          image_cover_url: '',
        })
        .select()
        .single()

      if (sessionErr || !newSession) {
        toast.error('Gagal membuat sesi', { description: sessionErr?.message })
        setSaving(false)
        return
      }

      const sessionId = newSession.id

      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const path = `sessions/${sessionId}/cover.${ext}`
        const { error: upErr } = await supabase.storage.from('session-assets').upload(path, coverFile, { upsert: true })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('session-assets').getPublicUrl(path)
          await supabase.from('sessions').update({ image_cover_url: urlData.publicUrl }).eq('id', sessionId)
        }
      }

      for (const draft of draftSteps) {
        // Build the clean step_config — upload narration sub-step files, strip runtime fields
        let cleanConfig: Record<string, unknown> = {}

        if (draft.step_type === 'narration' && Array.isArray(draft.step_config?.sub_steps)) {
          // We need the step ID first — insert with empty config, then update
          const { data: insertedStep, error: stepErr } = await supabase
            .from('session_steps')
            .insert({
              session_id: sessionId,
              step_number: draft.step_number,
              title: draft.title,
              description: draft.description,
              duration_seconds: draft.duration_seconds,
              step_type: draft.step_type,
              step_config: {},
              image_url: '',
              audio_url: '',
            })
            .select()
            .single()

          if (stepErr || !insertedStep) { console.error('Step insert error:', stepErr); continue }

          const stepId = insertedStep.id
          const uploadedSubSteps = await Promise.all(
            (draft.step_config.sub_steps as Record<string, unknown>[]).map(async (sub, i) => {
              const s = sub as { _key?: string; audio_file?: File; image_file?: File; audio_url?: string; image_url?: string; audio_preview?: string; image_preview?: string; [k: string]: unknown }
              let audioUrl = s.audio_url ?? ''
              let imageUrl = s.image_url ?? ''

              if (s.audio_file instanceof File) {
                const ext = s.audio_file.name.split('.').pop()
                const path = `steps/${stepId}/sub_${i}_audio.${ext}`
                const { error } = await supabase.storage.from('session-assets').upload(path, s.audio_file, { upsert: true })
                if (!error) {
                  const { data } = supabase.storage.from('session-assets').getPublicUrl(path)
                  audioUrl = data.publicUrl
                }
              }

              if (s.image_file instanceof File) {
                const ext = s.image_file.name.split('.').pop()
                const path = `steps/${stepId}/sub_${i}_image.${ext}`
                const { error } = await supabase.storage.from('session-assets').upload(path, s.image_file, { upsert: true })
                if (!error) {
                  const { data } = supabase.storage.from('session-assets').getPublicUrl(path)
                  imageUrl = data.publicUrl
                }
              }

              const { audio_file, image_file, image_preview, audio_preview, ...rest } = s
              return { ...rest, audio_url: audioUrl, image_url: imageUrl }
            })
          )

          await supabase
            .from('session_steps')
            .update({ step_config: { sub_steps: uploadedSubSteps } })
            .eq('id', stepId)

          continue // already handled
        }

        // Non-narration steps: sanitize config (strip any accidental File refs) then insert
        cleanConfig = JSON.parse(JSON.stringify(draft.step_config ?? {}, (_, v) =>
          v instanceof File || v instanceof Blob ? undefined : v
        ))

        const { data: insertedStep, error: stepErr } = await supabase
          .from('session_steps')
          .insert({
            session_id: sessionId,
            step_number: draft.step_number,
            title: draft.title,
            description: draft.description,
            duration_seconds: draft.duration_seconds,
            step_type: draft.step_type,
            step_config: cleanConfig,
            image_url: '',
            audio_url: '',
          })
          .select()
          .single()

        if (stepErr || !insertedStep) { console.error('Step insert error:', stepErr); continue }
      }

      toast.success('Sesi berhasil dibuat!', {
        description: `${info.session_name} · ${draftSteps.length} step · ${formatDuration(totalSec)}`,
      })
      router.push('/admin/sessions')
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <StepperHeader current={currentStep} />

      <div className="min-h-96">
        {currentStep === 0 && (
          <SessionInfoStep
            form={info} setForm={setInfo}
            coverFile={coverFile} setCoverFile={setCoverFile}
            coverPreview={coverPreview} setCoverPreview={setCoverPreview}
            autoStats={autoStats}
          />
        )}
        {currentStep === 1 && (
          <StepsBuilderStep
            steps={draftSteps}
            setSteps={setDraftSteps}
            bodyParts={bodyParts}
            bodyPartsLoading={bodyPartsLoading}
          />
        )}
        {currentStep === 2 && (
          <ReviewStep info={info} coverPreview={coverPreview} steps={draftSteps} />
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => currentStep === 0 ? router.push('/admin/sessions') : setCurrentStep((s) => s - 1)}
          className="rounded-sm gap-2 [&_svg]:size-4"
          disabled={saving}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {currentStep === 0 ? 'Batal' : 'Kembali'}
        </Button>

        {currentStep < WIZARD_STEPS.length - 1 ? (
          <Button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canGoNext()}
            className="rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground"
          >
            Lanjut <ArrowRightIcon className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-sm gap-2 [&_svg]:size-4 bg-background hover:bg-lemon text-foreground"
          >
            {saving ? <Spinner className="shrink-0 text-foreground" /> : <FloppyDiskIcon className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Sesi'}
          </Button>
        )}
      </div>
    </div>
  )
}