import { HeroOnboarding } from "@/components/section/onboarding/hero-onboarding";
import { TrainingOverviewOnboarding } from "@/components/section/onboarding/training-overview-onboarding";
import { Section } from "@/components/layout/section-wrapper";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="bg-celeste dark:bg-card">
        <HeroOnboarding/>
      </Section>
      <Section
        className="bg-lemon dark:bg-card"
      >
        <TrainingOverviewOnboarding/>
      </Section>
    </div>

  );
}