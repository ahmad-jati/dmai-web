'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@phosphor-icons/react'
import type {
  StepType,
  StepConfig,
  FormField,
  FormFieldType,
} from './types'
import { STEP_TYPE_LABELS } from './types'

// ─── Step Type Selector ────────────────────────────────────────────────────────

export function StepTypeSelector({
  value,
  onChange,
}: {
  value: StepType
  onChange: (v: StepType) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Tipe Step</Label>
      <Select value={value} onValueChange={(v) => onChange(v as StepType)}>
        <SelectTrigger className="rounded-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(STEP_TYPE_LABELS) as [StepType, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ─── Form Field Builder ────────────────────────────────────────────────────────

const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  emoji_scale: 'Skala Emoji',
  slider: 'Slider (angka)',
  textarea: 'Teks Panjang',
  checkbox_group: 'Pilihan Ganda',
}

function FormFieldRow({
  field,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  field: FormField
  index: number
  total: number
  onChange: (updated: FormField) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div className="flex flex-col gap-2 p-3 border border-border rounded-sm bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Field {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 [&_svg]:size-3"
            onClick={onMoveUp}
            disabled={index === 0}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 [&_svg]:size-3"
            onClick={onMoveDown}
            disabled={index === total - 1}
          >
            <ArrowDownIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 [&_svg]:size-3 hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <TrashIcon />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <Label className="text-xs">Pertanyaan / Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
              placeholder="contoh: Skala stres hari ini"
              className="h-8 text-sm rounded-sm"
            />
          </div>
          <div className="w-40 flex flex-col gap-1">
            <Label className="text-xs">Tipe Input</Label>
            <Select
              value={field.type}
              onValueChange={(v) => onChange({ ...field, type: v as FormFieldType })}
            >
              <SelectTrigger className="h-8 text-sm rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(FIELD_TYPE_LABELS) as [FormFieldType, string][]).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key} className="text-sm">
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">ID (key)</Label>
          <Input
            value={field.id}
            onChange={(e) => onChange({ ...field, id: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
            placeholder="contoh: stress_scale"
            className="h-7 text-xs rounded-sm font-mono"
          />
        </div>

        {field.type === 'slider' && (
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                value={field.min ?? 1}
                onChange={(e) => onChange({ ...field, min: Number(e.target.value) })}
                className="h-7 text-sm rounded-sm"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <Label className="text-xs">Max</Label>
              <Input
                type="number"
                value={field.max ?? 100}
                onChange={(e) => onChange({ ...field, max: Number(e.target.value) })}
                className="h-7 text-sm rounded-sm"
              />
            </div>
          </div>
        )}

        {field.type === 'checkbox_group' && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Pilihan</Label>
            {(field.options ?? []).map((opt, i) => (
              <div key={i} className="flex gap-1.5">
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...(field.options ?? [])]
                    newOpts[i] = e.target.value
                    onChange({ ...field, options: newOpts })
                  }}
                  placeholder={`Pilihan ${i + 1}`}
                  className="h-7 text-sm rounded-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 [&_svg]:size-3 hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => {
                    const newOpts = (field.options ?? []).filter((_, idx) => idx !== i)
                    onChange({ ...field, options: newOpts })
                  }}
                >
                  <TrashIcon />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded-sm text-xs gap-1 w-fit [&_svg]:size-3"
              onClick={() => onChange({ ...field, options: [...(field.options ?? []), ''] })}
            >
              <PlusIcon />
              Tambah Pilihan
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function FormConfigEditor({
  config,
  onChange,
}: {
  config: { fields: FormField[]; feedback_point?: 'pre' | 'post' }
  onChange: (c: typeof config) => void
}) {
  const fields = config.fields ?? []

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'textarea',
    }
    onChange({ ...config, fields: [...fields, newField] })
  }

  const updateField = (index: number, updated: FormField) => {
    const next = [...fields]
    next[index] = updated
    onChange({ ...config, fields: next })
  }

  const deleteField = (index: number) => {
    onChange({ ...config, fields: fields.filter((_, i) => i !== index) })
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const next = [...fields]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
    onChange({ ...config, fields: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Switch
          id="feedback-point"
          checked={config.feedback_point === 'pre'}
          onCheckedChange={(checked) =>
            onChange({ ...config, feedback_point: checked ? 'pre' : 'post' })
          }
        />
        <Label htmlFor="feedback-point" className="text-sm cursor-pointer">
          Form ini muncul <strong>{config.feedback_point === 'pre' ? 'sebelum' : 'sesudah'}</strong> narasi
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        {fields.map((field, i) => (
          <FormFieldRow
            key={field.id + i}
            field={field}
            index={i}
            total={fields.length}
            onChange={(updated) => updateField(i, updated)}
            onDelete={() => deleteField(i)}
            onMoveUp={() => moveField(i, 'up')}
            onMoveDown={() => moveField(i, 'down')}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="rounded-sm gap-1.5 [&_svg]:size-3.5 w-fit"
        onClick={addField}
      >
        <PlusIcon />
        Tambah Field
      </Button>
    </div>
  )
}

// ─── Main: Step Config Editor ──────────────────────────────────────────────────

export function StepConfigEditor({
  stepType,
  config,
  onChange,
}: {
  stepType: StepType
  config: StepConfig
  onChange: (c: StepConfig) => void
}) {
  if (stepType === 'narration' || stepType === 'body_map') {
    return (
      <p className="text-xs text-muted-foreground italic">
        {stepType === 'narration'
          ? 'Narasi menggunakan judul, deskripsi, audio, dan gambar di atas.'
          : 'Body map menggunakan daftar anggota tubuh yang sudah tersedia di database.'}
      </p>
    )
  }

  if (stepType === 'video') {
    const c = config as { youtube_url?: string }
    return (
      <div className="flex flex-col gap-1.5">
        <Label>YouTube URL</Label>
        <Input
          value={c.youtube_url ?? ''}
          onChange={(e) => onChange({ youtube_url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
          className="rounded-sm font-mono text-sm"
        />
      </div>
    )
  }

  if (stepType === 'external_embed') {
    const c = config as { url?: string; label?: string }
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>URL External</Label>
          <Input
            value={c.url ?? ''}
            onChange={(e) => onChange({ ...c, url: e.target.value })}
            placeholder="https://www.mentimeter.com/..."
            className="rounded-sm font-mono text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Label Tombol</Label>
          <Input
            value={c.label ?? ''}
            onChange={(e) => onChange({ ...c, label: e.target.value })}
            placeholder="contoh: Buka Mentimeter"
            className="rounded-sm text-sm"
          />
        </div>
      </div>
    )
  }

  if (stepType === 'game') {
    const c = config as { game_type?: string; duration_seconds?: number }
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Tipe Game</Label>
          <Select
            value={c.game_type ?? 'focus_concentration'}
            onValueChange={(v) => onChange({ ...c, game_type: v })}
          >
            <SelectTrigger className="rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="focus_concentration">Fokus & Konsentrasi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Durasi Game (detik)</Label>
          <Input
            type="number"
            value={c.duration_seconds ?? 120}
            onChange={(e) => onChange({ ...c, duration_seconds: Number(e.target.value) })}
            className="rounded-sm"
          />
        </div>
      </div>
    )
  }

  if (stepType === 'form') {
    const c = config as { fields?: FormField[]; feedback_point?: 'pre' | 'post' }
    return (
      <FormConfigEditor
        config={{ fields: c.fields ?? [], feedback_point: c.feedback_point ?? 'pre' }}
        onChange={(updated) => onChange(updated)}
      />
    )
  }

  return null
}
