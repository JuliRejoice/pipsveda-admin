import "./globals.css";
import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pips Veda",
  description: "Admin dashboard for course and algobot management",
  icons: {
    icon: "/icons/faviconNew.svg", // Make sure this exists in your /public/images folder
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} ${lexend.variable} font-sans`}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
