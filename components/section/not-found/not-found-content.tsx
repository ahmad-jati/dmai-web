'use client'

import { Section } from "@/components/layout/section-wrapper";
import Image from "next/image";
import { ArrowLeftIcon, EyesIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Route } from "next";

export function NotFoundContent({
  backHref = "/beranda",
}: {
  backHref?: string;
}) {
  return (
    <div className="flex w-full">
      <Section className="flex flex-col-reverse items-center justify-center gap-4 bg-white dark:bg-card">
        <div className="w-full lg:w-fit flex flex-col gap-2.5 items-center text-foreground md:px-0 px-2 2md:mt-0">
          {/* <EyesIcon className="text-foreground w-10 h-10" weight="fill" /> */}
          <h2 className="sm:text-h2 text-xl font-semibold -mt-1.5">Oops!</h2>
          <p className="xs:text-p/5 text-sm/4 font-medium text-pretty">
            Halaman yang kamu cari tidak ditemukan
          </p>

          <Link href={backHref as Route} className="flex gap-2 items-center">
            <Button
              variant={"default"}
              size={'sm'}
              className="[&_svg]:size-4 xs:text-p/5 text-xs/4 rounded-md bg-background hover:bg-background/80 dark:bg-primary px-4!"
            >
              <ArrowLeftIcon />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>

        <div className=" 2xs:w-60 w-40 h-fit xs:px-0 p-4 aspect-square  rounded-xl">
          <Image
            src={"open-doodles/ReadingDoodle.svg"}
            alt="Open Doodles - Reading Doodle By Pablo Stanley"
            width={2000}
            height={2000}
            unoptimized
            priority
            className="w-full h-full object-cover"
          />
        </div>
      </Section>
    </div>
  );
}