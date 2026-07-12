"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Section } from "./layout/section-wrapper";
import Image from "next/image";
import { SpinnerIcon } from "@phosphor-icons/react";

export function UpdatePasswordForm({
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
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
      router.push("/beranda");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <Section className="flex-1 flex lg:flex-row flex-col-reverse items-center justify-center lg:gap-8 gap-4 bg-white dark:bg-card">
        <div className="max-w-100 w-full flex flex-col gap-2 lg:items-start items-center text-foreground mb-0 lg:mb-6 px-2">
          <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold lg:text-left text-center">Set your new password</h2>
          <p className="sm:text-p/5 text-sm/4 max-w-140 w-full font-medium lg:text-left text-center text-pretty">
            Masukkan password baru yang ingin kamu gunakan untuk kembali mengakses akunmu.
          </p>

          {!sessionReady && !error && (
            <p className="font-medium text-muted-foreground sm:text-p/5 text-sm/4 italic">
              Memverifikasi sesi...
            </p>
          )}

          {error && (
            <p className="sm:text-p/5 text-sm/4 font-medium text-red-500">{error}</p>
          )}

          {sessionReady && (
            <form onSubmit={handleUpdatePassword} className="w-full">
              <div className="flex flex-col lg:items-start items-center gap-3">
                <div className="grid gap-2 w-full mt-3">
                  <Input
                    id="password"
                    type="password"
                    placeholder="●●●●●●●●"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-full px-3 text-sm w-full"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className={`w-full lg:bg-orange-200 bg-orange-300/90 hover:bg-orange-300/90 dark:bg-primary flex items-center gap-2 h-fit`}
                  disabled={isLoading}
                >
                  {isLoading && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                  {isLoading ? "Memperbarui password..." : "Simpan Password Baru"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="lg:w-107 md:w-100 sm:w-86 xs:w-70 w-full h-fit xs:px-0 px-6">
          <Image
            src={'/open-doodles/CoffeeDoodle.svg'}
            alt="Open Doodles - Coffe Doodle By Pablo Stanley"
            width={2000}
            height={2000}
            priority
            unoptimized
            className="w-full h-full object-contain"
          />
        </div>
      </Section>
    </div>
  );
}