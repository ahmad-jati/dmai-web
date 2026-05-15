'use client'

import Image from "next/image";
import { Button } from "../../ui/button";
import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";

export function HeroOnboarding(){
  return(
    <div className="flex flex-col items-center gap-4">
      <Image
        src={'/tropicaline/Being-Happy2.png'}
        alt=""
        width={2000}
        height={2000}
        className="w-102 h-80 object-cover"
        loading="eager"
      />

      <div className="flex-1 flex flex-col gap-3.5 items-center text-center text-foreground">
        <h1 className="text-h1 max-w-90">Digital Mindful Autogenic Intervention.</h1>
        <p className="text-lg max-w-160 font-medium">
          Platform mindful yang dirancang untuk membantu kamu menjalani sesi latihan refleksi diri dengan suasana yang lebih tenang dan tidak terasa melelahkan.
        </p>
      </div>

      <Button asChild
        variant={'default'}
      >
        <Link 
          href={{ pathname: '/login' }}
          className="flex gap-2 items-center"
        >
          COBA SEKARANG 
          <ArrowRightIcon className="w-5 h-5"/>
        </Link>
      </Button>
    </div>
  )
}