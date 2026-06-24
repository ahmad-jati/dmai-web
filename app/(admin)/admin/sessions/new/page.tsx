'use client'

import { NewSessionStepper } from '@/components/admin/sessions/new-session-stepper'

export default function NewSessionPage() {
  return (
    <div className="p-10">
      <div className="flex flex-col gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold">Tambah Sesi Baru</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Buat sesi terapi baru lengkap dengan langkah-langkahnya
          </p>
        </div>
      </div>
      <NewSessionStepper />
    </div>
  )
}
