"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { School, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  // Hide navbar on auth pages
  if (pathname.startsWith("/auth")) return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: School },
    { name: "マイカレンダー", href: "/calendar", icon: Calendar },
    { name: "ログイン", href: "/auth/login", icon: User },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-lg border border-border-custom rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl z-50 md:top-6 md:bottom-auto md:h-14">
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all",
                isActive 
                  ? "bg-primary text-white shadow-md" 
                  : "text-text-sub hover:bg-primary/5 hover:text-primary"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className={cn("hidden md:inline")}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
