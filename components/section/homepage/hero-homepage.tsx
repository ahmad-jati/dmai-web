'use client'

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowCircleDownIcon } from "@phosphor-icons/react";

export function HeroHomepage() {
  return (
    <div className="flex  flex-col items-center sm:gap-8 gap-6 md:px-0 px-2 md:pb-0 pb-3">
      <div className="md:w-102 sm:h-82 w-full xs:h-76 h-50">
        <Image
          src={'/tropicaline/compress/parachute1.png'}
          alt="Parachute (Tropicaline Illustrations)"
          width={2000}
          height={2000}
          priority
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex-1 flex flex-col gap-3.5 items-center text-center text-foreground">
        <h1 className="sm:text-h1/8 xs:text-[1.8rem]/8 text-xl/6 font-semibold max-w-90">A Space to Slow Down</h1>
        <p className="xs:text-p/5 text-sm/4 sm:max-w-140 font-medium text-pretty">
          Berikan dirimu waktu untuk berhenti sejenak, menenangkan pikiran, dan menjalani sesi dengan suasana yang lebih nyaman.
        </p>
      </div>

      <Button
        variant={'default'}
        className="flex gap-2 items-center [&_svg]:size-3.5"
        onClick={() => {
          document.getElementById("session-list")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        JELAJAHI SESI
        <ArrowCircleDownIcon className="w-6 h-6" />
      </Button>
    </div>
  )
}