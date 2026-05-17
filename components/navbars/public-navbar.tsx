'use client'

import Link from 'next/link'

export function MainNavbar() {

  return (
    <nav className="w-full flex justify-center items-center py-4 bg-white rounded-b-5xl border border-foreground border-t-0">
      <Link
        href="/"
        className="text-app-name hover:font-bold font-semibold"
      >
        DMAI
      </Link>
    </nav>
  )
}