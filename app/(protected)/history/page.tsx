import type { Metadata } from "next";
import { HistoryList } from "@/components/section/history/history-list";
import { Section } from "@/components/layout/section-wrapper";
 
export const metadata: Metadata = {
  title: "Riwayat Sesi — DMAI",
  description: "Lihat semua sesi mindfulness yang pernah kamu selesaikan.",
};
 
export default function Page() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="bg-lavender flex gap-8 items-center">
        <HistoryList />
      </Section>
    </div>
  );
}
 