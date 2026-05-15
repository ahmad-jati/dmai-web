'use client'

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowCircleDownIcon } from "@phosphor-icons/react";

export function HeroHomepage(){
  return (
    <div className="flex flex-col items-center gap-6">
      <Image
        src={'/tropicaline/Parachute.png'}
        alt="Parachute (Tropicaline Illustrations)"
        width={2000}
        height={2000}
        className="w-80 h-86 object-cover"
        loading="eager"
      />
      <div className="flex-1 flex flex-col gap-3.5 items-center text-center text-foreground">
        <h1 className="text-h1 max-w-90">A Space to Slow Down</h1>
        <p className="text-lg max-w-136 font-medium">
          Berikan dirimu waktu untuk berhenti sejenak, menenangkan pikiran, dan menjalani sesi dengan suasana yang lebih nyaman.
        </p>
      </div>

      <Button
        variant={'default'}
        className="flex gap-2 items-center"
      >
        JELAJAHI SESI 
        <ArrowCircleDownIcon className="w-6 h-6"/>
      </Button>
    </div>
  )
}