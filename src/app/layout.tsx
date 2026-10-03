import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "The Champions Club — Athletic Excellence & Heritage Social Quarters",
  description: "Premier Private Athletic Club, Court Booking, Pro Shop, and Dining Lounge Operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[#FAF8F5] dark:bg-[#080D14] text-[#111827] dark:text-[#F3F4F6] flex flex-col font-sans antialiased selection:bg-[#921111] selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
