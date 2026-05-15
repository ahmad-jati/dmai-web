"use client";
;
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center gap-8'>
      <div className="flex flex-col gap-4">
        <h2>Good to see you again.</h2>
        <p className="font-medium">
          Terima kasih sudah kembali dan memberi ruang untuk dirimu sendiri hari ini. Mari lanjutkan sesi dengan tenang.
        </p>
      </div>
      <div className="w-full">
        <form onSubmit={handleLogin} className="w-full">
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="me@dmai.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-full px-3"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href={'/auth/forgot-password'}
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 rounded-full"
                  autoComplete="off"
                />

                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red">{error}</p>}
            <Button 
              type="submit" 
              className="w-full bg-green" 
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Belum punya akun?{" "}
            <Link
              href={'/auth/sign-up'}
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
