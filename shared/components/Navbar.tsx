"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, User, LogOut, KeyRound, Trash2, Lock, Loader2, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { createBrowserClient } from "@/shared/lib/supabase/browser";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { ThemeToggle } from "./ThemeToggle";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";

const passwordSchema = z
  .object({
    password: z.string().min(6, "パスワードは6文字以上で入力してください。"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません。",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

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
    router.push("/");
    router.refresh();
  };

  const handleDeleteAllData = async () => {
    if (!confirm("カレンダーの全データを削除しますか？この操作は取り消せません。")) return;
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("user_schedules")
      .delete()
      .eq("user_id", user!.id);
    if (error) {
      alert("削除に失敗しました。もう一度お試しください。");
    } else {
      window.dispatchEvent(new CustomEvent("schedules-updated"));
    }
  };

  const handleChangePassword = async (values: PasswordFormValues) => {
    setPwLoading(true);
    setPwError(null);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setPwError("パスワードの変更に失敗しました。もう一度お試しください。");
      setPwLoading(false);
      return;
    }
    setPwSuccess(true);
    setPwLoading(false);
    setTimeout(() => {
      setShowChangePassword(false);
      setPwSuccess(false);
      reset();
    }, 1500);
  };

  const closeModal = () => {
    setShowChangePassword(false);
    setPwError(null);
    setPwSuccess(false);
    reset();
  };

  if (pathname.startsWith("/auth") || pathname === "/") return null;

  const navItems = [
    { name: "マイカレンダー", href: "/calendar", icon: Calendar },
  ];

  return (
    <>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-lg border border-border-custom rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl z-50 md:top-6 md:bottom-auto md:h-14">
        <div className="flex items-center gap-1">
          {user && (
            <div className="hidden md:flex items-center border-r border-border-custom mr-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary rounded-full hover:bg-primary/5 transition-all cursor-pointer">
                  <span className="truncate max-w-37.5">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]} 様
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                  <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
                    <KeyRound className="w-4 h-4 mr-2" />
                    パスワードを変更
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleDeleteAllData}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    全データを削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

          <div className="pl-2 ml-1 border-l border-border-custom">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {showChangePassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-bg-card border border-border-custom rounded-2xl shadow-2xl w-full max-w-md">
            <div className="h-1.5 bg-linear-to-r from-primary to-accent rounded-t-2xl" />
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-bold text-text-main">
                  パスワードを変更
                </h2>
                <button
                  onClick={closeModal}
                  className="text-text-muted hover:text-text-main transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {pwSuccess ? (
                <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 font-medium text-center">
                  パスワードを変更しました。
                </p>
              ) : (
                <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-5">
                  {pwError && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 font-medium">
                      {pwError}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="pw-new" className="text-text-main font-bold">
                      新しいパスワード
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <Input
                        id="pw-new"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 border-primary/15 rounded-xl h-12"
                        {...register("password")}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive font-medium ml-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pw-confirm" className="text-text-main font-bold">
                      パスワード（確認）
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <Input
                        id="pw-confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 border-primary/15 rounded-xl h-12"
                        {...register("confirmPassword")}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive font-medium ml-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-white rounded-xl h-12 font-bold hover:opacity-90 shadow-lg mt-2"
                    disabled={pwLoading}
                  >
                    {pwLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "変更する"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
