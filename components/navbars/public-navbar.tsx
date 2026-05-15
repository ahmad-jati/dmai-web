'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HamburgerIcon, HouseIcon, SignOutIcon } from '@phosphor-icons/react'

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