import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Satu langkah lagi untuk mulai masuk</CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Silakan <span className="font-bold">cek email</span> untuk mengonfirmasi akun sebelum masuk ke platform. Setelah itu, kamu bisa menutup tab ini.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
