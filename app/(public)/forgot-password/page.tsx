import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — DMAI",
  description: "Reset kata sandimu untuk masuk kembali ke akun.",
};

export default function Page() {
  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      <ForgotPasswordForm />
    </div>
  );
}