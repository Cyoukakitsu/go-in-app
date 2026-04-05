"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { School, Calendar, User, LogOut, Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );
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

  const themes = [
    { name: "Sepia", value: "sepia", color: "#6F4E37" },
    { name: "Light", value: "light", color: "#FFFFFF" },
    { name: "Dark", value: "dark", color: "#141414" },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-lg border border-border-custom rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl z-50 md:top-6 md:bottom-auto md:h-14">
      <div className="flex items-center gap-1">
        {user && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary border-r border-border-custom mr-2">
            <span className="truncate max-w-[150px]">
              {user.user_metadata?.full_name || user.email?.split("@")[0]} 様
            </span>
          </div>
        )}
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
                  : "text-text-sub hover:bg-primary/5 hover:text-primary",
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
                : "text-text-sub hover:bg-primary/5 hover:text-primary",
            )}
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline">ログイン</span>
          </Link>
        )}

        {/* Theme Toggle Button */}
        <div className="pl-2 ml-1 border-l border-border-custom">
          <DropdownMenu>
            <MenuPrimitive.Trigger
              className="flex items-center justify-center w-10 h-10 rounded-full text-text-sub hover:bg-primary/5 hover:text-primary transition-all relative group cursor-pointer outline-none"
              aria-label="テーマ切り替え"
            >
              <Palette className="w-5 h-5 transition-transform group-hover:scale-110" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
            </MenuPrimitive.Trigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-card/95 backdrop-blur-md border-border-custom rounded-2xl shadow-2xl p-2"
            >
              <div className="px-2 py-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                テーマ
              </div>
              {themes.map((t) => (
                <DropdownMenuItem
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors mb-1 last:mb-0",
                    mounted && theme === t.value
                      ? "bg-primary text-white font-bold"
                      : "text-text-main hover:bg-primary/10",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-sm">{t.name}</span>
                  </div>
                  {mounted && theme === t.value && (
                    <Check className="w-4 h-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
