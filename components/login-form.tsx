"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon, SpinnerIcon } from "@phosphor-icons/react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.status === 400) {
          setError("Email atau password yang kamu masukkan salah.");
        } else {
          setError(error.message);
        }
        // Only stop loading on error
        setIsLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (roleData?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/homepage");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan. Silakan coba lagi."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center sm:gap-8 gap-4'>
      <div className="flex flex-col gap-2 lg:px-0 sm:px-10 xs:px-6 px-2">
        <h2 className="xs:text-h2/7 text-xl/5.5 font-semibold lg:text-left text-center text-pretty">Good to see you again.</h2>
        <p className="xs:text-p/5 text-sm/4 font-medium lg:text-left text-center sm:max-w-120 text-pretty">
          Terima kasih sudah kembali dan memberi ruang untuk dirimu sendiri hari ini. Mari lanjutkan sesi dengan tenang.
        </p>
      </div>
      <div className="w-full">
        <form onSubmit={handleLogin} className="w-full flex flex-col justify-center items-center">
          <div className="flex flex-col sm:gap-6 gap-4 w-full">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="me@dmai.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-full px-3 text-sm"
                autoComplete="off"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Kata Sandi</Label>
                <Link
                  href={'/forgot-password'}
                  className="ml-auto inline-block sm:text-sm text-xs underline-offset-4 hover:underline"
                >
                  Lupa password?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  placeholder="●●●●●●●●"
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 rounded-full text-sm"
                  autoComplete="off"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red">{error}</p>}

            <div className="w-full flex justify-center">
              <Button
                type="submit"
                className={`max-w-80 w-full bg-green flex items-center gap-2 h-fit 2xs:[&_svg]:size-4 [&_svg]:size-3.5`}
                disabled={isLoading}
              >
              {isLoading && <SpinnerIcon className="w-4 h-4 animate-spin" />}
              {isLoading ? (
                <span className="text-center leading-tight px-1">
                  Menghubungkan ke akunmu...
                </span>
              ) : (
                "Masuk"
              )}
            </Button>
            </div>
          </div>

          <div className="mt-4 text-center sm:text-sm text-xs text-pretty">
            Belum punya akun?{" "}
            <Link
              href={'/sign-up'}
              className="hover:underline underline-offset-3 font-bold text-green"
            >
              Daftar disini
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}