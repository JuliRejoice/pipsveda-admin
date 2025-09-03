"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
// import { ThemeProvider } from '@/components/theme-provider';

const getPageTitle = (pathname: string): string => {
  const parts = pathname.split("/").filter(Boolean);

  const dashboardIndex = parts.indexOf("dashboard");
  let page = "dashboard";

  if (dashboardIndex !== -1 && parts.length > dashboardIndex + 1) {
    page = parts[dashboardIndex + 1];
  }

  return page
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("token");
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [router]);

  return (
    // <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <div className="flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitle} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">{children}</main>
      </div>
    </div>
    // </ThemeProvider>
  );
}
