'use client'

import Image from "next/image";
import { Button } from "../../ui/button";
import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Route } from "next";

export function HeroOnboarding() {
  const [splashDone, setSplashDone] = useState(false)
  const [splashFading, setSplashFading] = useState(false)
  const [contentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    // Start fade-out at 2.4s, finish at 3s
    const fadeTimer = setTimeout(() => setSplashFading(true), 2400)
    const doneTimer = setTimeout(() => {
      setSplashDone(true)
      setTimeout(() => setContentVisible(true), 80)
    }, 3000)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [])

  return (
    <>
      {/* ── Welcome Splash ── */}
      {!splashDone && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-celeste"
          style={{
            transition: 'opacity 600ms ease-out',
            opacity: splashFading ? 0 : 1,
            pointerEvents: splashFading ? 'none' : 'auto',
          }}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <p
              className="sm:text-h1/8 text-h2/7 font-semibold"
              style={{ animation: 'splash-fadein 0.6s ease-out 0.3s both' }}
            >
              DMAI
            </p>
            <p
              className="sm:text-p/5 text-sm/4text-muted-foreground"
              style={{ animation: 'splash-fadein 0.6s ease-out 0.7s both' }}
            >
              Digital Mindful Autogenic Intervention
            </p>
          </div>

          {/* Progress bar */}
          <div
            className="w-40 h-0.5 bg-foreground/10 rounded-full overflow-hidden"
            style={{ animation: 'splash-fadein 0.4s ease-out 0.5s both' }}
          >
            <div
              className="h-full bg-foreground/30 rounded-full"
              style={{ animation: 'splash-progress 2.4s ease-in-out 0.5s both' }}
            />
          </div>

          <style>{`
            @keyframes splash-ping {
              0% { transform: scale(0.8); opacity: 0.6; }
              100% { transform: scale(1.4); opacity: 0; }
            }
            @keyframes splash-fadein {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes splash-progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

      <div
        className="flex  flex-col items-center sm:gap-8 gap-6 md:px-0 px-2 md:pb-0 pb-3"
        style={{
          transition: 'opacity 500ms ease-out, transform 500ms ease-out',
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        <div className="md:w-102 sm:h-78 w-full xs:h-76 h-54 ">
          <Image
            src={'/tropicaline/happy.png'}
            alt="Being Happy 2 (Tropicaline Illustrations)"
            width={2000}
            height={2000}
            priority
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex-1 flex flex-col sm:gap-4 gap-2 items-center text-center text-foreground">
          <h1 className="sm:text-h1/8 text-[1.8rem]/8 font-semibold max-w-90">Digital Mindful Autogenic Intervention.</h1>
          <p className="sm:text-p/5 text-sm/4 max-w-140 font-medium">
            Platform mindful yang dirancang untuk membantu kamu menjalani sesi latihan refleksi diri dengan suasana yang lebih tenang dan tidak terasa melelahkan.
          </p>
        </div>

        <Button asChild variant={'default'}>
          <Link href={'/login' as Route} className="flex gap-2 items-center">
            COBA SEKARANG
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </>
  )
}