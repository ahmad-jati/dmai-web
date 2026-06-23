'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export type FormFieldType = 'emoji_scale' | 'slider' | 'textarea' | 'text_input' | 'checkbox_group'

export type FormField = {
  _key?: string
  id?: string
  label: string
  type: FormFieldType
  min?: number
  max?: number
  options?: string[]
}

type Props = {
  fields: FormField[]
  onNext: (responses: Record<string, unknown>) => void
  onPrev?: () => void
  showPrev?: boolean
  initialValues?: Record<string, unknown>
}

const EMOJIS = [
  { emoji: '😞', label: 'Sangat buruk' },
  { emoji: '😕', label: 'Buruk' },
  { emoji: '😐', label: 'Netral' },
  { emoji: '🙂', label: 'Baik' },
  { emoji: '😊', label: 'Sangat baik' },
]

function EmojiScale({ field, value, onChange }: {
  field: FormField; value: number | undefined; onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-base sm:text-sm font-medium text-foreground flex gap-2">{field.label} <span className='text-destructive text-xl'>*</span></label>
      <div className="flex justify-between gap-2">
        {EMOJIS.map((e, i) => (
          <button key={i} type="button" onClick={() => onChange(i + 1)}
            className={cn(
              'flex flex-col items-center gap-1.5 flex-1 py-3 rounded-xl border transition-all',
              value === i + 1
                ? 'border-foreground bg-foreground/5 shadow-sm'
                : 'border-border hover:border-foreground/30 hover:bg-muted/50'
            )}>
            <span className={cn('text-xl transition-transform duration-150', value === i + 1 ? 'scale-115' : '')}>
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
  field: FormField; value: number | undefined; onChange: (v: number) => void
}) {
  const min = field.min ?? 1
  const max = field.max ?? 100
  const current = value ?? 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-base sm:text-sm font-medium text-foreground flex gap-2">{field.label} <span className='text-destructive text-xl'>*</span></label>
        <span className="text-sm font-bold tabular-nums bg-muted px-2.5 py-0.5 rounded-lg min-w-10 text-center"> 
          {current}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

function TextInputField({ field, value, onChange }: {
  field: FormField; value: string | undefined; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-base sm:text-sm font-medium text-foreground flex gap-2">{field.label} <span className='text-destructive text-xl'>*</span></label>
      <textarea
        value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        rows={3} placeholder="Tulis jawabanmu di sini..."
        className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-colors"
      />
    </div>
  )
}

function CheckboxGroupField({ field, value, onChange }: {
  field: FormField; value: string[] | undefined; onChange: (v: string[]) => void
}) {
  const selected = value ?? []
  const toggle = (opt: string) =>
    selected.includes(opt) ? onChange(selected.filter((s) => s !== opt)) : onChange([...selected, opt])
  return (
    <div className="flex flex-col gap-2">
      <label className="text-base sm:text-sm font-medium text-foreground flex gap-2">{field.label} <span className='text-destructive text-xl'>*</span></label>
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map((opt) => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-all',
              selected.includes(opt)
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background border-border text-foreground hover:border-foreground/50 hover:bg-muted/50'
            )}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export function StepForm({ fields, onNext, onPrev, showPrev, initialValues }: Props) {
  const [responses, setResponses] = useState<Record<string, unknown>>(initialValues ?? {})
  const getKey = (field: FormField) => field._key ?? field.id ?? field.label
  const setField = (field: FormField, value: unknown) =>
    setResponses((prev) => ({ ...prev, [getKey(field)]: value }))

  const allAnswered = fields.every((f) => {
    if (f.type === 'text_input' || f.type === 'textarea') return true
    if (f.type === 'checkbox_group') {
      const val = responses[getKey(f)]
      return Array.isArray(val) && val.length > 0
    }
    return responses[getKey(f)] !== undefined && responses[getKey(f)] !== null
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
      {fields.map((field) => {
        const key = getKey(field)

        if (field.type === 'emoji_scale') {
          return (
            <EmojiScale
              key={key}
              field={field}
              value={responses[key] as number | undefined}
              onChange={(v) => setField(field, v)}
            />
          )
        }

        if (field.type === 'slider') {
          return (
            <SliderField
              key={key}
              field={field}
              value={responses[key] as number | undefined}
              onChange={(v) => setField(field, v)}
            />
          )
        }

        if (field.type === 'text_input' || field.type === 'textarea') {
          return (
            <TextInputField
              key={key}
              field={field}
              value={responses[key] as string | undefined}
              onChange={(v) => setField(field, v)}
            />
          )
        }

        // if (field.type === 'checkbox_group') {
        //   return (
        //     <CheckboxGroupField
        //       key={key}
        //       field={field}
        //       value={responses[key] as string[] | undefined}
        //       onChange={(v) => setField(field, v)}
        //     />
        //   )
        // }

        return null
      })}

      <div className={cn('flex gap-3 mt-2', showPrev ? 'justify-between' : 'justify-end')}>
        {showPrev && onPrev && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onPrev} 
            className="hover:bg-lemon dark:bg-primary sm:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground hover:dark:text-foreground rounded-lg"
          >
            <ArrowLeftIcon weight="bold" className="w-4 h-4" />
            Kembali
          </Button>
        )}
        <Button
          type="button"
          onClick={() => onNext(responses)}
          disabled={!allAnswered}
          variant={'ghost'}
          className="bg-lemon hover:bg-lemon dark:bg-primary sm:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground hover:dark:text-foreground rounded-lg"
        >
          Lanjut
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}