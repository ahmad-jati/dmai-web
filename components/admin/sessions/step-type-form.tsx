'use client'

import { useRef } from 'react'
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
} from '@phosphor-icons/react'
import Image from 'next/image'
import { SessionStep, StepType, STEP_TYPE_LABELS, STEP_TYPE_COLORS } from './types'

// ─── Sub-types ─────────────────────────────────────────────────────────────────

export type FormQuestion = {
  _key: string
  label: string
  type: 'emoji_scale' | 'slider' | 'text_input' | 'textarea'
}

export type BodyPart = {
  id: string
  part_key: string
  label_id: string
  region: string
  sort_order: number | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function newKey() {
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

const FORM_QUESTION_TYPES: {
  value: FormQuestion['type']
  label: string
  icon: React.ReactNode
}[] = [
  { value: 'emoji_scale', label: 'Skala Emoji', icon: <SmileyIcon className="w-3.5 h-3.5" /> },
  { value: 'slider', label: 'Slider (1–100)', icon: <SlidersIcon className="w-3.5 h-3.5" /> },
  { value: 'text_input', label: 'Input Teks', icon: <TextTIcon className="w-3.5 h-3.5" /> },
  { value: 'textarea', label: 'Textarea', icon: <ListChecksIcon className="w-3.5 h-3.5" /> },
]

// ─── Per-type config sub-forms ─────────────────────────────────────────────────

function FormStepConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  const questions: FormQuestion[] = (config.questions as FormQuestion[]) ?? []

  const addQ = () =>
    onChange({ questions: [...questions, { _key: newKey(), label: '', type: 'text_input' }] })

  const removeQ = (key: string) =>
    onChange({ questions: questions.filter((q) => q._key !== key) })

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

function VideoStepConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
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
          value={(config.youtube_url as string) ?? ''}
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
          value={(config.credit as string) ?? ''}
          onChange={(e) => onChange({ ...config, credit: e.target.value })}
          placeholder="e.g. Dr. Amelia Putri, Psikolog Klinis"
          className="text-sm"
        />
      </div>
    </div>
  )
}

