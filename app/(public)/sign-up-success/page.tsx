'use client'

import { Section } from "@/components/layout/section-wrapper";
import Image from "next/image";
import { EnvelopeSimpleOpenIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="w-full">
      <Section className="flex flex-col justify-center items-center gap-5 bg-lemon min-h-[calc(74svh-64px)] md:min-h-[calc(82dvh-52px)] px-6">
        <div className="w-40 sm:w-52 h-fit">
          <Image
            src={'/open-doodles/RunningDoodle.svg'}
            alt="Open Doodles - Running Doodle By Pablo Stanley"
            width={2000}
            height={2000}
            priority
            unoptimized
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex flex-col gap-3 items-center text-foreground text-center max-w-sm">
          <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold text-pretty">
            Cek email kamu
          </h2>
          <p className="xs:text-p/5 text-sm/4 font-medium text-pretty text-muted-foreground">
            Kami sudah kirim link konfirmasi ke email kamu. Klik link itu buat aktifin akun sebelum masuk ke platform.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">

          <Link
            href="https://mail.google.com"
            target="_blank"
          >
            <Button
              className="bg-foreground/90 hover:bg-foreground text-background border-none"
            >
              <EnvelopeSimpleOpenIcon className="w-4 h-4" />
              Buka email
            </Button>
          </Link>
        </div>
      </Section>
    </div>
  );
}