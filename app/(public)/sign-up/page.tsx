import type { Metadata } from "next";
import { Section } from "@/components/layout/section-wrapper";
import { SignUpForm } from "@/components/sign-up-form";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign Up — DMAI",
  description:
    "Buat akun baru dan mulai perjalanan mindfulness kamu bersama kami.",
};

export default function Page() {
  return (
    <div className="flex h-full w-full">
      <div className="flex lg:flex-row flex-col-reverse justify-between w-full gap-8">
        <Section className="bg-white dark:bg-card p-4! flex-1 lg:block hidden">
          <div className="h-full w-fit rounded-4xl dark:rounded-none bg-tangerine dark:bg-card flex items-center justify-center p-4 dark:p-0">
            <Image
              src={"/tropicaline/compress/Together.png"}
              alt=""
              width={2000}
              height={2000}
              unoptimized
              priority
              className="w-full h-full object-contain"
            />
          </div>
        </Section>
        <Section className="flex-1 w-full bg-white dark:bg-card flex flex-col gap-8 justify-center items-center">
          <div className="w-fit xs:h-64 h-fit bg-tangerine dark:bg-card sm:rounded-3xl dark:rounded-none rounded-lg lg:hidden flex items-center justify-center p-4">
            <Image
              src={"/tropicaline/compress/Together.png"}
              alt=""
              width={2000}
              height={2000}
              unoptimized
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <SignUpForm />
        </Section>
      </div>
    </div>
  );
}