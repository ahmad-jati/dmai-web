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
    <div className="w-full">
      <div className="flex lg:flex-row flex-col-reverse gap-8">
        <Section className="min-h-[calc(70svh-64px)] md:min-h-[calc(60dvh-52px)] lg:max-w-120 w-full bg-white flex lg:flex-row flex-col gap-8 justify-center items-center">
          <div className="w-full xs:h-64 h-full bg-celeste sm:rounded-3xl rounded-lg lg:hidden flex items-center justify-center p-2">
            <Image
              src={"/tropicaline/compress/happy.png"}
              alt=""
              width={2000}
              height={2000}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <LoginForm />
        </Section>
        <Section className="bg-white p-4! w-full lg:block hidden">
          <div className="min-h-[calc(70svh-64px)] md:min-h-[calc(70dvh-52px)] lg:h-full w-full h-66 rounded-4xl bg-green flex items-center justify-center p-2">
            <Image
              src={"/tropicaline/compress/happy.png"}
              alt=""
              width={2000}
              height={2000}
              priority
              className="w-122 h-full object-contain"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}