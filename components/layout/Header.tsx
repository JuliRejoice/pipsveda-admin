'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Optionally render a placeholder or nothing until mounted
    return (
      <button className="p-2 rounded border" aria-label="Toggle theme" disabled>
        <Sun className="w-5 h-5 opacity-50" />
      </button>
    );
  }

  // return (
  //   <button
  //     aria-label="Toggle theme"
  //     onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
  //     className="p-2"
  //   >
  //     {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
  //   </button>
  // );
}

interface HeaderProps {
  title?: string;
  className?: string;
}

export default function Header({ title = 'Dashboard', className }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push('/');
  };

  return (
    <header className={cn("bg-background border-b px-6 py-5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-blacktheme">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* <ThemeToggle /> */}
        </div>
      </div>
    </header>
  );
}