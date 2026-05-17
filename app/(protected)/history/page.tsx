import { HistoryList } from "@/components/section/history/history-list";
import { Section } from "@/components/layout/section-wrapper";

export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="bg-lavender">
        <HistoryList/>
      </Section>
    </div>
  );
}