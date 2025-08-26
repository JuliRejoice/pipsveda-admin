"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bot, Tag, Gift, Cpu, Building2 } from "lucide-react";

const subNavItems = [
  {
    title: "AlgoBots",
    href: "/dashboard/algobots",
    icon: Bot,
  },
  {
    title: "Bot",
    href: "/dashboard/algobots/bot",
    icon: Cpu,
  },
  {
    title: "Company",
    href: "/dashboard/algobots/company",
    icon: Building2,
  },
  {
    title: "Category",
    href: "/dashboard/algobots/category",
    icon: Tag,
  },
  // {
  //   title: "Coupons",
  //   href: "/dashboard/algobots/coupons",
  //   icon: Gift,
  // },
];

export default function AlgoBotsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Top sub-navigation */}
      <div className="bg-background border-b border-border">
        <nav className="px-6">
          <div className="flex items-center gap-6 overflow-x-auto">
            {subNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/dashboard/algobots" && pathname === "/dashboard/algobots");

              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn("relative flex items-center gap-2 px-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors", isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-6">{children}</div>
    </div>
  );
}
