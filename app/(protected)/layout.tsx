import { Footer } from "@/components/footer";
import { ProtectedNavbar } from "@/components/navbars/protected-navbar";
import { DummyPlaceholderNavbar } from "@/components/navbars/dummy-placeholder-navbar";
import { AuthStateListener } from "@/components/auth-state-listener";
import { PresenceTracker } from "@/components/presence-tracker";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col relative flex-1">
      <AuthStateListener/>
      <PresenceTracker />
      <ProtectedNavbar/>
      <div className="flex flex-col items-center justify-between md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto w-full flex-1">
      <DummyPlaceholderNavbar/>
        <div className="w-full flex-1 flex flex-col items-center justify-start gap-8">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}