'use client'
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/section-wrapper";
import { Button } from "@/components/ui/button";
import { OtherSessionList } from "@/components/section/session/other-session-list";

import { PersonSimpleTaiChiIcon,TimerIcon, PlayIcon, HeartIcon  } from "@phosphor-icons/react";

export default function Page(){
  return(
    <div className="flex flex-col gap-8 w-full">
      <Section className="flex gap-8 bg-celeste">
        <div className="flex flex-col justify-between max-w-xl">
          <div className="flex items-center gap-1 font-semibold text-sm">
            <Link
              href={'/session'}
            >
              ALL SESSION
            </Link>
            <p>/</p>
            <p>MOTIVATION</p>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="">MOTIVATION</h1>

            <p className="font-medium text-base">Terkadang rasa lelah dan tekanan membuat semuanya terasa lebih berat dari biasanya. Sesi ini dirancang untuk menemanimu perlahan mengenali kembali tujuan kecil, membangun semangat sedikit demi sedikit, dan memberi jeda dari ramainya pikiran.</p>
            <p className="font-medium text-base">Tidak perlu terburu-buru. Ikuti setiap langkah sesuai ritmemu sendiri.</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <PersonSimpleTaiChiIcon className="w-5 h-5" weight="fill"/>
                <p className="font-medium text-sm">8 Instruksi</p>
              </div>
              <div className="flex items-center gap-1">
                <TimerIcon className="w-5 h-5" weight="fill"/>
                <p className="font-medium text-sm">20 menit 12 detik</p>
              </div>
              <div className="flex items-center gap-1">
                <HeartIcon className="w-5 h-5" weight="fill"/>
                <p className="font-medium text-sm">Kamu telah mengikuti sesi ini 3 kali</p>
              </div>
            </div>

          </div>

          <Button
            className="w-fit [&_svg]:size-3"
          >
            <Link
              href={'/session/motivasi/exercise'}
              className="flex items-center gap-2"
            >
              MULAI SESI
              <PlayIcon className="w-5 h-5" weight="fill"/>  
            </Link>
          </Button>
        </div>

        <div className="flex-1 rounded-5xl border border-foreground bg-background p-2 h-88">
          <Image
            src={'/serene1.png'}
            alt="Serene Woman With Flowers Illustrations"
            width={2000}
            height={2000}
            className="w-full h-full object-cover rounded-4xl"
            loading="eager"
          />
        </div>
      </Section>

      <Section className="bg-pink">
        <OtherSessionList/>
      </Section>
    </div>
  )
}