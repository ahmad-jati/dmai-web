import { Footer } from "@/components/footer";
import { ProtectedNavbar } from "@/components/navbars/protected-navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto min-h-dvh">
      <ProtectedNavbar/>
      <div className="flex-1 w-full">
        {children}
      </div>
      <Footer />
    </div>
    // <main className="w-full flex flex-col items-center">
    //   {/* <ProtectedNavbar /> */}
          
        
    //   
    // </main>
  );
}
