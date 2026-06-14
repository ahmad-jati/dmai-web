"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Section } from "./layout/section-wrapper";
import Image from "next/image";
import { PasswordIcon, SpinnerIcon } from "@phosphor-icons/react";

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
      <Section className="flex lg:flex-row flex-col-reverse md:items-center justify-center items-end md:gap-8 gap-0 bg-white min-h-[calc(70svh-64px)] md:min-h-[calc(70dvh-52px)] lg:px-20">
        <div className="lg:flex-1 w-full lg:max-w-120 flex flex-col gap-3.5 items-start text-foreground md:px-0 px-2 md:mt-0 xs:-mt-10 -mt-4">
          <PasswordIcon className="text-foreground md:w-10 md:h-10 w-16 h-16" />
          <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold text-pretty">Set your new password</h2>
          <p className="xs:text-p/5 text-sm/4 font-medium text-pretty">
            Masukkan password baru yang ingin kamu gunakan untuk kembali mengakses akunmu.
          </p>

          {!sessionReady && !error && (
            <p className="font-medium text-muted-foreground sm:text-p/5 text-sm/4 italic">Memverifikasi sesi...</p>
          )}

          {error && (
            <p className="sm:text-p/5 text-sm/4 font-medium text-red-500">{error}</p>
          )}

          {sessionReady && (
            <form onSubmit={handleUpdatePassword} className="w-full">
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password Baru</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password Baru"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-full pr-10 text-sm "
                    disabled={isLoading}
                  />
                </div>
                  <Button
                    type="submit"
                    className={`max-w-66 w-full bg-lemon flex items-center gap-2 h-fit 2xs:[&_svg]:size-4 [&_svg]:size-3.5`}
                    disabled={isLoading}
                  >
                  {isLoading && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                  {isLoading ? (
                    <span className="text-center leading-tight px-1">
                      Memperbarui password kamu
                    </span>
                  ) : (
                    "Simpan password baru"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="lg:w-76 lg:h-106 w-50 h-50">
          <Image
            src={'/tropicaline/Send.png'}
            alt=""
            width={2000}
            height={2000}
            priority
            className="w-full h-full object-contain"
          />
        </div>
      </Section>
    </div>
  );
}