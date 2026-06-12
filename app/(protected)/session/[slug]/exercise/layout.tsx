import type { Metadata } from "next";
import { fetchSessionBySlug } from "@/lib/data-detail-session";
 
type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};
 
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const session = await fetchSessionBySlug(slug);
 
  return {
    title: session
      ? `Exercise: ${session.session_name} — DMAI`
      : "Exercise — DMAI",
    description: session?.detail_short ?? "Ikuti instruksi sesi dan rasakan manfaatnya.",
  };
}
 
export default function ExerciseLayout({ children }: Props) {
  return <>{children}</>;
}
 