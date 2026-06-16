import { Footer } from "@/components/footer";
import { ProtectedNavbar } from "@/components/navbars/protected-navbar";
import { DummyPlaceholderNavbar } from "@/components/navbars/dummy-placeholder-navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-center items-center mx-auto min-h-dvh relative">
      <ProtectedNavbar/>
      <div className="flex flex-col items-center md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto w-full flex-1 ">
      <DummyPlaceholderNavbar/>
        <div className="flex-1 w-full">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}
