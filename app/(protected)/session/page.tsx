import { Section } from "@/components/layout/section-wrapper";
import { SessionList } from "@/components/section/homepage/session-list";

export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="bg-lavender">
        <SessionList/>
      </Section>
    </div>
  );
}