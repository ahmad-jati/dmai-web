import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/update-password-form";

export const metadata: Metadata = {
  title: "Update Password — DAMAI",
  description: "Buat kata sandi baru untuk akunmu.",
};

export default function Page() {
  return (
    <UpdatePasswordForm />
  );
}