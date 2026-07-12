import { createClient } from "@/lib/supabase/server";

import { Footer } from "@/components/footer";
import { MainNavbar } from "@/components/navbars/public-navbar";
import { ProtectedNavbar } from "@/components/navbars/protected-navbar";
import { DummyPlaceholderNavbar } from "@/components/navbars/dummy-placeholder-navbar";
import { AuthStateListener } from "@/components/auth-state-listener";
import { PresenceTracker } from "@/components/presence-tracker";
import AboutContent from "@/components/section/about/about-content";

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="flex flex-col relative flex-1">
        <AuthStateListener />
        <PresenceTracker />
        <ProtectedNavbar />
        <div className="flex flex-col items-center justify-between md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto w-full flex-1">
          <DummyPlaceholderNavbar />
          <div className="w-full flex-1 flex flex-col items-center justify-start gap-8">
            <AboutContent />
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col items-center md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto w-full flex-1">
        <MainNavbar />
        <div className="flex-1 w-full flex flex-col">
          <AboutContent />
        </div>
        <Footer />
      </div>
    </div>
  );
}