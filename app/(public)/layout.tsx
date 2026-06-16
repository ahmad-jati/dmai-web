import { Footer } from "@/components/footer";
import { MainNavbar } from "@/components/navbars/public-navbar";
import { SplashScreen } from "@/components/splash-screen";
import { DummyPlaceholderNavbar } from "@/components/navbars/dummy-placeholder-navbar";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SplashScreen />

      <div className="flex flex-col items-center md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto min-h-dvh">
        <MainNavbar/>
        <div className="flex-1 w-full">
          {children}
        </div>
        <Footer />
      </div>
    </>
  );
}