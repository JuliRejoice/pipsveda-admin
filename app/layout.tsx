import "./globals.css";
import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import FiveVedaLogo from "@/public/icons/FiveVedaLogo.png";

const inter = Inter({ subsets: ["latin"] });

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Five Veda",
  description: "Admin dashboard for course and algobot management",
  icons: {
    icon: FiveVedaLogo.src,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
          <link rel="preconnect" href="https://fonts.gstatic.com"/>
            <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} ${lexend.variable} font-sans`}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
