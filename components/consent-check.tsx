import { createClient } from "@/lib/supabase/server";
import { RetroactiveConsentGate } from "@/components/retroactive-consent-gate";

export async function ConsentCheck() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("has_consented")
    .eq("id", user.id)
    .single();

  const hasConsented = profile?.has_consented ?? false;

  return (
    <RetroactiveConsentGate userId={user.id} initialHasConsented={hasConsented} />
  );
}