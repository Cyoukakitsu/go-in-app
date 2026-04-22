"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@/shared/lib/supabase/browser";

const authSchema = z
  .object({
    email: z.string().email("有効なメールアドレスを入力してください。"),
    password: z.string().min(6, "パスワードは6文字以上で入力してください。"),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.confirmPassword !== undefined &&
        data.password !== data.confirmPassword
      ) {
        return false;
      }
      return true;
    },
    {
      message: "パスワードが一致しません。",
      path: ["confirmPassword"],
    },
  );

type AuthFormValues = z.infer<typeof authSchema>;

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: undefined,
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setLoading(true);
    setErrorMsg(null);

    const supabase = createBrowserClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setErrorMsg("メールアドレスまたはパスワードが正しくありません。");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
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

    // 添加短暂延迟，确保认证状态更新后再跳转
    setTimeout(() => {
      router.push("/calendar");
      router.refresh(); // 刷新路由以确保状态更新
    }, 100);
  };

  const title = mode === "login" ? "ログイン" : "新規登録";
  const description =
    mode === "login"
      ? "アカウントにログインして、志望校を管理しましょう。"
      : "アカウントを作成して、受験スケジュールを計画しましょう。";

  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center px-6">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-text-sub hover:text-primary transition-colors font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        ホームに戻る
      </Link>

      <Card className="w-full max-w-md bg-bg-card border-border-custom rounded-2xl shadow-xl overflow-hidden">
        <div className="h-2 bg-linear-to-r from-primary to-accent" />

        <CardHeader className="pt-10 pb-6 text-center">
          <CardTitle className="text-3xl font-serif text-text-main">
            {title}
          </CardTitle>
          <CardDescription className="text-text-sub mt-2">
            {description}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 px-8">
            {errorMsg && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 font-medium">
                {errorMsg}
              </p>
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
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive font-medium ml-1">
                  {errors.email.message}
                </p>
              )}
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
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive font-medium ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-text-main font-bold"
                >
                  パスワード（确认）
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 border-primary/15 rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10 h-12"
                    {...register("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive font-medium ml-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
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
