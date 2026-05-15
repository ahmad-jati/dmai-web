import { SessionList } from "@/components/section/homepage/session-list";
import { Section } from "@/components/layout/section-wrapper";

export default function Page(){
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="bg-lavender">
        <SessionList/>
      </Section>
    </div>
  )
}