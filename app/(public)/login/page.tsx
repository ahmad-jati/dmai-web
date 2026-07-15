import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { Section } from "@/components/layout/section-wrapper";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login — DAMAI",
  description: "Masuk ke akun kamu dan mulai sesi mindfulness hari ini.",
};

export default function Page() {
  return (
    <div className="flex h-full w-full">
      <Section className="relative flex w-full gap-2 items-center justify-center min-h-[calc(74svh-64px)] md:min-h-[calc(82dvh-52px)] overflow-hidden bg-white dark:bg-background">
        <div className="absolute inset-0 z-5 bg-linear-to-t from-transparent via-white/40 to-white dark:from-transparent dark:via-background/70 dark:to-background" />
        <Image
          src="/lummi/lake-b.png"
          alt="Lake drawing from Lummi"
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom z-0"
        />
        <div className="absolute inset-0 z-5 bg-linear-to-t from-transparent via-white/10 to-white dark:from-transparent dark:via-background/70 dark:to-background" />

        <div className="relative z-10 w-full max-w-md flex flex-col gap-8 items-center px-4 sm:py-0 py-6">
          <div className="w-full flex flex-col gap-2 px-4 text-foreground">
            <h2 className="xs:text-h2/7 text-xl/5.5 font-semibold text-center text-pretty">Good to see you again.</h2>
            <p className="xs:text-p/5 text-sm/4 font-medium text-center text-pretty">
              Terima kasih sudah kembali dan memberi ruang untuk dirimu sendiri hari ini. Mari lanjutkan sesi dengan tenang.
            </p>
          </div>
          <div className="w-full bg-white/40 dark:bg-card/40 backdrop-blur-sm backdrop-saturate-150 md:rounded-4xl rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-xl shadow-neutral-200/60 dark:shadow-none p-6">
            <LoginForm />
          </div>

          <p className="text-muted-foreground text-center font-medium -my-4 text-sm/4 group hover:cursor-pointer"> Serene Night by the Lake from 
            <Link
              href={'https://www.lummi.ai/illustration/serene-night-by-the-lake-bu00d'}
              target="_blank"
              className="pl-1 group-hover:underline underline-offset-2 group-hover:font-bold"
            >
              Steph Meade
            </Link>
          </p>
        </div>
      </Section>
    </div>
  );
}