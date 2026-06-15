'use client'

import { Section } from "@/components/layout/section-wrapper";
import Image from "next/image";
import { MailboxIcon } from "@phosphor-icons/react";

export default function Page() {
  return (
    <div className="w-full">
      <Section className="min-h-[calc(74svh-64px)] md:min-h-[calc(82dvh-52px)] flex lg:flex-row flex-col lg:items-center justify-center items-end lg:gap-8 gap-0 bg-lemon lg:px-20">
        <div className="lg:w-67 lg:h-96 w-50 h-60">
          <Image
            src={'/tropicaline/compress/Scooter.png'}
            alt=""
            width={2000}
            height={2000}
            priority
            unoptimized
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex flex-col gap-3.5 items-start text-foreground md:px-0 px-2 md:mt-0 xs:-mt-10 -mt-4">
          <MailboxIcon className="text-foreground md:w-10 md:h-10 w-16 h-16" />
          <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold text-pretty">Thank you for signing up!</h2>
          <p className="xs:text-p/5 text-sm/4 font-medium text-pretty">
            Silakan <span className="font-bold">cek email </span> untuk mengonfirmasi akun sebelum masuk ke platform.{" "}
            <span className="lg:block"></span> Kamu bisa menutup tab ini.
          </p>
        </div>
      </Section>
    </div>
  );
}