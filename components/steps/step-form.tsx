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
  isLastForm?: boolean
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
    <div className="flex flex-col 2md:gap-1.5 gap-0.5 w-full">
      <label className="2md:text-base text-sm font-medium text-foreground flex gap-2">{field.label} <span className='text-destructive text-xl'>*</span></label>
      <div className="grid 2xs:grid-cols-5 grid-cols-3 gap-2">
        {EMOJIS.map((e, i) => (
          <button key={i} type="button" onClick={() => onChange(i + 1)}
            className={cn(
              'flex flex-col items-center gap-1.5 flex-1 sm:py-3 py-2 border rounded-xl transition-all hover:cursor-pointer group',
              value === i + 1
                ? 'border-foreground/40 bg-celeste shadow-sm'
                : 'hover:bg-celeste bg-celeste/20'
            )}>
            <span className={cn('text-xl transition-transform duration-150', value === i + 1 ? 'scale-115' : 'group-hover:scale-115')}>
              {e.emoji}
            </span>
            <span className="text-xs/3 text-foreground block font-medium">{e.label}</span>
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
    <div className="flex flex-col 2md:gap-1.5 gap-0.5 w-full">
      <div className="flex justify-between items-center mb-1">
        <label className="2md:text-base text-sm font-medium text-foreground flex gap-2">{field.label} <span className='text-destructive text-xl'>*</span></label>
        <span className="2md:text-sm text-xs font-bold text-muted-foreground border border-muted-foreground bg-muted/20 2md:px-2 px-2 py-1 2md:rounded-lg rounded-sm w-fit text-center"> 
          {current}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full cursor-pointer  "
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
    <div className="flex flex-col gap-1.5">
      <label className="2md:text-base text-sm font-medium text-foreground flex gap-2 p-0!">{field.label} <span className='text-destructive text-xl'>*</span></label>
      <textarea
        value={value ?? ''} 
        onChange={(e) => onChange(e.target.value)}
        rows={3} 
        placeholder="Tulis jawabanmu di sini..."
        className="w-full rounded-xl border border-border bg-white dark:bg-popover text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-foreground/10 focus:border-foreground/40 transition-colors"
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
      <label className="2md:text-base text-sm font-medium text-foreground flex gap-2">{field.label} <span className='text-destructive text-xl'>*</span></label>
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

export function StepForm({ fields, onNext, onPrev, showPrev, initialValues, isLastForm }: Props) {
  const [responses, setResponses] = useState<Record<string, unknown>>(initialValues ?? {})
  const getKey = (field: FormField) => field._key ?? field.id ?? field.label
  const setField = (field: FormField, value: unknown) =>
    setResponses((prev) => ({ ...prev, [getKey(field)]: value }))

  const allAnswered = fields.every((f) => {
    if (f.type === 'text_input' || f.type === 'textarea') {
      const val = responses[getKey(f)] as string | undefined
      return val !== undefined && val.trim().length > 0
    }
    if (f.type === 'checkbox_group') {
      const val = responses[getKey(f)]
      return Array.isArray(val) && val.length > 0
    }
    return responses[getKey(f)] !== undefined && responses[getKey(f)] !== null
  })

  return (
    <div className='w-full 2md:max-w-xl max-w-lg mx-auto h-full flex-1 flex justify-between flex-col'>
      <div className="flex flex-col 2md:gap-6 gap-3 flex-1 h-full">
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

      </div>
      <div className={cn('flex gap-1.5 mt-2 w-full justify-center')}>
        {showPrev && onPrev && (
          <Button 
            type="button" 
            onClick={onPrev} 
            className="hover:bg-foreground/96 hover:text-background dark:bg-transparent hover:dark:bg-foreground hover:dark:text-background  2md:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground 2md:rounded-lg rounded-sm 2md:text-p text-sm 2md:h-9 h-8!"
          >
            <ArrowLeftIcon weight="bold" className="w-4 h-4" />
            Sebelumnya
          </Button>
        )}
        <Button
          type="button"
          onClick={() => onNext(responses)}
          disabled={!allAnswered}
          variant={'ghost'}
          className="bg-foreground hover:bg-foreground/96 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-background hover:dark:text-background hover:dark:bg-foreground dark:bg-foreground 2md:rounded-lg rounded-sm 2md:text-p text-sm 2md:h-9 h-8!"
        >
          {isLastForm ? 'Selesai' : 'Selanjutnya'}
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}