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
        <Section className="flex lg:flex-row flex-col-reverse lg:items-center justify-center items-end  lg:gap-8 gap-6 bg-white">
            <div className="flex-1 flex flex-col gap-3.5 items-start text-foreground max-w-120">
              <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold text-center text-pretty">Reset link is on its way</h2>
              <p className="xs:text-p/5 text-sm/4 max-w-140 font-medium text-pretty">
                Tautan reset password sudah kami kirimkan. Silakan buka email kamu dan ikuti langkah berikutnya untuk membuat password baru. Kamu bisa menutup tab ini.
              </p>
            </div>

            <div className="lg:w-107 lg:h-96 w-70 h-40 ">
              <Image
                src={'/tropicaline/Email.png'}
                alt=""
                width={2000}
                height={2000}
                priority
                className="w-full h-full object-contain"
              />
            </div>
          </Section>
      ) : (
        <div className="w-full">
          <Section className="flex lg:flex-row flex-col-reverse lg:items-center justify-center items-end  lg:gap-8 gap-6 bg-white w-full">
            <div className="lg:flex-1 w-full lg:max-w-120 flex flex-col gap-3.5 items-start text-foreground">
              <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold text-center">Find your way back</h2>
              <p className="sm:text-p/5 text-sm/4 max-w-140 font-medium">
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
                      className="rounded-full px-3 text-sm"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send reset email"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="lg:w-107 lg:h-96 w-70 h-40 ">
              <Image
                src={'/tropicaline/Email.png'}
                alt=""
                width={2000}
                height={2000}
                priority
                className="w-full h-full object-contain"
              />
            </div>

          </Section>
        </div>
      )}
    </div>
  );
}
