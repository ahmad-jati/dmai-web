'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'

const REGIONS = [
  {
    key: 'kepala', label: 'Kepala',
    parts: [
      { key: 'kepala_kanan', label: 'Kepala Kanan' }, { key: 'kepala_kiri', label: 'Kepala Kiri' },
      { key: 'dahi', label: 'Dahi' }, { key: 'pelipis_kanan', label: 'Pelipis Kanan' },
      { key: 'pelipis_kiri', label: 'Pelipis Kiri' }, { key: 'rahang_kanan', label: 'Rahang Kanan' },
      { key: 'rahang_kiri', label: 'Rahang Kiri' }, { key: 'tengkuk', label: 'Tengkuk' },
    ],
  },
  {
    key: 'leher_bahu', label: 'Leher & Bahu',
    parts: [
      { key: 'leher', label: 'Leher' }, { key: 'bahu_kanan', label: 'Bahu Kanan' }, { key: 'bahu_kiri', label: 'Bahu Kiri' },
    ],
  },
  {
    key: 'dada_perut', label: 'Dada & Perut',
    parts: [
      { key: 'dada', label: 'Dada' }, { key: 'perut_atas', label: 'Perut Atas' }, { key: 'perut_bawah', label: 'Perut Bawah' },
    ],
  },
  {
    key: 'punggung', label: 'Punggung',
    parts: [
      { key: 'punggung_atas', label: 'Punggung Atas' }, { key: 'punggung_bawah', label: 'Punggung Bawah' }, { key: 'pinggang', label: 'Pinggang' },
    ],
  },
  {
    key: 'lengan', label: 'Lengan & Tangan',
    parts: [
      { key: 'lengan_atas_kanan', label: 'Lengan Atas Kanan' }, { key: 'lengan_atas_kiri', label: 'Lengan Atas Kiri' },
      { key: 'siku_kanan', label: 'Siku Kanan' }, { key: 'siku_kiri', label: 'Siku Kiri' },
      { key: 'lengan_bawah_kanan', label: 'Lengan Bawah Kanan' }, { key: 'lengan_bawah_kiri', label: 'Lengan Bawah Kiri' },
      { key: 'pergelangan_kanan', label: 'Pergelangan Kanan' }, { key: 'pergelangan_kiri', label: 'Pergelangan Kiri' },
    ],
  },
  {
    key: 'kaki', label: 'Kaki',
    parts: [
      { key: 'paha_kanan', label: 'Paha Kanan' }, { key: 'paha_kiri', label: 'Paha Kiri' },
      { key: 'lutut_kanan', label: 'Lutut Kanan' }, { key: 'lutut_kiri', label: 'Lutut Kiri' },
      { key: 'betis_kanan', label: 'Betis Kanan' }, { key: 'betis_kiri', label: 'Betis Kiri' },
      { key: 'pergelangan_kaki_kanan', label: 'Pergelangan Kaki Kanan' }, { key: 'pergelangan_kaki_kiri', label: 'Pergelangan Kaki Kiri' },
      { key: 'telapak_kaki_kanan', label: 'Telapak Kaki Kanan' }, { key: 'telapak_kaki_kiri', label: 'Telapak Kaki Kiri' },
    ],
  },
]

const SENSATIONS = ['Lelah', 'Sakit', 'Tegang', 'Kebas', 'Panas', 'Lainnya']

type BodyMapResponse = { selected_parts: string[]; sensation: string | null; note: string }
type Props = { onNext: (response: BodyMapResponse) => void; onPrev?: () => void }

export function StepBodyMap({ onNext, onPrev }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [sensation, setSensation] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const toggle = (key: string) =>
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg mx-auto">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">Bagian tubuh mana yang terasa tidak nyaman?</p>
        <p className="text-xs text-muted-foreground">Pilih semua yang relevan. Boleh dikosongkan jika tidak ada.</p>
      </div>

      <div className="flex flex-col gap-4">
        {REGIONS.map((region) => (
          <div key={region.key} className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{region.label}</span>
            <div className="grid grid-cols-3 gap-1.5">
              {region.parts.map((part) => (
                <button key={part.key} type="button" onClick={() => toggle(part.key)}
                  className={cn('px-2 py-2 rounded-lg text-xs font-medium border transition-all text-center',
                    selected.includes(part.key)
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background border-border text-foreground hover:border-foreground/40 hover:bg-muted/50')}>
                  {part.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Sensasi yang dirasakan:</p>
        <div className="flex flex-wrap gap-2">
          {SENSATIONS.map((s) => (
            <button key={s} type="button" onClick={() => setSensation(s === sensation ? null : s)}
              className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                sensation === s ? 'bg-foreground text-background border-foreground' : 'bg-background border-border text-foreground hover:border-foreground/40')}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* {selected.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Catatan tambahan <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Deskripsikan lebih lanjut jika perlu..."
            className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-colors" />
        </div>
      )} */}

      <div className={cn('flex gap-3 mt-1', onPrev ? 'justify-between' : 'justify-end')}>
        {onPrev && (
          <button type="button" onClick={onPrev}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-all">
            <ArrowLeftIcon weight="bold" className="w-4 h-4" /> Kembali
          </button>
        )}
        <button type="button" onClick={() => onNext({ selected_parts: selected, sensation, note })}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all">
          {selected.length === 0 ? 'Tidak ada, lanjutkan' : 'Lanjutkan'}
          <ArrowRightIcon weight="bold" className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}