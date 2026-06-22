'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export type FormField = {
  id: string
  label: string
  type: 'emoji_scale' | 'slider' | 'textarea' | 'checkbox_group'
  min?: number
  max?: number
  options?: string[]
}

type Props = {
  fields: FormField[]
  onNext: (responses: Record<string, unknown>) => void
}

const EMOJIS = [
  { emoji: '😞', label: 'Sangat buruk' },
  { emoji: '😕', label: 'Buruk' },
  { emoji: '😐', label: 'Netral' },
  { emoji: '🙂', label: 'Baik' },
  { emoji: '😊', label: 'Sangat baik' },
]

function EmojiScale({ field, value, onChange }: {
  field: FormField
  value: number | undefined
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-foreground">{field.label}</label>
      <div className="flex justify-between gap-2">
        {EMOJIS.map((e, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className={cn(
              'flex flex-col items-center gap-1 flex-1 py-3 rounded-xl border transition-all',
              value === i + 1
                ? 'border-foreground bg-foreground/5'
                : 'border-border hover:border-foreground/40 hover:bg-muted/50'
            )}
          >
            <span className={cn('text-2xl transition-transform', value === i + 1 ? 'scale-125' : '')}>
              {e.emoji}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">{e.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SliderField({ field, value, onChange }: {
  field: FormField
  value: number | undefined
  onChange: (v: number) => void
}) {
  const min = field.min ?? 1
  const max = field.max ?? 100
  const current = value ?? Math.round((min + max) / 2)
  const pct = ((current - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">{field.label}</label>
        <span className="text-sm font-bold tabular-nums bg-muted px-2 py-0.5 rounded-md min-w-8 text-center">
          {current}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-foreground"
          style={{
            background: `linear-gradient(to right, hsl(var(--foreground)) ${pct}%, hsl(var(--muted)) ${pct}%)`
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

function TextareaField({ field, value, onChange }: {
  field: FormField
  value: string | undefined
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">{field.label}</label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Tulis jawabanmu di sini..."
        className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-colors"
      />
    </div>
  )
}

function CheckboxGroupField({ field, value, onChange }: {
  field: FormField
  value: string[] | undefined
  onChange: (v: string[]) => void
}) {
  const selected = value ?? []
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt))
    else onChange([...selected, opt])
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">{field.label}</label>
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-all',
              selected.includes(opt)
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background border-border text-foreground hover:border-foreground/60 hover:bg-muted/50'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export function StepForm({ fields, onNext }: Props) {
  const [responses, setResponses] = useState<Record<string, unknown>>({})

  const setField = (id: string, value: unknown) =>
    setResponses((prev) => ({ ...prev, [id]: value }))

  // Only require non-textarea fields — textarea is optional feel
  const allAnswered = fields.every((f) => {
    const val = responses[f.id]
    if (f.type === 'textarea') return true // optional
    if (f.type === 'checkbox_group') return Array.isArray(val) && val.length > 0
    return val !== undefined && val !== null
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
      {fields.map((field) => {
        if (field.type === 'emoji_scale') {
          return (
            <EmojiScale key={field.id} field={field}
              value={responses[field.id] as number | undefined}
              onChange={(v) => setField(field.id, v)} />
          )
        }
        if (field.type === 'slider') {
          return (
            <SliderField key={field.id} field={field}
              value={responses[field.id] as number | undefined}
              onChange={(v) => setField(field.id, v)} />
          )
        }
        if (field.type === 'textarea') {
          return (
            <TextareaField key={field.id} field={field}
              value={responses[field.id] as string | undefined}
              onChange={(v) => setField(field.id, v)} />
          )
        }
        if (field.type === 'checkbox_group') {
          return (
            <CheckboxGroupField key={field.id} field={field}
              value={responses[field.id] as string[] | undefined}
              onChange={(v) => setField(field.id, v)} />
          )
        }
        return null
      })}

      <button
        type="button"
        onClick={() => onNext(responses)}
        disabled={!allAnswered}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2',
          allAnswered
            ? 'bg-foreground text-background hover:bg-foreground/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
      >
        Lanjutkan →
      </button>
    </div>
  )
}