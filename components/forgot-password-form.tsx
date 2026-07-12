"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
    <div className="flex h-full">
      {success ? (
        <Section className="flex-1 flex lg:flex-row flex-col-reverse items-center justify-center lg:gap-8 gap-4 bg-white dark:bg-card">
            <div className="max-w-100 w-full px-2 flex flex-col gap-2 lg:items-start items-center text-foreground mb-6 lg:mb-0">
              <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold text-pretty lg:text-left text-center">Reset link is on its way</h2>
              <p className="xs:text-p/5 text-sm/4 lg:max-w-140 font-medium text-pretty  lg:text-left text-center">
                Tautan reset password sudah kami kirimkan. Silakan buka email kamu dan ikuti langkah berikutnya untuk membuat password baru. Kamu bisa menutup tab ini.
              </p>
            </div>

            <div className="lg:w-107 md:w-100 sm:w-86 xs:w-70 w-full h-fit">
              <Image
                src={'/open-doodles/IceCreamDoodle.svg'}
                alt="Open Doodles - Ice Cream Doodle By Pablo Stanley"
                width={2000}
                height={2000}
                unoptimized
                priority
                className="w-full h-full object-contain"
              />
            </div>
          </Section>
      ) : (
        <Section className="flex-1 flex lg:flex-row flex-col-reverse items-center justify-center lg:gap-8 gap-4 bg-white dark:bg-card">
            <div className="max-w-100 w-full flex flex-col gap-2 lg:items-start items-center text-foreground mb-0 lg:mb-6 px-2">
              <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold lg:text-left text-center">Find your way back</h2>
              <p className="sm:text-p/5 text-sm/4 max-w-140 w-full font-medium lg:text-left text-center text-pretty">
                Masukkan email kamu, lalu kami akan bantu kirimkan tautan reset password agar kamu bisa kembali mengakses akunmu.
              </p>
              <form onSubmit={handleForgotPassword} className="w-full">
                <div className="flex flex-col lg:items-start items-center gap-3">
                  <div className="grid gap-2 w-full mt-3">
                    <Input
                      id="email"
                      type="email"
                      placeholder="dmai@gmail.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-full px-3 text-sm w-full"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button 
                    type="submit" 
                    className={`w-full lg:bg-orange-200 bg-orange-300/90 hover:bg-orange-300/90 dark:bg-primary flex items-center gap-2 h-fit`} 
                    disabled={isLoading}> 
                    {isLoading ? "Kirim..." : "Kirim Email Reset Password"}
                  </Button>
                </div>
              </form>
          </div>

          <div className="lg:w-107 md:w-100 sm:w-86 xs:w-70 w-full h-fit xs:px-0 px-6">
            <Image
              src={'/open-doodles/IceCreamDoodle.svg'}
              alt="Open Doodles - Ice Cream Doodle By Pablo Stanley"
              width={2000}
              height={2000}
              priority
              unoptimized
              className="w-full h-full object-contain"
            />
          </div>

        </Section>
      )}
    </div>
  );
}
