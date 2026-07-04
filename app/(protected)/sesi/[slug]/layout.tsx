import type { Metadata } from "next";
import { fetchSessionBySlug } from "@/lib/data-detail-session";
 
type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};
 
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const session = await fetchSessionBySlug(slug);
 
  if (!session) {
    return {
      title: "Sesi Tidak Ditemukan — DMAI",
    };
  }
 
  return {
    title: `${session.session_name} — DMAI`,
    description: session.detail_short,
  };
}
 
export default function SessionDetailLayout({ children }: Props) {
  return <>{children}</>;
}