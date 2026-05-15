import { Section } from "@/components/layout/section-wrapper";
import { SignUpForm } from "@/components/sign-up-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-[calc(70svh-64px)] md:min-h-[calc(70dvh-52px)] w-full">
      <div className="flex gap-8">
        <Section className="bg-white p-4">
          <div className="h-full w-full rounded-3xl bg-tangerine flex items-center justify-center p-2">
            <Image
              src={'/tropicaline/Together.png'}
              alt=""
              width={2000}
              height={2000}
              className="w-136 h-118 object-cover"
              loading="eager"
            />
          </div>
        </Section>
        
        <Section className="max-w-120 bg-white flex items-center">
          <SignUpForm />
        </Section>

      </div>
    </div>
  );
}
