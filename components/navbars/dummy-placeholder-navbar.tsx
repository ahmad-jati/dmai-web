'use client'

import Link from 'next/link'

export function DummyPlaceholderNavbar() {

  return (
    <nav className="flex z-1 justify-center items-center sm:p-5.5 xs:p-6.5 p-4.5 border-2 bg-transparent border-transparent w-fit">
      <Link
        href="/"  
        className="hover:font-bold font-semibold sm:text-app-name text-h2 text-transparent"
      >
        DMAI
      </Link>
    </nav>
  )
}