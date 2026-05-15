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

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [fullname, setFullname] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  // const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // if (password !== repeatPassword) {
    //   setError("Passwords do not match");
    //   setIsLoading(false);
    //   return;
    // }

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
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center gap-8'>
      <div className="flex flex-col gap-4">
        <h2>Glad you&apos;re here.</h2>
        <p className="font-medium">
          Mulailah perlahan dan jalani semua sesuai kenyamananmu sendiri.
        </p>
      </div>
      <div className="w-full">
        <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullname">Fullname</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="Your name"
                  className="rounded-full px-3"
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
                  className="rounded-full px-3"
                  />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    autoComplete="off"
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 rounded-full"
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
              {/* <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>

                <div className="relative">
                  <Input
                    id="repeat-password"
                    type={showRepeatPassword ? "text" : "password"}
                    required
                    value={repeatPassword}
                    autoComplete="off"
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="pr-10 rounded-full"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowRepeatPassword(!showRepeatPassword)
                    }
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showRepeatPassword ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div> */}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-tangerine" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Sudah punya akun?{" "}
              <Link href="/auth/login" className="hover:underline underline-offset-4 font-bold text-tangerine">
                Masuk disini
              </Link>
            </div>
          </form>
      </div>
    </div>
  );
}
