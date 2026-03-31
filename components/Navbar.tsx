"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { School, Calendar, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/dashboard");
    router.refresh();
  };

  if (pathname.startsWith("/auth")) return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: School },
    { name: "マイカレンダー", href: "/calendar", icon: Calendar },
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
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          );
        })}

        {user ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-text-sub hover:bg-primary/5 hover:text-primary transition-all"
            title={user.email}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">ログアウト</span>
          </button>
        ) : (
          <Link
            href="/auth/login"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all",
              pathname === "/auth/login"
                ? "bg-primary text-white shadow-md"
                : "text-text-sub hover:bg-primary/5 hover:text-primary"
            )}
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline">ログイン</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
