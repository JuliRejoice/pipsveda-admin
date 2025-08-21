import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import "./globals.css"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pips Veda',
  description: 'Admin dashboard for course and algobot management',
  icons: {
    icon: '/icons/favicon.ico', // Make sure this exists in your /public/images folder
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
