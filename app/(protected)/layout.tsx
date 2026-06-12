import { Footer } from "@/components/footer";
import { ProtectedNavbar } from "@/components/navbars/protected-navbar";
import { FloatingButton } from "@/components/floating-button";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto min-h-dvh relative">
      <ProtectedNavbar/>
      <div className="flex-1 w-full">
        {children}
      </div>
      <FloatingButton/>
      <Footer />
    </div>
  );
}
