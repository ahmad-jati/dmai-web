'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const BODY_PARTS = [
  { key: 'kepala_kanan', label: 'Kepala Kanan', region: 'kepala' },
  { key: 'kepala_kiri', label: 'Kepala Kiri', region: 'kepala' },
  { key: 'dahi', label: 'Dahi', region: 'kepala' },
  { key: 'pelipis_kanan', label: 'Pelipis Kanan', region: 'kepala' },
  { key: 'pelipis_kiri', label: 'Pelipis Kiri', region: 'kepala' },
  { key: 'rahang_kanan', label: 'Rahang Kanan', region: 'kepala' },
  { key: 'rahang_kiri', label: 'Rahang Kiri', region: 'kepala' },
  { key: 'tengkuk', label: 'Tengkuk', region: 'kepala' },
  { key: 'leher', label: 'Leher', region: 'leher_bahu' },
  { key: 'bahu_kanan', label: 'Bahu Kanan', region: 'leher_bahu' },
  { key: 'bahu_kiri', label: 'Bahu Kiri', region: 'leher_bahu' },
  { key: 'dada', label: 'Dada', region: 'dada_perut' },
  { key: 'perut_atas', label: 'Perut Atas', region: 'dada_perut' },
  { key: 'perut_bawah', label: 'Perut Bawah', region: 'dada_perut' },
  { key: 'punggung_atas', label: 'Punggung Atas', region: 'punggung' },
  { key: 'punggung_bawah', label: 'Punggung Bawah', region: 'punggung' },
  { key: 'pinggang', label: 'Pinggang', region: 'punggung' },
  { key: 'lengan_atas_kanan', label: 'Lengan Atas Kanan', region: 'lengan' },
  { key: 'lengan_atas_kiri', label: 'Lengan Atas Kiri', region: 'lengan' },
  { key: 'siku_kanan', label: 'Siku Kanan', region: 'lengan' },
  { key: 'siku_kiri', label: 'Siku Kiri', region: 'lengan' },
  { key: 'lengan_bawah_kanan', label: 'Lengan Bawah Kanan', region: 'lengan' },
  { key: 'lengan_bawah_kiri', label: 'Lengan Bawah Kiri', region: 'lengan' },
  { key: 'pergelangan_kanan', label: 'Pergelangan Kanan', region: 'lengan' },
  { key: 'pergelangan_kiri', label: 'Pergelangan Kiri', region: 'lengan' },
  { key: 'paha_kanan', label: 'Paha Kanan', region: 'kaki' },
  { key: 'paha_kiri', label: 'Paha Kiri', region: 'kaki' },
  { key: 'lutut_kanan', label: 'Lutut Kanan', region: 'kaki' },
  { key: 'lutut_kiri', label: 'Lutut Kiri', region: 'kaki' },
  { key: 'betis_kanan', label: 'Betis Kanan', region: 'kaki' },
  { key: 'betis_kiri', label: 'Betis Kiri', region: 'kaki' },
  { key: 'pergelangan_kaki_kanan', label: 'Pergelangan Kaki Kanan', region: 'kaki' },
  { key: 'pergelangan_kaki_kiri', label: 'Pergelangan Kaki Kiri', region: 'kaki' },
  { key: 'telapak_kaki_kanan', label: 'Telapak Kaki Kanan', region: 'kaki' },
  { key: 'telapak_kaki_kiri', label: 'Telapak Kaki Kiri', region: 'kaki' },
]

const SENSATIONS = ['lelah', 'sakit', 'tegang', 'kebas', 'panas', 'lainnya']

const REGION_LABELS: Record<string, string> = {
  kepala: 'Kepala',
  leher_bahu: 'Leher & Bahu',
  dada_perut: 'Dada & Perut',
  punggung: 'Punggung',
  lengan: 'Lengan',
  kaki: 'Kaki',
}

type BodyMapResponse = {
  selected_parts: string[]
  sensation: string | null
  note: string
}

type Props = {
  onNext: (response: BodyMapResponse) => void
}

export function StepBodyMap({ onNext }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [sensation, setSensation] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const regions = Array.from(new Set(BODY_PARTS.map((p) => p.region)))

  return (
    <div className="flex flex-col items-center gap-5 w-full h-full px-4 py-4 overflow-y-auto">
      <div className="flex flex-col gap-1 text-center">
        <p className="text-background/90 dark:text-foreground/90 font-semibold text-lg">
          Bagian Tubuh yang Terasa Tidak Nyaman
        </p>
        <p className="text-background/70 dark:text-foreground/70 text-sm">
          Pilih satu atau lebih bagian tubuh yang terasa lelah, sakit, atau tegang saat ini.
        </p>
      </div>

      {/* Body part grid by region */}
      <div className="flex flex-col gap-3 w-full max-w-lg">
        {regions.map((region) => (
          <div key={region} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-widest uppercase text-background/50 dark:text-foreground/50">
              {REGION_LABELS[region]}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BODY_PARTS.filter((p) => p.region === region).map((part) => (
                <button
                  key={part.key}
                  onClick={() => toggle(part.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    selected.includes(part.key)
                      ? 'bg-background/90 dark:bg-foreground/90 text-foreground dark:text-background border-transparent'
                      : 'bg-transparent border-background/30 dark:border-foreground/30 text-background/80 dark:text-foreground/80 hover:border-background/60'
                  )}
                >
                  {part.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sensation selector */}
      {selected.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-lg">
          <p className="text-sm font-medium text-background/90 dark:text-foreground/90">
            Sensasi yang dirasakan:
          </p>
          <div className="flex flex-wrap gap-2">
            {SENSATIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSensation(s === sensation ? null : s)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize',
                  sensation === s
                    ? 'bg-background/90 dark:bg-foreground/90 text-foreground dark:text-background border-transparent'
                    : 'bg-transparent border-background/30 dark:border-foreground/30 text-background/80 dark:text-foreground/80 hover:border-background/60'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional note */}
      {selected.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-lg">
          <label className="text-sm font-medium text-background/90 dark:text-foreground/90">
            Catatan tambahan (opsional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Deskripsikan lebih lanjut jika perlu..."
            className="w-full rounded-xl border border-background/20 dark:border-foreground/20 bg-background/10 dark:bg-foreground/10 text-foreground dark:text-background placeholder:text-foreground/40 dark:placeholder:text-background/40 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-background/40"
          />
        </div>
      )}

      <button
        onClick={() => onNext({ selected_parts: selected, sensation, note })}
        className="px-8 py-3 rounded-full bg-background/90 text-foreground font-semibold text-sm hover:bg-background transition-all"
      >
        {selected.length === 0 ? 'Tidak Ada, Lanjutkan →' : 'Lanjutkan →'}
      </button>
    </div>
  )
}
