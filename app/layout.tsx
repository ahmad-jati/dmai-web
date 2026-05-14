import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Footer } from "@/components/footer";
import { MainNavbar } from "@/components/main-navbar";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Digital Mindful Autogenic Intervention",
  description: "A calm mindfulness platform for guided reflective training sessions.",
};

const urbanistSans = Urbanist({
  variable: '--font-urbanist',
  subsets: ["latin"],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${urbanistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col items-center px-16 gap-8 lg:max-w-7xl mx-auto min-h-dvh">
            <MainNavbar/>
            {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}