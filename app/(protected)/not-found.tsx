'use client'

import { Section } from "@/components/layout/section-wrapper";
import Image from "next/image";
import { ArrowLeftIcon, EyesIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Route } from "next";

export default function NotFound() {
  return (
    <div className="w-full flex-1">
      <Section className="flex lg:flex-row-reverse flex-col-reverse lg:items-center justify-center items-end md:gap-8 gap-0 bg-white dark:bg-card h-full">
        <div className="w-full lg:w-fit flex flex-col gap-2.5 items-start text-foreground md:px-0 px-2 2md:mt-0 ">
          <EyesIcon className="text-foreground w-10 h-10" weight="fill"/>
          <h2 className="sm:text-h2 text-xl font-semibold -mt-1.5">Oops!</h2>
          <p className="xs:text-p/5 text-sm/4 font-medium text-pretty">
            Halaman yang kamu cari tidak ditemukan
          </p>

          <Button
            variant={'default'}
            className="[&_svg]:size-4 xs:text-p/5 text-xs/4 rounded-xl hover:bg-background/80"
          >
            <Link href={'/homepage' as Route} className="flex gap-2 items-center">
              <ArrowLeftIcon/>
              Kembali ke Homepage
            </Link>
          </Button>
        </div>

        <div className="lg:w-76 lg:h-106 2md:w-60 2xs:w-60 w-30 h-full">
          <Image
            src={'/tropicaline/compress/page-not-found.png'}
            alt=""
            width={2000}
            height={2000}
            unoptimized
            priority
            className="w-full h-full object-contain"
          />
        </div>
      </Section>
    </div>
  );
}