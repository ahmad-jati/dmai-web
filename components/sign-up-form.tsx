"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EyeIcon, EyeSlashIcon, SpinnerIcon } from "@phosphor-icons/react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [fullname, setFullname] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
          data: {
            full_name: fullname,
          },
        },
      });
      if (error) throw error;
      router.push("/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div className='flex flex-col items-center sm:gap-8 gap-4 '>
      <div className="flex flex-col gap-4">
        <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold md:text-left text-center text-pretty">Let&apos;s prepare your account.</h2>
        <p className="xs:text-p/5 text-sm/4 font-medium md:text-left text-center text-pretty">
         Buat ruang kecil untuk dirimu hari ini, lalu jalani setiap sesi latihan sesuai dengan kenyamananmu sendiri.
        </p>
      </div>
      <div className="w-full">
        <form onSubmit={handleSignUp} className="w-full flex flex-col justify-center items-center">
            <div className="flex flex-col sm:gap-6 gap-4 w-full">
              <div className="grid gap-2">
                <Label htmlFor="fullname">Nama</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="DMAI"
                  className="rounded-full px-3 text-sm font-medium"
                  required
                  value={fullname}
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/\b\w/g, (char) => char.toUpperCase());

                    setFullname(value);
                  }}
                  autoComplete="off"
                  />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="me@dmai.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className="rounded-full px-3 text-sm font-medium"
                  />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Kata Sandi</Label>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    autoComplete="off"
                    placeholder="●●●●●●●●"
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 rounded-full text-sm font-medium"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <div className="w-full flex justify-center">
              <Button
                type="submit"
                className={`max-w-80 w-full bg-tangerine flex items-center gap-2 h-fit 2xs:[&_svg]:size-4 [&_svg]:size-3.5`}
                disabled={isLoading}
              >
              {isLoading && <SpinnerIcon className="w-4 h-4 animate-spin" />}
              {isLoading ? (
                <span className="text-center leading-tight px-1">
                  Menyiapkan akun...
                </span>
              ) : (
                "Daftar"
              )}
            </Button>
            </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Sudah punya akun?{" "}
              <Link href="/login" className="hover:underline underline-offset-4 font-bold text-tangerine">
                Masuk disini
              </Link>
            </div>
          </form>
      </div>
    </div>
  );
}
