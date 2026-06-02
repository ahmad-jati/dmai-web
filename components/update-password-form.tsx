"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Section } from "./layout/section-wrapper";
import Image from "next/image";

export function UpdatePasswordForm({
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Handle hash-based recovery tokens (older Supabase email flow)
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    if (accessToken && refreshToken && type === "recovery") {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (!error) setSessionReady(true);
          else setError("Link reset password tidak valid atau sudah kadaluarsa.");
        });
      return;
    }

    // Handle PKCE flow: session already set by /auth/confirm redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        // Listen for PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === "PASSWORD_RECOVERY" && session) {
              setSessionReady(true);
            }
          }
        );
        return () => subscription.unsubscribe();
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/homepage");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Section className="flex items-center justify-center gap-8 bg-white">
        <div className="flex-1 flex flex-col gap-3.5 items-start text-foreground max-w-120">
          <h2>Set your new password</h2>
          <p className="text-lg">
            Masukkan password baru yang ingin kamu gunakan untuk kembali mengakses akunmu.
          </p>

          {!sessionReady && !error && (
            <p className="text-sm text-muted-foreground">Memverifikasi sesi...</p>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {sessionReady && (
            <form onSubmit={handleUpdatePassword} className="w-full">
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="New password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-full px-3"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save new password"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <Image
          src={'/tropicaline/Send.png'}
          alt=""
          width={2000}
          height={2000}
          className="w-107 h-96 object-contain"
          loading="eager"
        />
      </Section>
    </div>
  );
}