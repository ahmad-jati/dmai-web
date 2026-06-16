import { Footer } from "@/components/footer";
import { MainNavbar } from "@/components/navbars/public-navbar";
import { SplashScreen } from "@/components/splash-screen";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col flex-1">
      <SplashScreen />

      <div className="flex flex-col items-center md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto w-full flex-1">
        <MainNavbar />
        <div className="flex-1 w-full flex flex-col">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}