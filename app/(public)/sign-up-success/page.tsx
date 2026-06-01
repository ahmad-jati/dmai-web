'use client'

import { Section } from "@/components/layout/section-wrapper";
import Image from "next/image";
import { MailboxIcon } from "@phosphor-icons/react";

export default function Page() {
  return (
    <div className="w-full">
      <Section className="flex items-center gap-8 bg-white">
        <Image
          src={'/tropicaline/Scooter.png'}
          alt=""
          width={2000}
          height={2000}
          priority
          className="w-67 h-96 object-contain"
        />

        <div className="flex-1 flex flex-col gap-3.5 items-start text-foreground">
          <MailboxIcon className="text-foreground w-10 h-10" />
          <h2>Thank you for signing up!</h2>
          <p className="text-lg">
            Silakan <span className="font-bold">cek email </span> untuk mengonfirmasi akun sebelum masuk ke platform.{" "}
            <span className="block"></span> Kamu bisa menutup tab ini.
          </p>
        </div>
      </Section>
    </div>
  );
}