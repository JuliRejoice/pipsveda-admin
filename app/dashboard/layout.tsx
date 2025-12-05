"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Lexend } from "next/font/google";
import { getSocket } from "@/components/utils/webSocket";
// import { ThemeProvider } from '@/components/theme-provider';

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [toogle, setToogle] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socket = getSocket();

  useEffect(() => {
    if (!socket) {
      console.error("Socket not available");
      return;
    }

    const handleConnect = () => {
      socket.emit("check-withdrawal-request", {});
    };

    const handleCheckWithdrawalResponse = (data: any) => {
      const unread = data?.data || data?.unreadNotification || 0;

      setUnreadCount(() => unread);

      console.log("Updated unread: ", unread, data);
    };

    socket.on("connect", handleConnect);
    socket.on("check-withdrawal-request", handleCheckWithdrawalResponse);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("check-withdrawal-request", handleCheckWithdrawalResponse);
    };
  }, [socket]); // Only depend on socket

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("token");
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [router]);

  return (
    // <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <div className="flex bg-background">
      <Sidebar
        toogle={toogle}
        setToogle={setToogle}
        unreadCount={unreadCount}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitle} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
    // </ThemeProvider>
  );
}
