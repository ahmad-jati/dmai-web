'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { FormField } from './types'

type Props = {
  fields: FormField[]
  onNext: (responses: Record<string, unknown>) => void
}

const EMOJIS = ['😞', '😕', '😐', '🙂', '😊']

function EmojiScale({ field, value, onChange }: {
  field: FormField
  value: number | undefined
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-foreground/90 dark:text-background/90 text-center">
        {field.label}
      </label>
      <div className="flex justify-center gap-3">
        {EMOJIS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className={cn(
              'text-3xl transition-all duration-150 hover:scale-110',
              value === i + 1 ? 'scale-125 drop-shadow-lg' : 'opacity-50 hover:opacity-80'
            )}
          >
            {emoji}
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground/90 dark:text-background/90">
          {field.label}
        </label>
        <span className="text-sm font-bold text-foreground/80 dark:text-background/80 min-w-8 text-right">
          {current}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-foreground h-1.5 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-xs text-foreground/50 dark:text-background/50">
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
      <label className="text-sm font-medium text-foreground/90 dark:text-background/90">
        {field.label}
      </label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Tulis jawabanmu di sini..."
        className="w-full rounded-xl border border-foreground/20 dark:border-background/20 bg-background/10 dark:bg-foreground/10 text-foreground dark:text-background placeholder:text-foreground/40 dark:placeholder:text-background/40 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-foreground/40 dark:focus:ring-background/40"
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
      <label className="text-sm font-medium text-foreground/90 dark:text-background/90">
        {field.label}
      </label>
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-all',
              selected.includes(opt)
                ? 'bg-foreground/90 dark:bg-background/90 text-background dark:text-foreground border-transparent'
                : 'bg-transparent border-foreground/30 dark:border-background/30 text-foreground/80 dark:text-background/80 hover:border-foreground/60'
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

  const setField = (id: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [id]: value }))
  }

  const allRequired = fields.every((f) => {
    const val = responses[f.id]
    if (f.type === 'textarea') return typeof val === 'string' && val.trim().length > 0
    if (f.type === 'checkbox_group') return Array.isArray(val) && val.length > 0
    return val !== undefined && val !== null
  })

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full h-full px-4 py-6 overflow-y-auto">
      <div className="flex flex-col gap-6 w-full max-w-lg">
        {fields.map((field) => {
          if (field.type === 'emoji_scale') {
            return (
              <EmojiScale
                key={field.id}
                field={field}
                value={responses[field.id] as number | undefined}
                onChange={(v) => setField(field.id, v)}
              />
            )
          }
          if (field.type === 'slider') {
            return (
              <SliderField
                key={field.id}
                field={field}
                value={responses[field.id] as number | undefined}
                onChange={(v) => setField(field.id, v)}
              />
            )
          }
          if (field.type === 'textarea') {
            return (
              <TextareaField
                key={field.id}
                field={field}
                value={responses[field.id] as string | undefined}
                onChange={(v) => setField(field.id, v)}
              />
            )
          }
          if (field.type === 'checkbox_group') {
            return (
              <CheckboxGroupField
                key={field.id}
                field={field}
                value={responses[field.id] as string[] | undefined}
                onChange={(v) => setField(field.id, v)}
              />
            )
          }
          return null
        })}
      </div>

      <button
        onClick={() => onNext(responses)}
        disabled={!allRequired}
        className={cn(
          'px-8 py-3 rounded-full font-semibold text-sm transition-all',
          allRequired
            ? 'bg-background/90 text-foreground hover:bg-background'
            : 'bg-background/30 text-foreground/40 cursor-not-allowed'
        )}
      >
        Lanjutkan →
      </button>
    </div>
  )
}
