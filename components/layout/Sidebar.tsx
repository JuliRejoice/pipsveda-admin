"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Pipslogo from "@/public/images/pipslogo";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Bot,
  MessageCircle,
  CreditCard,
  Bell,
  UserPlus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
  Settings as SettingsIcon,
  Waves,
  Gift,
  LayoutList,
  MapPin,
  FileVideo,
  Video,
  VideoIcon,
  HandCoins,
  Wallet,
  CircleDollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InstructorImg from "@/public/images/instructor.js";
import FiveVedaLogo from "@/public/icons/FiveVedaLogo.png";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Category",
    href: "/dashboard/category",
    icon: LayoutList,
  },
  {
    title: "Center",
    href: "/dashboard/center",
    icon: MapPin,
  },
  {
    title: "Instructors",
    href: "/dashboard/instructor",
    icon: InstructorImg,
  },
  {
    title: "Courses",
    href: "/dashboard/courses",
    icon: BookOpen,
  },
  {
    title: "AlgoBots",
    href: "/dashboard/algobots",
    icon: Bot,
  },
  {
    title: "Telegram",
    href: "/dashboard/telegram",
    icon: MessageCircle,
  },
  {
    title: "Coupons",
    href: "/dashboard/coupons",
    icon: Gift,
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: CircleDollarSign,
  },
  {
    title: "Withdrawals",
    href: "/dashboard/withdrawals",
    icon: Wallet,
  },
  // {
  //   title: 'Notifications',
  //   href: '/dashboard/notifications',
  //   icon: Bell
  // },
  // {
  //   title: 'Referrals',
  //   href: '/dashboard/referrals',
  //   icon: UserPlus
  // },
  {
    title: "Newsletter",
    href: "/dashboard/newsletter",
    icon: Mail,
  },
  {
    title: "Contact",
    href: "/dashboard/contact",
    icon: MessageSquare,
  },
  {
    title: "Utility",
    href: "/dashboard/utility",
    icon: Waves,
  },

  // {
  //   title: 'Content',
  //   href: '/dashboard/content',
  //   icon: SettingsIcon
  // },
  {
    title: "YouTube",
    href: "/dashboard/youtube",
    icon: VideoIcon,
  },
];
interface SidebarProps {
  setToogle: (value: boolean) => void;
  toogle: boolean;
  unreadCount: number; // or whatever type unreadCount should be
}
export default function Sidebar({
  setToogle,
  toogle,
  unreadCount,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string }>({});
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
  }, []);

  return (
    <div
      className={cn(
        "bg-[#f5f5f5] transition-all duration-300 flex flex-col h-screen sticky top-0",
        isCollapsed ? "w-16" : "w-[280px]"
      )}
    >
      {/* Toggle Button - Fixed at the top right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-5 top-14 z-10 rounded-lg border bg-background p-0",
          "flex items-center justify-center hover:bg-muted w-8 h-8"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Header with Logo */}
      <div className="flex items-center justify-between px-4 border-b relative">
        <div
          className={cn(
            "flex items-center space-x-2 transition-all duration-400 ease-in-out",
            isCollapsed ? "w-full justify-center" : ""
          )}
        >
          <div
            className={cn(
              "relative transition-all duration-400 ease-in-out ",
              isCollapsed ? "my-4 w-16" : "w-[75px] my-4"
            )}
          >
            {/* <Image 
              src="/images/logo.svg" 
              alt="Valor Trading Academy Logo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            /> */}
            {/* {isCollapsed ? (
              <Pipslogo width="60px" height="70px" />
            ) : (
              <Pipslogo width="w-500px" height="h-400px" />
            )} */}
            {isCollapsed ? (
              <div className="w-full flex justify-center">
                <div className="relative w-10 h-10">
                  <Image
                    src={FiveVedaLogo}
                    alt="Five Veda Logo"
                    fill
                    className="object-contain p-1"
                    priority
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center w-full px-2">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={FiveVedaLogo}
                    alt="Five Veda Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <h2 className="ml-3 text-xl font-bold whitespace-nowrap bg-gradient-to-b from-[#774183]  to-[#6B4FD8] bg-clip-text text-transparent">
                  Five Veda
                </h2>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className={`flex-1 ${isCollapsed ? "p-2" : "p-4"}`}>
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    `w-full justify-start  group ${
                      isCollapsed
                        ? "!px-0 flex items-center justify-center"
                        : ""
                    } ${isActive && !isCollapsed ? "px-0" : "px-4"}`,
                    isCollapsed ? "h-10" : "h-12",
                    "relative"
                  )}
                >
                  <div
                    className={cn("h-6 w-6 relative", !isCollapsed && "mr-3")}
                  >
                    <Icon />
                    {item.title === "Withdrawals" && unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 ml-2 bg-red-500 text-white text-xs  rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-base font-medium ${
                      !isActive ? "text-gray-900" : "text-white"
                    }`}
                  >
                    {!isCollapsed && (
                      <div className="flex items-center">{item.title}</div>
                    )}
                    {isCollapsed &&
                      item.title === "Withdrawals" &&
                      unreadCount > 0 && (
                        <span className="absolute -top-1 -right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                  </span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Profile Section */}
      <div
        className={cn(
          "border-t border-muted p-4 mt-auto",
          isCollapsed ? "px-2 py-4" : "p-4"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between h-auto p-2",
                isCollapsed
                  ? "flex-col items-center justify-center space-y-1"
                  : "flex items-center"
              )}
            >
              <div className="flex items-center">
                <Avatar
                  className={cn("h-8 w-8", isCollapsed ? "mx-auto" : "mr-2")}
                >
                  <AvatarFallback className="text-base font-semibold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="text-left">
                    <p className="text-base font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground font-lexend">
                      {user?.email}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align={isCollapsed ? "start" : "end"}
            side={isCollapsed ? "right" : "top"}
          >
            {/* <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem> */}
            <DropdownMenuItem onClick={handleLogoutClick}>
              <LogOut className="mr-2 h-5 w-5 text-blacktheme" />
              <span className="text-base font-medium">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
