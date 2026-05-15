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
import { useState } from "react";
import { Section } from "./layout/section-wrapper";
import Image from "next/image";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {success ? (
        <Section className="flex items-center justify-center gap-8 bg-white">
            <div className="flex-1 flex flex-col gap-3.5 items-start text-foreground max-w-120">
              <h2>Reset link is on its way</h2>
              <p className="text-lg">
                Tautan reset password sudah kami kirimkan. Silakan buka email kamu dan ikuti langkah berikutnya untuk membuat password baru. Kamu bisa menutup tab ini.
              </p>
            </div>
            <Image
              src={'/tropicaline/Email.png'}
              alt=""
              width={2000}
              height={2000}
              className="w-107 h-96 object-contain "
              loading="eager"
            />
            

          </Section>
      ) : (
        <div className="w-full">
          <Section className="flex items-center justify-center gap-8 bg-white">
            <div className="flex-1 flex flex-col gap-3.5 items-start text-foreground max-w-120">
              <h2>Find your way back</h2>
              <p className="text-lg">
                Masukkan email kamu, lalu kami akan bantu kirimkan tautan reset agar kamu bisa kembali mengakses akunmu.
              </p>
              <form onSubmit={handleForgotPassword} className="w-full">
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-full px-3"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send reset email"}
                  </Button>
                </div>
              </form>
            </div>

            <Image
              src={'/tropicaline/Email.png'}
              alt=""
              width={2000}
              height={2000}
              className="w-107 h-96 object-contain "
              loading="eager"
            />

          </Section>
        </div>
      )}
    </div>
  );
}
