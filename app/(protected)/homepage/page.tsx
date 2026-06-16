import type { Metadata } from "next";
import { HeroHomepage } from "@/components/section/homepage/hero-homepage";
import { Section } from "@/components/layout/section-wrapper";
import { SessionList } from "@/components/section/homepage/session-list";
 
export const metadata: Metadata = {
  title: "Homepage — DMAI",
  description:
    "Jelajahi sesi mindfulness pilihanmu dan mulai hari dengan lebih tenang.",
};
 
export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="bg-lemon dark:bg-card">
        <HeroHomepage />
      </Section>
      <Section className="bg-lavender dark:bg-card">
        <SessionList />
      </Section>
    </div>
  );
}