function BodyMapStepConfig({
  config,
  onChange,
  bodyParts,
  bodyPartsLoading,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
  bodyParts: BodyPart[]
  bodyPartsLoading: boolean
}) {
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
          value={(config.section_label as string) ?? ''}
          onChange={(e) => onChange({ ...config, section_label: e.target.value })}
          placeholder="e.g. Pilih bagian tubuh yang terasa lelah/tegang saat ini"
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Pertanyaan ini akan muncul di atas peta tubuh.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-medium">
          Bagian tubuh dari tabel{' '}
          <code className="bg-muted px-1 rounded">body_parts</code>:
        </p>

        {bodyPartsLoading ? (
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-5 w-20 bg-muted animate-pulse rounded-sm"
                style={{ animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
        ) : regions.length === 0 ? (
          <p className="text-xs text-destructive italic">
            Tidak ada data body_parts di database.
          </p>
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
                      <span
                        key={part.id}
                        className="px-1.5 py-0.5 rounded-sm bg-green-50 border border-green-200 text-green-700 text-xs font-medium"
                      >
                        {part.label_id}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground italic">
          Pilihan ini muncul otomatis di UI pengguna.
        </p>
      </div>
    </div>
  )
}

function ExternalEmbedStepConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <LinkIcon className="w-4 h-4" />
        Konfigurasi External Embed
      </p>
      <div className="flex flex-col gap-1.5">
        <Label>URL Embed</Label>
        <Input
          value={(config.embed_url as string) ?? ''}
          onChange={(e) => onChange({ ...config, embed_url: e.target.value })}
          placeholder="https://app.mentimeter.com/..."
          className="text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Label / Instruksi</Label>
        <Input
          value={(config.embed_label as string) ?? ''}
          onChange={(e) => onChange({ ...config, embed_label: e.target.value })}
          placeholder="e.g. Buka Mentimeter dan tulis reaksi tubuhmu"
          className="text-sm"
        />
      </div>
    </div>
  )
}

// ─── Main export: StepTypeForm ─────────────────────────────────────────────────

export interface StepTypeFormProps {
  form: SessionStep
  setForm: (patch: Partial<SessionStep>) => void
  imageFile: File | null
  imagePreview: string
  audioFile: File | null
  onImageChange: (file: File, preview: string) => void
  onAudioChange: (file: File) => void
  bodyParts?: BodyPart[]
  bodyPartsLoading?: boolean
}

export function StepTypeForm({
  form,
  setForm,
  imageFile,
  imagePreview,
  audioFile,
  onImageChange,
  onAudioChange,
  bodyParts = [],
  bodyPartsLoading = false,
}: StepTypeFormProps) {
  const imageRef = useRef<HTMLInputElement>(null!)
  const audioRef = useRef<HTMLInputElement>(null!)

  const showImage = !['video', 'external_embed'].includes(form.step_type)
  const showAudio = form.step_type === 'narration' || form.step_type === 'game'
  const showDescription = !['video', 'external_embed'].includes(form.step_type)

  const updateConfig = (patch: Record<string, unknown>) =>
    setForm({ step_config: { ...form.step_config, ...patch } })

  return (
    <div className="flex flex-col gap-4">
      {/* ── Type + Title + Duration row ── */}
      <div className="grid grid-cols-[160px_1fr_110px] gap-3 items-end">
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
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        STEP_TYPE_COLORS[val].split(' ')[0].replace('bg-', 'bg-')
                      }`}
                    />
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
              form.step_type === 'video'
                ? 'e.g. Video Edukasi'
                : form.step_type === 'form'
                ? 'e.g. Form Check-in Awal'
                : form.step_type === 'body_map'
                ? 'e.g. Pemetaan Tubuh'
                : form.step_type === 'external_embed'
                ? 'e.g. Aktivitas Mentimeter'
                : form.step_type === 'game'
                ? 'e.g. Game Fokus'
                : 'e.g. Panduan Relaksasi'
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Durasi (detik)</Label>
          <Input
            type="number"
            value={form.duration_seconds}
            onChange={(e) => setForm({ duration_seconds: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* ── Description (conditional) ── */}
      {showDescription && (
        <div className="flex flex-col gap-1.5">
          <Label>Instruksi / Deskripsi</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ description: e.target.value })}
            rows={3}
            className="resize-none text-sm"
            placeholder={
              form.step_type === 'narration'
                ? 'Deskripsikan narasi atau panduan suara yang akan diputar...'
                : form.step_type === 'game'
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

      {/* ── Image + Audio (conditional) ── */}
      {(showImage || showAudio) && (
        <div className="flex gap-4 items-start">
          {showImage && (
            <div className="flex flex-col gap-1.5 items-start">
              <Label>Gambar</Label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="preview"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover border border-border rounded-sm bg-muted/50 shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted border border-border rounded-sm flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground truncate max-w-40">
                    {imageFile?.name ?? (imagePreview ? 'File saat ini' : 'Belum ada gambar')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => imageRef.current?.click()}
                    className="w-fit rounded-sm gap-2 [&_svg]:size-3.5 bg-background hover:bg-lemon text-foreground"
                  >
                    <ImageIcon />
                    {imagePreview ? 'Ganti Gambar' : 'Upload Gambar'}
                  </Button>
                </div>
              </div>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onImageChange(f, URL.createObjectURL(f))
                }}
              />
            </div>
          )}

          {showAudio && (
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>Audio Narasi</Label>
              {form.audio_url && !audioFile && (
                <audio controls src={form.audio_url} className="w-full h-9" />
              )}
              {audioFile && (
                <p className="text-xs text-muted-foreground">Baru: {audioFile.name}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => audioRef.current?.click()}
                className="w-fit rounded-sm gap-2 [&_svg]:size-3.5 bg-background hover:bg-lemon text-foreground"
              >
                <SpeakerHighIcon />
                {form.audio_url || audioFile ? 'Ganti Audio' : 'Upload Audio'}
              </Button>
              <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onAudioChange(f)
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Type-specific config ── */}
      {form.step_type === 'form' && (
        <FormStepConfig config={form.step_config} onChange={updateConfig} />
      )}
      {form.step_type === 'video' && (
        <VideoStepConfig config={form.step_config} onChange={updateConfig} />
      )}
      {form.step_type === 'body_map' && (
        <BodyMapStepConfig
          config={form.step_config}
          onChange={updateConfig}
          bodyParts={bodyParts}
          bodyPartsLoading={bodyPartsLoading}
        />
      )}
      {form.step_type === 'external_embed' && (
        <ExternalEmbedStepConfig config={form.step_config} onChange={updateConfig} />
      )}
    </div>
  )
}