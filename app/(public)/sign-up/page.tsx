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
    <div className="w-full">
      <div className="flex md:flex-row flex-col sm:gap-8 gap-6 w-full min-h-[calc(60svh-64px)] md:min-h-[calc(70dvh-52px)]">
        <Section className="bg-white p-4! w-full lg:block hidden">
          <div className="min-h-[calc(70svh-64px)] md:min-h-[calc(70dvh-52px)] lg:h-full w-full h-66 rounded-4xl bg-tangerine flex items-center justify-center p-2">
            <Image
              src={"/tropicaline/compress/Together.png"}
              alt=""
              width={2000}
              height={2000}
              priority
              className="w-122 h-full lg:object-cover object-contain"
            />
          </div>
        </Section>
        <Section className="lg:max-w-120 w-full bg-white flex lg:flex-row flex-col gap-8 justify-center items-center">
          <div className="w-full xs:h-64 h-full bg-tangerine sm:rounded-3xl rounded-lg lg:hidden flex items-center justify-center p-2">
            <Image
              src={"/tropicaline/compress/Together.png"}
              alt=""
              width={2000}
              height={2000}
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