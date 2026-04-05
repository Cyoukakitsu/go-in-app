"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, Loader2, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createBrowserClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMsg("メールアドレスまたはパスワードが正しくありません。");
        setLoading(false);
        return;
      }
    } else {
      if (password !== confirmPassword) {
        setErrorMsg("パスワードが一致しません。");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          setErrorMsg("このメールアドレスはすでに登録されています。");
        } else {
          setErrorMsg("登録に失敗しました。もう一度お試しください。");
        }
        setLoading(false);
        return;
      }
    }

    router.push("/calendar");
    router.refresh();
  };

  const title = mode === "login" ? "ログイン" : "新規登録";
  const description =
    mode === "login"
      ? "アカウントにログインして、志望校を管理しましょう。"
      : "アカウントを作成して、受験スケジュールを計画しましょう。";

  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center px-6">
      <Link
        href="/dashboard"
        className="mb-8 flex items-center gap-2 text-text-sub hover:text-primary transition-colors font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboardに戻る
      </Link>

      <Card className="w-full max-w-md bg-bg-card border-border-custom rounded-2xl shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-accent" />

        <CardHeader className="pt-10 pb-6 text-center">
          <CardTitle className="text-3xl font-serif text-text-main">
            {title}
          </CardTitle>
          <CardDescription className="text-text-sub mt-2">
            {description}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-8">
            {errorMsg && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
                {errorMsg}
              </p>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-text-main font-bold">
                  お名前
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="山田 太郎"
                    className="pl-10 border-primary/15 rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10 h-12"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-text-main font-bold">
                メールアドレス
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 border-primary/15 rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-text-main font-bold">
                パスワード
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 border-primary/15 rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-text-main font-bold"
                >
                  パスワード（確認）
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 border-primary/15 rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10 h-12"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-6 pt-6 pb-10 px-8">
            <Button
              type="submit"
              className="w-full bg-primary text-white rounded-xl h-12 font-bold hover:opacity-90 shadow-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : title}
            </Button>

            <div className="text-center text-sm text-text-sub">
              {mode === "login" ? (
                <>
                  アカウントをお持ちでないですか？{" "}
                  <Link
                    href="/auth/signup"
                    className="text-primary font-bold hover:underline"
                  >
                    新規登録
                  </Link>
                </>
              ) : (
                <>
                  既にアカウントをお持ちですか？{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary font-bold hover:underline"
                  >
                    ログイン
                  </Link>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
