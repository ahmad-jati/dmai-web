'use client'

import { Section } from "@/components/layout/section-wrapper";
import Image from "next/image";
import { MailboxIcon } from "@phosphor-icons/react";

export default function Page() {
  return (
    <div className="w-full">
      <Section className=" flex flex-col justify-center items-center gap-2 bg-lemon">
        <div className="lg:w-66 w-50 h-fit">
          <Image
            src={'open-doodles/RunningDoodle.svg'}
            alt=""
            width={2000}
            height={2000}
            priority
            unoptimized
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex flex-col gap-3.5 items-center text-foreground text-center max-w-sm mb-6">
          <MailboxIcon className="text-foreground w-10 h-10" />
          <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold text-pretty">Thank you for signing up!</h2>
          <p className="xs:text-p/5 text-sm/4 font-medium text-pretty">
            Silakan <span className="font-bold">cek email </span> untuk mengonfirmasi akun sebelum masuk ke platform. Kamu bisa menutup tab ini.
          </p>
        </div>
      </Section>
    </div>
  );
}