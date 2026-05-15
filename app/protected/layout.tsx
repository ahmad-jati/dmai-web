import { ProtectedNavbar } from "@/components/protected-navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full flex flex-col items-center">
      <ProtectedNavbar />
        
      {children}
    </main>
  );
}
