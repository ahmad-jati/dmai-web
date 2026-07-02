import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { Section } from "@/components/layout/section-wrapper";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Login — DMAI",
  description: "Masuk ke akun kamu dan mulai sesi mindfulness hari ini.",
};

export default function Page() {
  return (
    <div className="flex h-full w-full">
      <div className="flex lg:flex-row flex-col-reverse justify-between w-full gap-8">
        <Section className="flex-1 w-full bg-white dark:bg-card flex flex-col gap-8 justify-center items-center">
          <div className="w-fit xs:h-64 h-fit bg-celeste dark:bg-card sm:rounded-3xl dark:rounded-none rounded-lg lg:hidden flex items-center justify-center p-4">
            <Image
              src={"/tropicaline/compress/Play.png"}
              alt=""
              width={2000}
              height={2000}
              unoptimized
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <LoginForm />
        </Section>
        <Section className="bg-white dark:bg-card p-4! lg:block hidden flex-1">
          <div className="h-full w-fit rounded-4xl dark:rounded-none bg-celeste dark:bg-card flex items-center justify-center p-4 dark:p-0">
            <Image
              src={"/tropicaline/compress/Play.png"}
              alt=""
              width={2000}
              height={2000}
              unoptimized
              priority
              className="w-122 h-full object-contain"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}