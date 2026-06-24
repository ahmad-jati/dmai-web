'use client'

import { useState } from 'react'
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
type Props = { onNext: (response: BodyMapResponse) => void; onPrev?: () => void; initialValues?: BodyMapResponse }

export function StepBodyMap({ onNext, onPrev, initialValues }: Props) {
  const [selected, setSelected] = useState<string[]>(initialValues?.selected_parts ?? [])
  const [sensation, setSensation] = useState<string | null>(initialValues?.sensation ?? null)
  const [note, setNote] = useState(initialValues?.note ?? '')

  const toggle = (key: string) =>
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg mx-auto">
      {/* <div className="flex flex-col gap-1">
        <p className="text-lg/3.5 sm:text-sm font-medium text-foreground">Bagian tubuh mana yang terasa tidak nyaman? Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quae enim obcaecati exercitationem aliquam aperiam alias, quam sequi, laborum quos vitae numquam esse itaque, dicta ut tenetur inventore consequatur beatae necessitatibus.</p>
        <p className="text-xs font-medium text-muted-foreground">Pilih semua yang relevan. Boleh dikosongkan jika tidak ada.</p>
      </div> */}

      <div className="flex flex-col gap-4">
        {REGIONS.map((region) => (
          <div key={region.key} className="flex flex-col gap-2">
            <span className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
              {region.label}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {region.parts.map((part) => (
                <button
                  key={part.key}
                  type="button"
                  onClick={() => toggle(part.key)}
                  className={cn(
                    'px-2 py-2 rounded-lg text-xs font-medium border transition-all text-center',
                    selected.includes(part.key)
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background border-border text-foreground hover:border-foreground/40 hover:bg-muted/50'
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
                onClick={() => setSensation(s === sensation ? null : s)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                  sensation === s
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background border-border text-foreground hover:border-foreground/40'
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
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Deskripsikan lebih lanjut jika perlu..."
            className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-colors"
          />
        </div>
      )}

      <div className={cn('flex gap-3 mt-1', onPrev ? 'justify-between' : 'justify-end')}>
        {onPrev && (
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
          onClick={() => onNext({ selected_parts: selected, sensation, note })}
          className="bg-lemon hover:bg-lemon dark:bg-primary sm:[&_svg]:size-4 [&_svg]:size-3.5 text-foreground hover:dark:text-foreground rounded-lg"
        >
          {selected.length === 0 ? 'Tidak ada, lanjutkan' : 'Lanjutkan'}
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}