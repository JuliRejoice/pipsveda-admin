"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart, BookOpen, Calendar, CreditCard, 
  FileText, Home, Menu, Users, X, Bell, 
  LogOut, Settings, User, Sun, Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { signOut } from '../api/login';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const routes = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/dashboard/students', label: 'Students', icon: <Users className="h-5 w-5" /> },
    { href: '/dashboard/attendance', label: 'Attendance', icon: <Calendar className="h-5 w-5" /> },
    { href: '/dashboard/assignments', label: 'Assignments', icon: <BookOpen className="h-5 w-5" /> },
    { href: '/dashboard/homework', label: 'Homework', icon: <FileText className="h-5 w-5" /> },
    { href: '/dashboard/notices', label: 'Notices', icon: <Bell className="h-5 w-5" /> },
    { href: '/dashboard/fees', label: 'Fees', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <BarChart className="h-5 w-5" /> },
  ];

  const handleSignOut = async () => {
    await signOut();
   

    toast({
      title: "Signed out successfully",
    });
    window.location.href = '/';
  };

     
  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">EduManage</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark Theme</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 z-40 h-full w-72 border-r bg-background transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="text-xl font-bold">EduManage</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="py-4">
          <nav className="grid gap-1 px-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname === route.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="rounded-lg border bg-muted p-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="/placeholder-user.jpg" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? (
                  <>
                    <Sun className="mr-1 h-4 w-4" />
                    <span className="text-xs">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="mr-1 h-4 w-4" />
                    <span className="text-xs">Dark</span>
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" />
                <span className="text-xs">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:pl-72">
        <div className="px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}