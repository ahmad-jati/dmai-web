'use client'

import Image from "next/image";
import { Button } from "../../ui/button";
import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Route } from "next";

export function HeroOnboarding() {

  return (
    <>
      <div
        className="flex  flex-col items-center sm:gap-8 gap-6 md:px-0 px-2 md:pb-0 pb-3"
        style={{
          transition: 'opacity 500ms ease-out, transform 500ms ease-out',
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