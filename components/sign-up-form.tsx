'use client'

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConsentDialog } from "./consent-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon, SpinnerIcon } from "@phosphor-icons/react";

// Samakan dengan minimum password length yang dikonfigurasi di
// Supabase Dashboard > Authentication > Policies (default Supabase: 6).
const MIN_PASSWORD_LENGTH = 6;

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [fullname, setFullname] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const isPasswordTooShort =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH;

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Password kependekan sudah ditandai lewat helper text merah di bawah
    // input (isPasswordTooShort) — cukup blokir submit-nya di sini,
    // tanpa duplikasi pesan error yang sama di bawah form.
    if (password.length < MIN_PASSWORD_LENGTH) {
      return;
    }

    // Semua field lolos validasi (required bawaan browser + panjang password)
    // baru consent dialog ditampilkan.
    setShowConsent(true);
  }

  const handleConsentAccept = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
          data: { full_name: fullname },
        },
      });
      if (error) throw error;
      setShowConsent(false);
      setSuccess(true);
    } catch (error: unknown) {
      setShowConsent(false);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={success} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Halo, {fullname}! 👋</DialogTitle>
            <DialogDescription>
              Terima kasih telah bergabung dengan DAMAI. Masuk untuk mulai mengakses sesi dan latihan yang tersedia.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full bg-sky-200/70 hover:bg-sky-300/60"
              onClick={() => router.push("/login")}
            >
              Ke halaman homepage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConsentDialog
        open={showConsent}
        onOpenChange={setShowConsent}
        onAccept={handleConsentAccept}
        isSubmitting={isLoading}
      />

      <div className='flex flex-col items-center sm:gap-8 gap-4'>
        <div className="w-full">
          <form onSubmit={handleFormSubmit} className="w-full flex flex-col justify-center items-center">
            <div className="flex flex-col sm:gap-6 gap-4 w-full">
              <div className="grid gap-2">
                <Label htmlFor="fullname">Nama</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="John Doe "
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
                  placeholder="dmai@gmail.com"
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
                <p
                  className={`px-3 text-xs ${
                    isPasswordTooShort ? "text-red-500" : "text-muted-foreground"
                  }`}
                >
                  Minimal {MIN_PASSWORD_LENGTH} karakter
                </p>
              </div>

              {error && <p className="text-sm text-center font-medium text-red-500">{error}</p>}

              <div className="w-full flex justify-center">
                <Button
                  type="submit"
                  className="max-w-80 w-full bg-yellow-100 hover:bg-yellow-200! dark:bg-primary flex items-center gap-2 h-fit 2xs:[&_svg]:size-4 [&_svg]:size-3.5"
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
              <Link
                href="/login"
                className="hover:underline underline-offset-4 font-bold text-foreground dark:text-primary"
              >
                Masuk disini
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}