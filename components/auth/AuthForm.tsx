"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // In a real scenario, integrate Supabase Auth here
    // const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  const title = mode === "login" ? "ログイン" : "新規登録";
  const description = mode === "login" 
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
          <CardTitle className="text-3xl font-serif text-text-main">{title}</CardTitle>
          <CardDescription className="text-text-sub mt-2">{description}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-text-main font-bold">メールアドレス</Label>
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
              <Label htmlFor="password" className="text-text-main font-bold">パスワード</Label>
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
                />
              </div>
            </div>
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
                  <Link href="/auth/signup" className="text-primary font-bold hover:underline">
                    新規登録
                  </Link>
                </>
              ) : (
                <>
                  既にアカウントをお持ちですか？{" "}
                  <Link href="/auth/login" className="text-primary font-bold hover:underline">
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
