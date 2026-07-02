'use client'

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function SplashScreen() {
  const pathname = usePathname()
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  const skip = pathname === '/not-found'

  useEffect(() => {
    if (skip) return

    document.body.style.overflow = 'hidden'

    const fadeTimer = setTimeout(() => setFading(true), 2400)
    const removeTimer = setTimeout(() => setGone(true), 3000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [skip])

  useEffect(() => {
    if (gone) document.body.style.overflow = ''
  }, [gone])

  if (skip || gone) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-background dark:bg-card"
      style={{
        transform: fading ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 600ms ease-in-out',
        pointerEvents: fading ? 'none' : 'auto',
      }}
      onTransitionEnd={() => {
        if (fading) setGone(true)
      }}
    >
      <style>{`
        @keyframes splash-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>

      <div className="flex flex-col items-center gap-2 text-center">
        <p
          className="text-h1 font-semibold tracking-tight"
          style={{ animation: 'splash-fadein 0.6s ease-out 0.3s both' }}
        >
          DMAI
        </p>
        <p
          className="text-base text-muted-foreground font-medium"
          style={{ animation: 'splash-fadein 0.6s ease-out 0.7s both' }}
        >
          Digital Mindful Autogenic Intervention
        </p>
      </div>

      <div
        className="w-40 h-0.5 bg-foreground/10 rounded-full overflow-hidden"
        style={{ animation: 'splash-fadein 0.4s ease-out 0.5s both' }}
      >
        <div
          className="h-full w-full bg-foreground/40 rounded-full origin-left"
          style={{ animation: 'splash-progress 2.4s ease-in-out 0.5s both' }}
        />
      </div>
    </div>
  )
}