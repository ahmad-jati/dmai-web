import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — DMAI",
  description: "Reset kata sandimu untuk masuk kembali ke akun.",
};

export default function Page() {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="w-full">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}