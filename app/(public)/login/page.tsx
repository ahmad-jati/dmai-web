import { LoginForm } from "@/components/login-form";
import { Section } from "@/components/layout/section-wrapper";
import Image from "next/image";

export default function Page() {
  return (
    <div className="w-full">
      <div className="flex gap-8">
        <Section className="max-w-120 bg-white flex items-center">
          <LoginForm />
        </Section>

        <Section className="bg-white p-4">
          <div className="h-full w-full rounded-3xl bg-green flex items-center justify-center p-2">
            <Image
              src={'/tropicaline/Play.png'}
              alt=""
              width={2000}
              height={2000}
              priority
              className="w-122 h-full object-cover"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}