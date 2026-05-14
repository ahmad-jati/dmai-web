'use client'

import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

export function MainNavbar(){
  const router = useRouter()

  return(
    <nav className="w-full flex justify-center items-center py-4 bg-white rounded-b-5xl border border-foreground border-t-0">
      <h1 className="text-app-name">DMAI</h1>

      {/* <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push("/auth/login")}
        >
          Login
        </Button>

        <Button
          onClick={() => router.push("/auth/sign-up")}
        >
          Sign Up
        </Button>
      </div> */}
    </nav>
  )
}