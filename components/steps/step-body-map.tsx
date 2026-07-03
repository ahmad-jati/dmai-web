'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { BodyMapRegion } from '@/lib/body-map-region'

// Group parts by region, preserve order
const REGION_LABELS: Record<string, string> = {
  kepala: 'Kepala',
  leher_bahu: 'Leher & Bahu',
  dada_perut: 'Dada & Perut',
  punggung: 'Punggung',
  lengan: 'Lengan & Tangan',
  kaki: 'Kaki',
}

const REGION_ORDER = Object.keys(REGION_LABELS)

const REGIONS = REGION_ORDER.map((regionKey) => ({
  key: regionKey,
  label: REGION_LABELS[regionKey],
  parts: BodyMapRegion
    .filter((p) => p.region === regionKey)
    .map((p) => ({ key: p.id, label: p.label_id })),
}))

const SENSATIONS = ['Lelah', 'Sakit', 'Tegang', 'Kebas', 'Panas', 'Lainnya']

type BodyMapResponse = { selected_parts: string[]; sensation: string | null; note: string }
type Props = { onNext: (response: BodyMapResponse) => void; onPrev?: () => void; initialValues?: BodyMapResponse; onDraftChange?: (draft: BodyMapResponse) => void }

export function StepBodyMap({ onNext, onPrev, initialValues, onDraftChange }: Props) {
  const [selected, setSelected] = useState(initialValues?.selected_parts ?? [])
  const [sensation, setSensation] = useState(initialValues?.sensation ?? null)
  const [note, setNote] = useState(initialValues?.note ?? '')

  const draft = { selected_parts: selected, sensation, note }

  // Debounce onDraftChange for the note field so parent doesn't re-render
  // on every keystroke (which resets scroll position)
  const debounceRef = useRef(undefined as ReturnType<typeof setTimeout> | undefined)

  const handleNote = (val: string) => {
    setNote(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onDraftChange?.({ selected_parts: selected, sensation, note: val })
    }, 500)
  }

  const toggle = (key: string) => {
    const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]
    setSelected(next)
    onDraftChange?.({ selected_parts: next, sensation, note })
  }

  const handleSensation = (s: string) => {
    const next = s === sensation ? null : s
    setSensation(next)
    onDraftChange?.({ selected_parts: selected, sensation: next, note })
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg mx-auto flex-1">

      <div className='flex flex-col gap-5 h-fit pr-1'>
        <div className="flex flex-col gap-4">
          {REGIONS.map((region) => (
            <div key={region.key} className="flex flex-col gap-2">
              <span className="2xs:text-sm text-xs font-semibold uppercase text-muted-foreground">
                {region.label}
              </span>
              <div className="grid 2xs:grid-cols-4 xs:grid-cols-3 grid-cols-2 gap-1.5">
                {region.parts.map((part) => (
                  <button
                    key={part.key}
                    type="button"
                    onClick={() => toggle(part.key)}                  
                    className={cn(
                      'px-2 py-2 rounded-lg text-xs font-medium border transition-all text-center hover:cursor-pointer',
                      selected.includes(part.key)
                        ? 'border-foreground/40 bg-celeste shadow-sm font-semibold'
                        : 'hover:bg-celeste bg-celeste/20'
                    )}
                  >
                    {part.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Sensasi yang dirasakan:</p>
            <div className="flex flex-wrap gap-2">
              {SENSATIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSensation(s)}
                  className={cn(
                    'px-3 py-1.5 2md:rounded-full rounded-lg 2xs:text-sm text-xs font-medium border transition-all hover:cursor-pointer',
                    sensation === s
                      ? 'border-foreground/40 bg-celeste shadow-sm'
                      : 'hover:bg-celeste bg-celeste/20'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {selected.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Catatan tambahan <span className="font-normal text-muted-foreground">(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => handleNote(e.target.value)}
              rows={2}
              placeholder="Deskripsikan lebih lanjut jika perlu..."
              className="w-full rounded-xl border border-border bg-white dark:bg-popover text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
            />
          </div>
        )}
      </div>

    <div className={cn('flex gap-1.5 justify-center')}>
      {onPrev && (
        <Button
          type="button"
          onClick={onPrev}
          className="hover:bg-foreground/96 hover:text-background dark:bg-transparent hover:dark:bg-foreground hover:dark:text-background 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground 2md:rounded-lg rounded-sm 2md:text-p text-sm 2md:h-9 h-8!"
        >
          <ArrowLeftIcon weight="bold" className="w-4 h-4" />
          Sebelumnya
        </Button>
      )}
      <Button
        type="button"
        onClick={() => onNext({ selected_parts: selected, sensation, note })}
        disabled={selected.length === 0}
        variant={'ghost'}
        className="bg-foreground hover:bg-foreground/96 2md:[&_svg]:size-4 [&_svg]:size-3.5 text-background hover:dark:text-background hover:dark:bg-foreground dark:bg-foreground 2md:rounded-lg rounded-sm 2md:text-p text-sm 2md:h-9 h-8! disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Selanjutnya
        <ArrowRightIcon weight="bold" className="w-4 h-4" />
      </Button>
    </div>
    </div>
  )
}