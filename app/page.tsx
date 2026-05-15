import { HeroOnboarding } from "@/components/section/onboarding/hero-onboarding";
import { TrainingOverviewOnboarding } from "@/components/section/onboarding/training-overview-onboarding";
import { Section } from "@/components/layout/section-wrapper";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section
        // className="max-h-[calc(90svh-64px)] md:max-h-[calc(90dvh-60px)] bg-celeste"
        className="bg-celeste"
      >
        <HeroOnboarding/>
      </Section>
      <Section
        className="bg-lemon"
      >
        <TrainingOverviewOnboarding/>
      </Section>
    </div>

  );
}
