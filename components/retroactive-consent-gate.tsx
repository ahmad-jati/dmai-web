"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ConsentDialog } from "@/components/consent-dialog";

interface RetroactiveConsentGateProps {
  userId: string;
  initialHasConsented: boolean;
}

/**
 * Ditaruh di halaman /homepage (server component ambil `has_consented`
 * dari user_profiles lalu diteruskan sebagai `initialHasConsented`).
 * User lama (has_consented = false) langsung disodori dialog ini,
 * tidak bisa ditutup sebelum menyetujui.
 */
export function RetroactiveConsentGate({
  userId,
  initialHasConsented,
}: RetroactiveConsentGateProps) {
  const [hasConsented, setHasConsented] = useState(initialHasConsented);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase
      .from("user_profiles")
      .update({
        has_consented: true,
        consented_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setIsSubmitting(false);

    if (error) {
      setError("Gagal menyimpan persetujuan, coba lagi.");
      return;
    }

    setHasConsented(true);
  };

  return (
    <>
      <ConsentDialog
        open={!hasConsented}
        onOpenChange={() => {}}
        onAccept={handleAccept}
        isSubmitting={isSubmitting}
        dismissable={false}
        acceptLabel="Saya Setuju"
        submittingLabel="Menyimpan..."
      />
      {error && (
        <p className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-md bg-red px-3 py-2 text-sm text-white shadow-lg">
          {error}
        </p>
      )}
    </>
  );
}