import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tambah Sesi — DAMAI Admin',
}

export default function NewSessionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
