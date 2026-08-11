'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section-wrapper";
import { createClient } from "@/lib/supabase/client";

// Fragments we look for in the error message/name to decide whether this
// crash was actually caused by a broken/stale auth session (corrupted or
// expired refresh token, malformed cookie, etc). This is the case a plain
// reset()/reload() can NOT fix, because the same bad cookie gets read again.
const AUTH_ERROR_PATTERNS = [
  "refresh_token_not_found",
  "invalid refresh token",
  "refresh token not found",
  "jwt expired",
  "session missing",
  "auth session missing",
  "invalid jwt",
];

function isAuthError(error: Error) {
  const haystack = `${error.message ?? ""} ${error.name ?? ""}`.toLowerCase();
  return AUTH_ERROR_PATTERNS.some((pattern) => haystack.includes(pattern));
}

export function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isRecovering, setIsRecovering] = useState(false);
  const authError = isAuthError(error);

  useEffect(() => {
    // TODO: wire this up to your error reporting tool (Sentry, etc) later.
    console.error("[ErrorState] Uncaught error:", error);
  }, [error]);

  const handleRetry = async () => {
    setIsRecovering(true);

    if (authError) {
      // Don't just reset() here — if the cookie itself is corrupt/stale,
      // re-running the same render will hit the exact same error again
      // (this is the "klik reload, errornya nggak berubah" symptom).
      // Force a clean sign-out so the bad cookie is cleared, then send
      // the user to /login instead of leaving them stuck on a dead page.
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    reset();
    setIsRecovering(false);
  };

  return (
    <div className="flex w-full">
      <Section className="flex flex-col-reverse items-center justify-center gap-4 bg-white dark:bg-card">
        <div className="w-full lg:w-fit flex flex-col gap-2.5 items-center text-foreground md:px-0 px-2 2md:mt-0">
          <h2 className="sm:text-h2 text-xl font-semibold -mt-1.5">
            Waduh, ada yang salah
          </h2>
          <p className="xs:text-p/5 text-sm/4 font-medium text-pretty text-center">
            {authError
              ? "Sesi kamu sepertinya bermasalah. Yuk masuk lagi."
              : "Terjadi kesalahan yang tidak terduga. Coba lagi ya."}
          </p>

          <Button
            variant={"default"}
            size={"sm"}
            onClick={handleRetry}
            disabled={isRecovering}
            className="[&_svg]:size-4 xs:text-p/5 text-xs/4 rounded-md bg-background hover:bg-background/80 dark:bg-primary px-4!"
          >
            <ArrowClockwiseIcon />
            {isRecovering
              ? "Memuat ulang..."
              : authError
              ? "Masuk lagi"
              : "Coba lagi"}
          </Button>
        </div>

        <div className="2xs:w-60 w-40 h-fit xs:px-0 p-4 aspect-square rounded-xl">
          <Image
            src={"open-doodles/FloatDoodle.svg"}
            alt="Open Doodles - Float Doodle By Pablo Stanley"
            width={2000}
            height={2000}
            unoptimized
            priority
            className="w-full h-full object-cover"
          />
        </div>
      </Section>
    </div>
  );
}