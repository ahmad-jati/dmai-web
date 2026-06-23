'use client'

import { useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ImageIcon,
  SpeakerHighIcon,
  PlusIcon,
  TrashIcon,
  YoutubeLogoIcon,
  LinkIcon,
  TextTIcon,
  SlidersIcon,
  SmileyIcon,
  ListChecksIcon,
  PersonIcon,
  MusicNotesIcon,
} from '@phosphor-icons/react'
import Image from 'next/image'
import {
  SessionStep,
  StepType,
  STEP_TYPE_LABELS,
  STEP_TYPE_COLORS,
  FormQuestion,
  FormQuestionType,
  NarrationSubStep,
  BodyPart,
  NarrationStepConfigData,
  FormStepConfigData,
  VideoStepConfigData,
  BodyMapStepConfigData,
  ExternalEmbedStepConfigData,
} from './types'

// Re-exported so existing imports of these from this file keep working.
export type { FormQuestion, NarrationSubStep, BodyPart }

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function newKey(): string {
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function formatDurSec(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}d`
  if (s === 0) return `${m}m`
  return `${m}m ${s}d`
}

const FORM_QUESTION_TYPES: { value: FormQuestionType; label: string; icon: ReactNode }[] = [
  { value: 'emoji_scale', label: 'Skala Emoji', icon: <SmileyIcon className="w-3.5 h-3.5" /> },
  { value: 'slider', label: 'Slider (1–100)', icon: <SlidersIcon className="w-3.5 h-3.5" /> },
  { value: 'text_input', label: 'Input Teks', icon: <TextTIcon className="w-3.5 h-3.5" /> },
  { value: 'textarea', label: 'Textarea', icon: <ListChecksIcon className="w-3.5 h-3.5" /> },
]

// ─── Duration input (string-based so it can be cleared) ────────────────────────

type DurationInputProps = {
  value: number
  onChange: (value: number) => void
  label?: string
  readOnly?: boolean
  hint?: string
}

function DurationInput({
  value,
  onChange,
  label = 'Durasi (detik)',
  readOnly = false,
  hint,
}: DurationInputProps) {
  const [raw, setRaw] = useState(value === 0 ? '' : String(value))
  const lastExternal = useRef(value)
  if (value !== lastExternal.current) {
    lastExternal.current = value
    if (value !== Number(raw || '0')) {
      setRaw(value === 0 ? '' : String(value))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {readOnly ? (
        <div className="flex items-center h-9 px-3 rounded-sm border border-border bg-muted text-sm text-muted-foreground">
          {value > 0 ? `${value}d · ${formatDurSec(value)}` : '0'}
        </div>
      ) : (
        <Input
          type="text"
          inputMode="numeric"
          value={raw}
          placeholder="60"
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, '')
            setRaw(v)
            onChange(v === '' ? 0 : Number(v))
          }}
          onBlur={() => {
            if (raw === '') setRaw('')
          }}
        />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ─── Narration sub-step config ─────────────────────────────────────────────────

type NarrationSubStepCardProps = {
  sub: NarrationSubStep
  index: number
  total: number
  onChange: (updated: NarrationSubStep) => void
  onRemove: () => void
}

function NarrationSubStepCard({ sub, index, total, onChange, onRemove }: NarrationSubStepCardProps) {
  const audioRef = useRef<HTMLInputElement>(null!)
  const imageRef = useRef<HTMLInputElement>(null!)

  const handleAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Read duration from the file metadata, but store only the File object.
    // The blob URL is used only for local playback preview — never stored in DB.
    const blobUrl = URL.createObjectURL(file)
    const audio = new window.Audio(blobUrl)
    audio.addEventListener('loadedmetadata', () => {
      onChange({
        ...sub,
        audio_file: file,
        audio_url: '',          // cleared — real URL written on save to Supabase Storage
        audio_preview: blobUrl, // runtime-only preview URL
        duration_seconds: Math.round(audio.duration),
      })
    })
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onChange({
      ...sub,
      image_file: file,
      image_url: '',                          // cleared — real URL written on save
      image_preview: URL.createObjectURL(file), // runtime-only preview
    })
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-muted/30 border border-border rounded-sm">
      {/* Sub-step header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-300 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </div>
        <span className="text-xs text-muted-foreground font-medium">Sub-step narasi</span>
        <div className="flex-1" />
        {sub.duration_seconds > 0 && (
          <span className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-sm">
            {formatDurSec(sub.duration_seconds)}
          </span>
        )}
        {total > 1 && (
          <button
            onClick={onRemove}
            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Nama Step Suara</Label>
        <Input
          value={sub.title}
          onChange={(e) => onChange({ ...sub, title: e.target.value })}
          placeholder="e.g. Pernapasan Dalam"
          className="h-8 text-sm"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Deskripsi</Label>
        <Textarea
          value={sub.description}
          onChange={(e) => onChange({ ...sub, description: e.target.value })}
          placeholder="Deskripsi singkat panduan ini..."
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      {/* Audio + Image row */}
      <div className="flex gap-3 items-start">
        {/* Audio */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <Label className="text-xs flex items-center gap-1">
            <SpeakerHighIcon className="w-3.5 h-3.5" /> Audio Panduan
          </Label>
          {/* Show playback: prefer local preview blob, fallback to stored URL */}
          {(sub.audio_preview || sub.audio_url) && (
            <audio controls src={sub.audio_preview || sub.audio_url} className="w-full h-8" />
          )}
          {sub.audio_file && (
            <p className="text-xs text-muted-foreground truncate">{sub.audio_file.name}</p>
          )}
          {sub.duration_seconds > 0 && (
            <p className="text-xs text-blue-600">Durasi: {formatDurSec(sub.duration_seconds)}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => audioRef.current?.click()}
            className="w-fit h-7 text-xs px-2 rounded-sm bg-background hover:bg-lemon gap-1.5"
          >
            <SpeakerHighIcon className="w-3.5 h-3.5" />
            {sub.audio_url || sub.audio_file ? 'Ganti Audio' : 'Upload Audio'}
          </Button>
          <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleAudio} />
        </div>

        {/* Image */}
        <div className="flex flex-col gap-1.5 items-start shrink-0">
          <Label className="text-xs flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" /> Gambar
          </Label>
          {/* Show preview: prefer local preview blob, fallback to stored URL */}
          {(sub.image_preview || sub.image_url) ? (
            <Image
              src={sub.image_preview || sub.image_url}
              alt="preview"
              width={56}
              height={56}
              className="w-14 h-14 object-cover border border-border rounded-sm bg-muted/50"
              unoptimized
            />
          ) : (
            <div className="w-14 h-14 bg-muted border border-border rounded-sm flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => imageRef.current?.click()}
            className="w-fit h-7 text-xs px-2 rounded-sm bg-background hover:bg-lemon gap-1.5"
          >
            {sub.image_url || sub.image_preview ? 'Ganti' : 'Upload'}
          </Button>
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>
      </div>
    </div>
  )
}

type NarrationStepConfigProps = {
  config: NarrationStepConfigData
  onChange: (patch: Partial<NarrationStepConfigData>) => void
  onTotalDurationChange: (total: number) => void
}

function NarrationStepConfig({ config, onChange, onTotalDurationChange }: NarrationStepConfigProps) {
  const parseSubSteps = (cfg: NarrationStepConfigData | string | null | undefined): NarrationSubStep[] => {
    const obj: NarrationStepConfigData =
      typeof cfg === 'string'
        ? (() => {
            try {
              return JSON.parse(cfg) as NarrationStepConfigData
            } catch {
              return {}
            }
          })()
        : (cfg ?? {})
    const raw = Array.isArray(obj.sub_steps) ? obj.sub_steps : []
    return raw.map((s) => (s._key ? s : { ...s, _key: newKey() }))
  }

  // Own the sub-steps locally so UI state is never lost between re-renders.
  const [subSteps, setSubSteps] = useState<NarrationSubStep[]>(() => parseSubSteps(config))

  // Sync when config reference changes externally (dialog opened with a different step)
  const prevConfigRef = useRef(config)
  useEffect(() => {
    if (prevConfigRef.current === config) return
    prevConfigRef.current = config
    setSubSteps(parseSubSteps(config))
  }, [config])

  const totalDuration = subSteps.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)

  const commit = (updated: NarrationSubStep[]) => {
    setSubSteps(updated)
    onChange({ sub_steps: updated })
    onTotalDurationChange(updated.reduce((acc, s) => acc + (s.duration_seconds || 0), 0))
  }

  const addSub = () =>
    commit([
      ...subSteps,
      {
        _key: newKey(),
        title: '',
        description: '',
        duration_seconds: 0,
        audio_url: '',
        image_url: '',
      },
    ])

  const removeSub = (key: string) => commit(subSteps.filter((s) => s._key !== key))

  const updateSub = (key: string, updated: NarrationSubStep) =>
    commit(subSteps.map((s) => (s._key === key ? updated : s)))

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <MusicNotesIcon className="w-4 h-4" />
            Sub-steps Panduan Suara
          </p>
          {totalDuration > 0 && (
            <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded-sm font-medium">
              Total: {formatDurSec(totalDuration)}
            </span>
          )}
        </div>
        <button
          onClick={addSub}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Tambah sub-step
        </button>
      </div>

      {subSteps.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Belum ada sub-step. Klik Tambah sub-step untuk mulai.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {subSteps.map((sub, i) => (
          <NarrationSubStepCard
            key={sub._key ?? `sub-${i}`}
            sub={sub}
            index={i}
            total={subSteps.length}
            onChange={(updated) => updateSub(sub._key, updated)}
            onRemove={() => removeSub(sub._key)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Form step config ──────────────────────────────────────────────────────────

type FormStepConfigProps = {
  config: FormStepConfigData
  onChange: (patch: Partial<FormStepConfigData>) => void
}

function FormStepConfig({ config, onChange }: FormStepConfigProps) {
  const questions: FormQuestion[] = config.questions ?? []

  const addQ = () =>
    onChange({ questions: [...questions, { _key: newKey(), label: '', type: 'text_input' }] })
  const removeQ = (key: string) => onChange({ questions: questions.filter((q) => q._key !== key) })
  const updateQ = (key: string, patch: Partial<FormQuestion>) =>
    onChange({ questions: questions.map((q) => (q._key === key ? { ...q, ...patch } : q)) })

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Pertanyaan Form
        </p>
        <button
          onClick={addQ}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Tambah pertanyaan
        </button>
      </div>

      {questions.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Belum ada pertanyaan. Klik Tambah pertanyaan untuk mulai.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <div
            key={q._key}
            className="flex items-start gap-2 p-3 bg-muted/40 border border-border rounded-sm"
          >
            <span className="text-xs text-muted-foreground font-semibold mt-2 w-4 shrink-0">
              {i + 1}.
            </span>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Input
                value={q.label}
                onChange={(e) => updateQ(q._key, { label: e.target.value })}
                placeholder="Label pertanyaan, e.g. Bagaimana mood kamu hari ini?"
                className="h-8 text-sm"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground shrink-0">Tipe:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {FORM_QUESTION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => updateQ(q._key, { type: t.value })}
                      className={[
                        'flex items-center gap-1 px-2 py-1 rounded-sm border text-xs font-medium transition-colors',
                        q.type === t.value
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background text-muted-foreground border-border hover:border-foreground/40',
                      ].join(' ')}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => removeQ(q._key)}
              className="mt-2 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Video step config ─────────────────────────────────────────────────────────

type VideoStepConfigProps = {
  config: VideoStepConfigData
  onChange: (patch: Partial<VideoStepConfigData>) => void
}

function VideoStepConfig({ config, onChange }: VideoStepConfigProps) {
  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Konfigurasi Video
      </p>
      <div className="flex flex-col gap-1.5">
        <Label className="flex items-center gap-1.5">
          <YoutubeLogoIcon className="w-4 h-4 text-red-500" />
          URL YouTube
        </Label>
        <Input
          value={config.youtube_url ?? ''}
          onChange={(e) => onChange({ ...config, youtube_url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
          className="text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>
          Kredit Video{' '}
          <span className="text-muted-foreground font-normal text-xs">(opsional)</span>
        </Label>
        <Input
          value={config.credit ?? ''}
          onChange={(e) => onChange({ ...config, credit: e.target.value })}
          placeholder="e.g. Dr. Amelia Putri, Psikolog Klinis"
          className="text-sm"
        />
      </div>
    </div>
  )
}

// ─── Body map step config ──────────────────────────────────────────────────────

type BodyMapStepConfigProps = {
  config: BodyMapStepConfigData
  onChange: (patch: Partial<BodyMapStepConfigData>) => void
  bodyParts: BodyPart[]
  bodyPartsLoading: boolean
}

function BodyMapStepConfig({ config, onChange, bodyParts, bodyPartsLoading }: BodyMapStepConfigProps) {
  const grouped = bodyParts.reduce<Record<string, BodyPart[]>>((acc, p) => {
    if (!acc[p.region]) acc[p.region] = []
    acc[p.region].push(p)
    return acc
  }, {})
  const regions = Object.keys(grouped)

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <PersonIcon className="w-4 h-4" />
        Konfigurasi Body Map
      </p>
      <div className="flex flex-col gap-1.5">
        <Label>Label Pertanyaan</Label>
        <Input
          value={config.section_label ?? ''}
          onChange={(e) => onChange({ ...config, section_label: e.target.value })}
          placeholder="e.g. Pilih bagian tubuh yang terasa lelah/tegang saat ini"
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">Pertanyaan ini akan muncul di atas peta tubuh.</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-medium">
          Bagian tubuh dari tabel{' '}
          <code className="bg-muted px-1 rounded">body_parts</code>:
        </p>
        {bodyPartsLoading ? (
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-5 w-20 bg-muted animate-pulse rounded-sm" style={{ animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
        ) : regions.length === 0 ? (
          <p className="text-xs text-destructive italic">Tidak ada data body_parts di database.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {regions.map((region) => (
              <div key={region} className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5 capitalize">
                  {region.replace(/_/g, ' ')}
                </span>
                <div className="flex flex-wrap gap-1">
                  {grouped[region]
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((part) => (
                      <span key={part.id} className="px-1.5 py-0.5 rounded-sm bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                        {part.label_id}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground italic">Pilihan ini muncul otomatis di UI pengguna.</p>
      </div>
    </div>
  )
}

// ─── External embed step config ────────────────────────────────────────────────

type ExternalEmbedStepConfigProps = {
  config: ExternalEmbedStepConfigData
  onChange: (patch: Partial<ExternalEmbedStepConfigData>) => void
}

function ExternalEmbedStepConfig({ config, onChange }: ExternalEmbedStepConfigProps) {
  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <LinkIcon className="w-4 h-4" />
        Konfigurasi External Embed
      </p>
      <div className="flex flex-col gap-1.5">
        <Label>URL Embed</Label>
        <Input
          value={config.embed_url ?? ''}
          onChange={(e) => onChange({ ...config, embed_url: e.target.value })}
          placeholder="https://app.mentimeter.com/..."
          className="text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Label / Instruksi</Label>
        <Input
          value={config.embed_label ?? ''}
          onChange={(e) => onChange({ ...config, embed_label: e.target.value })}
          placeholder="e.g. Buka Mentimeter dan tulis reaksi tubuhmu"
          className="text-sm"
        />
      </div>
    </div>
  )
}

// ─── Main export: StepTypeForm ─────────────────────────────────────────────────

type StepTypeFormProps = {
  form: SessionStep
  setForm: (patch: Partial<SessionStep>) => void
  bodyParts?: BodyPart[]
  bodyPartsLoading?: boolean
}

export function StepTypeForm({
  form,
  setForm,
  bodyParts = [],
  bodyPartsLoading = false,
}: StepTypeFormProps) {
  const showDescription = !(['video', 'external_embed', 'narration'] as StepType[]).includes(form.step_type)

  const updateConfig = (patch: Record<string, unknown>) =>
    setForm({ step_config: { ...form.step_config, ...patch } })

  return (
    <div className="flex flex-col gap-4">
      {/* ── Type + Title + Duration row ── */}
      <div className="grid grid-cols-[160px_1fr_140px] gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <Label>Tipe Step</Label>
          <Select
            value={form.step_type}
            onValueChange={(val) =>
              setForm({ step_type: val as StepType, step_config: {} })
            }
          >
            <SelectTrigger className="rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(STEP_TYPE_LABELS) as [StepType, string][]).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-sm ${STEP_TYPE_COLORS[val].split(' ')[0]}`} />
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Nama Step *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ title: e.target.value })}
            placeholder={
              form.step_type === 'video' ? 'e.g. Video Edukasi'
              : form.step_type === 'form' ? 'e.g. Form Check-in Awal'
              : form.step_type === 'body_map' ? 'e.g. Pemetaan Tubuh'
              : form.step_type === 'external_embed' ? 'e.g. Aktivitas Mentimeter'
              : form.step_type === 'game' ? 'e.g. Game Fokus'
              : 'e.g. Panduan Relaksasi'
            }
          />
        </div>

        {/* Narration: duration auto from sub-steps; others: manual */}
        {form.step_type === 'narration' ? (
          <DurationInput
            label="Durasi (otomatis)"
            value={form.duration_seconds}
            onChange={() => {}}
            readOnly
            hint="Dari total audio sub-steps"
          />
        ) : (
          <DurationInput
            value={form.duration_seconds}
            onChange={(v) => setForm({ duration_seconds: v })}
          />
        )}
      </div>

      {/* ── Description (non-narration, non-video, non-embed) ── */}
      {showDescription && (
        <div className="flex flex-col gap-1.5">
          <Label>Instruksi / Deskripsi</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ description: e.target.value })}
            rows={3}
            className="resize-none text-sm"
            placeholder={
              form.step_type === 'game'
                ? 'Jelaskan cara main game dan tujuannya...'
                : form.step_type === 'body_map'
                ? 'Instruksi tambahan sebelum pengguna memilih bagian tubuh...'
                : form.step_type === 'form'
                ? 'Instruksi pengisian form untuk pengguna...'
                : ''
            }
          />
        </div>
      )}

      {/* ── Type-specific config ── */}
      {form.step_type === 'narration' && (
        <NarrationStepConfig
          config={form.step_config as NarrationStepConfigData}
          onChange={updateConfig}
          onTotalDurationChange={(total) => setForm({ duration_seconds: total })}
        />
      )}
      {form.step_type === 'form' && (
        <FormStepConfig config={form.step_config as FormStepConfigData} onChange={updateConfig} />
      )}
      {form.step_type === 'video' && (
        <VideoStepConfig config={form.step_config as VideoStepConfigData} onChange={updateConfig} />
      )}
      {form.step_type === 'body_map' && (
        <BodyMapStepConfig
          config={form.step_config as BodyMapStepConfigData}
          onChange={updateConfig}
          bodyParts={bodyParts}
          bodyPartsLoading={bodyPartsLoading}
        />
      )}
      {form.step_type === 'external_embed' && (
        <ExternalEmbedStepConfig config={form.step_config as ExternalEmbedStepConfigData} onChange={updateConfig} />
      )}
    </div>
  )
}