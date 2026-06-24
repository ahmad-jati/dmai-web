'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Route } from 'next'

export function MainNavbar() {
  const [href, setHref] = useState('/')

  useEffect(() => {
    const supabase = createClient()

    const checkUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (user) {
        setHref('/homepage')
      }
    }

    checkUser()
  }, [])

  return (
    <nav className="w-full flex justify-center items-center py-4 bg-white dark:bg-secondary sm:rounded-b-5xl rounded-b-xl border border-foreground border-t-0">
      <Link
        href={href as Route}
        className="hover:font-bold font-semibold sm:text-app-name text-h2 text-foreground"
      >
        DMAI
      </Link>
    </nav>
  )
}