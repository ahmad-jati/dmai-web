'use client'

import { useEffect, useState } from "react"

export function SplashScreen() {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2400)
    return () => clearTimeout(fadeTimer)
  }, [])

  if (gone) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-celeste"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 600ms ease-out',
        pointerEvents: 'none',
      }}
      onTransitionEnd={() => setGone(true)}
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