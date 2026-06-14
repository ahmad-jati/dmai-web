'use client'

import Image from "next/image";
import { Button } from "../../ui/button";
import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Route } from "next";

export function HeroOnboarding() {

  return (
    <>
      <style>{`
        @keyframes hero-fadein-up {
          from { 
            opacity: 0; 
            transform: translateY(24px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        className="flex  flex-col items-center sm:gap-8 xs:gap-6 gap-4 md:px-0 xs:px-2 md:pb-0 pb-3"
        style={{
          animation: 'hero-fadein-up 700ms ease-out 600ms both',
        }}
      >
        <div className="md:w-102 md:h-74 sm:h-74 w-full xs:h-60 h-44">
          <Image
            src={'/tropicaline/compress/happy.png'}
            alt="Being Happy 2 (Tropicaline Illustrations)"
            width={2000}
            height={2000}
            priority
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex-1 flex flex-col sm:gap-4 gap-2 items-center text-center text-foreground">
          <h1 className="sm:text-h1/8 xs:text-[1.8rem]/8 text-h2/7 font-semibold xs:max-w-90 w-full">Digital Mindful Autogenic Intervention.</h1>
          <p className="xs:text-p/5 text-sm/4 max-w-140 font-medium text-pretty">
            Platform mindful yang dirancang untuk membantu kamu menjalani sesi latihan refleksi diri dengan suasana yang lebih tenang dan tidak terasa melelahkan.
          </p>
        </div>

        <Button 
          variant={'default'}
          className="[&_svg]:size-3.5 hover:bg-background/80"
        >
          <Link href={'/login' as Route} className="flex gap-2 items-center">
            COBA SEKARANG
            <ArrowRightIcon/>
          </Link>
        </Button>
      </div>
    </>
  )
}
