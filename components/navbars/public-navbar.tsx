'use client'

import Link from 'next/link'

export function MainNavbar() {

  return (
    <nav className="w-full flex justify-center items-center py-4 bg-white dark:bg-foreground sm:rounded-b-5xl rounded-b-xl border border-foreground border-t-0">
      <Link
        href="/"
        className="hover:font-bold font-semibold sm:text-app-name text-h2 dark:text-background text-foreground"
      >
        DMAI
      </Link>
    </nav>
  )
}