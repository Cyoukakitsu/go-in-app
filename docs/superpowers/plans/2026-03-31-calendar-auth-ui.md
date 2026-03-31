# Calendar Auth & UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase Auth接続・user_schedulesテーブル導入・カレンダーUIの5点改善（ラベル変更・重複ハイライト・削除・追加モーダル）を実装する。

**Architecture:** カレンダーページは'use client'のままSupabaseクライアントで直接データ取得・更新。AuthはSupabase Auth（@supabase/auth-helpers-nextjs）で接続。データはuser_schedulesテーブルに一元化し、既存Bookmark型へのマッパーで各コンポーネントは無変更。

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (`@supabase/auth-helpers-nextjs@0.15`), shadcn/ui, Tailwind CSS, pnpm

---

## ファイル変更マップ

| ファイル | 操作 | 理由 |
|---------|------|------|
| `supabase/migrations/001_user_schedules.sql` | 新規作成 | user_schedulesテーブル定義 |
| `lib/supabase/browser.ts` | 新規作成 | ブラウザ用Supabaseクライアント |
| `lib/supabase/server.ts` | 新規作成 | サーバー用Supabaseクライアント |
| `lib/supabase.ts` | 維持 | dashboardページが使用中、互換維持 |
| `components/calendar/types.ts` | 修正 | UserScheduleRow型・toBookmarkマッパー追加 |
| `components/Navbar.tsx` | 修正 | ラベル変更 + Auth状態表示 |
| `app/calendar/page.tsx` | 修正 | ラベル変更 + 実データ化 + 認証ガード |
| `components/calendar/GanttView.tsx` | 修正 | 重複試験日ハイライト追加 |
| `components/calendar/SchoolSidebar.tsx` | 修正 | 削除ボタン追加 |
| `components/calendar/AddScheduleModal.tsx` | 新規作成 | 学校追加モーダル（検索+手動入力） |
| `components/auth/AuthForm.tsx` | 修正 | Supabase Auth実接続 |

---

## Task 1: ラベル変更（クイックウィン）

**Files:**
- Modify: `components/Navbar.tsx`
- Modify: `app/calendar/page.tsx`

- [ ] **Step 1: Navbarの「カレンダー」→「マイカレンダー」に変更**

`components/Navbar.tsx` の `navItems` を以下に変更:

```tsx
const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: School },
  { name: "マイカレンダー", href: "/calendar", icon: Calendar },
  { name: "ログイン", href: "/auth/login", icon: User },
];
```

- [ ] **Step 2: カレンダーページのビュー切替ボタンを日本語化**

`app/calendar/page.tsx` の2つのボタンを変更:

```tsx
// "Timeline" → "一覧"
<button onClick={() => setActiveView('timeline')} ...>
  <LayoutList className="w-4 h-4" />
  一覧
</button>

// "Gantt" → "年表"
<button onClick={() => setActiveView('gantt')} ...>
  <GanttChartSquare className="w-4 h-4" />
  年表
</button>
```

- [ ] **Step 3: 型チェック**

```bash
cd /Users/zhaojiayi/Desktop/school-search-app && pnpm tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add components/Navbar.tsx app/calendar/page.tsx
git commit -m "feat: ナビ・ビュー切替ボタンを日本語化"
```

---

## Task 2: DBマイグレーション（user_schedulesテーブル）

**Files:**
- Create: `supabase/migrations/001_user_schedules.sql`

- [ ] **Step 1: マイグレーションファイルを作成**

```sql
-- supabase/migrations/001_user_schedules.sql

CREATE TABLE IF NOT EXISTS user_schedules (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  -- 既存DBから追加した場合（任意）
  university_schedule_id  uuid REFERENCES university_schedules ON DELETE SET NULL,
  -- 学校情報（既存連携時はコピー、手動入力時は直接入力）
  university_name         text NOT NULL,
  university_name_zh      text,
  university_type         text NOT NULL DEFAULT '私立'
    CHECK (university_type IN ('国立', '公立', '私立')),
  department              text,
  -- 日程
  application_start       date,
  application_end         date,
  exam_date               date,
  interview_date          date,
  result_date             date,
  -- ステータス
  status                  text NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'applied', 'examined', 'passed', 'failed')),
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE user_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のスケジュールのみ参照可能"
  ON user_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のスケジュールのみ追加可能"
  ON user_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のスケジュールのみ更新可能"
  ON user_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のスケジュールのみ削除可能"
  ON user_schedules FOR DELETE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Supabase SQL EditorでSQLを実行**

Supabaseダッシュボード → SQL Editor → 上記SQLを貼り付けて実行。
確認: `user_schedules` テーブルがTable Editorに表示されること。

- [ ] **Step 3: コミット**

```bash
git add supabase/migrations/001_user_schedules.sql
git commit -m "feat: user_schedulesテーブルのマイグレーション追加"
```

---

## Task 3: Supabaseクライアントユーティリティ

**Files:**
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: ブラウザ用クライアントを作成**

```ts
// lib/supabase/browser.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function createBrowserClient() {
  return createClientComponentClient()
}
```

- [ ] **Step 2: サーバー用クライアントを作成**

```ts
// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createServerClient() {
  return createServerComponentClient({ cookies })
}
```

- [ ] **Step 3: 型チェック**

```bash
pnpm tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add lib/supabase/browser.ts lib/supabase/server.ts
git commit -m "feat: Supabaseブラウザ・サーバークライアントユーティリティ追加"
```

---

## Task 4: Auth接続（AuthForm）

**Files:**
- Modify: `components/auth/AuthForm.tsx`

- [ ] **Step 1: AuthFormをSupabase Authに接続**

`components/auth/AuthForm.tsx` の `handleSubmit` を以下に置き換える（ファイル全体）:

```tsx
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
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createBrowserClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg("メールアドレスまたはパスワードが正しくありません。");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
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
          <CardTitle className="text-3xl font-serif text-text-main">{title}</CardTitle>
          <CardDescription className="text-text-sub mt-2">{description}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-8">
            {errorMsg && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
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
```

- [ ] **Step 2: 型チェック**

```bash
pnpm tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: 動作確認**

1. `pnpm dev` でアプリ起動
2. `/auth/signup` で新規アカウント作成（テスト用メアド・パスワード6文字以上）
3. Supabaseダッシュボード → Authentication → Users でユーザーが作成されていることを確認
4. `/auth/login` でログイン → `/calendar` にリダイレクトされることを確認
5. 間違ったパスワードでログイン → 日本語エラーメッセージが表示されることを確認

- [ ] **Step 4: コミット**

```bash
git add components/auth/AuthForm.tsx
git commit -m "feat: AuthFormをSupabase Authに接続"
```

---

## Task 5: NavbarにAuth状態を反映

**Files:**
- Modify: `components/Navbar.tsx`

- [ ] **Step 1: Navbarをファイル全体で置き換え**

```tsx
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
```

- [ ] **Step 2: 型チェック**

```bash
pnpm tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: 動作確認**

1. ログイン状態でNavbarに「ログアウト」が表示されることを確認
2. 未ログイン状態で「ログイン」リンクが表示されることを確認
3. 「ログアウト」クリック → `/dashboard` にリダイレクトされ、Navbarが「ログイン」に戻ることを確認

- [ ] **Step 4: コミット**

```bash
git add components/Navbar.tsx
git commit -m "feat: NavbarにAuth状態（ログイン/ログアウト）を反映"
```

---

## Task 6: Bookmark型更新（types.tsのみ）

**Files:**
- Modify: `components/calendar/types.ts`

> **注意:** カレンダーページの実データ化はTask 9（AddScheduleModal作成）の後にTask 10で行う。依存関係の順序を守ること。

- [ ] **Step 1: types.tsにUserScheduleRow型とマッパーを追加**

`components/calendar/types.ts` に以下を追記（既存の型はそのまま維持）:

```ts
// DB行の型（user_schedulesテーブル）
export interface UserScheduleRow {
  id: string
  user_id: string
  university_schedule_id: string | null
  university_name: string
  university_name_zh: string | null
  university_type: string
  department: string | null
  application_start: string | null
  application_end: string | null
  exam_date: string | null
  interview_date: string | null
  result_date: string | null
  status: string
  notes: string | null
  created_at: string
}

// DB行 → Bookmark型へのマッパー
export function toBookmark(row: UserScheduleRow): Bookmark {
  return {
    id: row.id,
    university_name: row.university_name,
    university_name_zh: row.university_name_zh ?? '',
    department: row.department ?? '',
    type: (row.university_type as UniversityType) ?? '私立',
    status: (row.status as BookmarkStatus) ?? 'planning',
    schedule: {
      application_start: row.application_start ?? '',
      application_end: row.application_end ?? '',
      exam_date: row.exam_date ?? '',
      interview_date: row.interview_date ?? null,
      result_date: row.result_date ?? '',
    },
  }
}
```

- [ ] **Step 2: 型チェック**

```bash
pnpm tsc --noEmit
```

Expected: エラーなし（calendar/page.tsxはまだ変更していないので型エラーは出ない）

- [ ] **Step 3: コミット**

```bash
git add components/calendar/types.ts
git commit -m "feat: UserScheduleRow型とtoBookmarkマッパーをtypes.tsに追加"
```

---

## Task 7: GanttViewに重複ハイライト追加

**Files:**
- Modify: `components/calendar/GanttView.tsx`

- [ ] **Step 1: GanttViewに重複検出ロジックとハイライトを追加**

`components/calendar/GanttView.tsx` を以下のように修正（`getConflictedIds` 関数と表示を追加）:

`GanttViewProps` の直後、`getDateRange` の前に追加:

```ts
// exam_dateが重複しているbookmarkIdのセット
function getConflictedIds(bookmarks: Bookmark[]): Set<string> {
  const dateCounts: Record<string, string[]> = {}
  for (const b of bookmarks) {
    const d = b.schedule.exam_date
    if (!d) continue
    if (!dateCounts[d]) dateCounts[d] = []
    dateCounts[d].push(b.id)
  }
  const conflicted = new Set<string>()
  for (const ids of Object.values(dateCounts)) {
    if (ids.length > 1) ids.forEach((id) => conflicted.add(id))
  }
  return conflicted
}
```

`GanttView` 関数内、`getDateRange` 呼び出しの直後に追加:

```ts
const conflictedIds = getConflictedIds(bookmarks)
```

各学校行の `div` にクラスを追加（`isDimmed` の後）:

```tsx
const isConflicted = conflictedIds.has(b.id)

<div
  key={b.id}
  className={`flex items-center gap-2 mb-3 transition-opacity duration-200 ${
    isDimmed ? 'opacity-30' : 'opacity-100'
  }`}
>
```

`exam_date` ポイントイベントのdotに重複ハイライトを追加（`POINT_EVENTS.map` 内）:

```tsx
{POINT_EVENTS.map((eventType) => {
  const dateStr = b.schedule[eventType]
  if (!dateStr) return null
  const isDotConflicted = eventType === 'exam_date' && isConflicted
  return (
    <div
      key={eventType}
      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
        isDotConflicted ? 'ring-2 ring-destructive ring-offset-1' : ''
      }`}
      style={{
        left: `${toPct(dateStr)}%`,
        backgroundColor: isDotConflicted
          ? '#AF4448'
          : EVENT_CONFIG[eventType].color,
      }}
      title={`${EVENT_CONFIG[eventType].label}: ${dateStr}${isDotConflicted ? ' ⚠️ 重複' : ''}`}
    />
  )
})}
```

学校名エリア（`w-44 shrink-0 pr-3 text-right` のdiv）に重複アイコンを追加:

```tsx
<div className="w-44 shrink-0 pr-3 text-right">
  <div className="flex items-center justify-end gap-1">
    {isConflicted && (
      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
    )}
    <p className="text-sm font-semibold text-text-main leading-tight truncate">
      {b.university_name}
    </p>
  </div>
  <p className="text-[10px] text-text-sub truncate">{b.department}</p>
</div>
```

ファイル先頭のimportに `AlertTriangle` を追加:

```ts
import { differenceInCalendarDays, parseISO, format, addDays } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { Bookmark, EVENT_CONFIG } from './types'
```

- [ ] **Step 2: 型チェック**

```bash
pnpm tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add components/calendar/GanttView.tsx
git commit -m "feat: GanttViewに重複試験日ハイライト追加"
```

---

## Task 8: 学校削除機能

**Files:**
- Modify: `components/calendar/SchoolSidebar.tsx`

- [ ] **Step 1: SchoolSidebarに削除ボタンを追加（ファイル全体を置き換え）**

```tsx
// components/calendar/SchoolSidebar.tsx
import { Trash2 } from 'lucide-react'
import { Bookmark } from './types'

interface SchoolSidebarProps {
  bookmarks: Bookmark[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onDelete: (id: string) => void
}

const STATUS_LABEL: Record<Bookmark['status'], string> = {
  planning: '検討中',
  applied: '出願済',
  examined: '受験済',
  passed: '合格',
  failed: '不合格',
}

export function SchoolSidebar({ bookmarks, selectedId, onSelect, onDelete }: SchoolSidebarProps) {
  return (
    <aside className="w-full lg:w-60 shrink-0 bg-bg-card border border-border-custom rounded-2xl overflow-hidden self-start lg:sticky lg:top-6">
      <div className="p-4 border-b border-border-custom">
        <h2 className="text-text-main font-bold text-sm">大学名称</h2>
      </div>

      {/* 全て表示ボタン */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-border-custom ${
          selectedId === null
            ? 'bg-primary/5 text-primary border-l-2 border-l-primary'
            : 'text-text-sub hover:bg-bg-hover border-l-2 border-l-transparent'
        }`}
      >
        すべて表示
      </button>

      {bookmarks.map((b) => {
        const isSelected = selectedId === b.id
        const typeColor =
          b.type === '国立' || b.type === '公立'
            ? 'bg-badge-public text-badge-public-text'
            : 'bg-badge-private text-badge-private-text'

        return (
          <div
            key={b.id}
            className={`group relative border-b border-border-custom last:border-b-0 ${
              isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-bg-hover border-l-2 border-l-transparent'
            }`}
          >
            <button
              onClick={() => onSelect(isSelected ? null : b.id)}
              className="w-full text-left px-4 py-3 pr-10 transition-colors"
            >
              <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-primary' : 'text-text-main'}`}>
                {b.university_name}
              </p>
              <p className="text-text-sub text-xs mt-0.5 truncate">{b.department}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeColor}`}>
                  {b.type}
                </span>
                <span className="text-[10px] text-text-muted">{STATUS_LABEL[b.status]}</span>
              </div>
            </button>

            {/* 削除ボタン（ホバーで表示） */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(b.id)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
              title="削除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </aside>
  )
}
```

- [ ] **Step 2: 型チェック**

```bash
pnpm tsc --noEmit
```

Expected: エラーなし（`onDelete` プロパティはTask 6のpage.tsxで渡している）

- [ ] **Step 3: 動作確認**

1. カレンダーページでユーザーデータがある状態でサイドバーの学校にホバー
2. ゴミ箱アイコンが表示されることを確認
3. クリックで学校が一覧から消えることを確認

- [ ] **Step 4: コミット**

```bash
git add components/calendar/SchoolSidebar.tsx
git commit -m "feat: サイドバーに学校削除ボタン追加"
```

---

## Task 9: 学校追加モーダル

**Files:**
- Create: `components/calendar/AddScheduleModal.tsx`

- [ ] **Step 1: AddScheduleModalを作成**

```tsx
// components/calendar/AddScheduleModal.tsx
'use client'

import { useState } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@/lib/supabase/browser'

interface AddScheduleModalProps {
  onClose: () => void
  onAdded: () => void
}

type Tab = 'search' | 'manual'

interface UniversityResult {
  id: string
  name_ja: string
  name_zh: string
  type: string
  departments: string[]
}

interface ScheduleResult {
  id: string
  department: string
  application_start: string | null
  application_end: string | null
  exam_date: string | null
  interview_date: string | null
  result_date: string | null
}

export function AddScheduleModal({ onClose, onAdded }: AddScheduleModalProps) {
  const [tab, setTab] = useState<Tab>('search')

  // 検索タブ用のstate
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UniversityResult[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityResult | null>(null)
  const [schedules, setSchedules] = useState<ScheduleResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)

  // 手動入力タブ用のstate
  const [manual, setManual] = useState({
    university_name: '',
    university_name_zh: '',
    university_type: '私立',
    department: '',
    application_start: '',
    application_end: '',
    exam_date: '',
    interview_date: '',
    result_date: '',
  })

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 1) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from('universities')
      .select('id, name_ja, name_zh, type, departments')
      .or(`name_ja.ilike.%${query}%,name_zh.ilike.%${query}%`)
      .limit(8)
    setSearchResults(
      (data ?? []).map((u) => ({
        ...u,
        departments: Array.isArray(u.departments) ? u.departments : [],
      }))
    )
    setSearching(false)
  }

  const handleSelectUniversity = async (uni: UniversityResult) => {
    setSelectedUniversity(uni)
    setSearchResults([])
    setSearchQuery(uni.name_ja)
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from('university_schedules')
      .select('id, department, application_start, application_end, exam_date, interview_date, result_date')
      .eq('university_id', uni.id)
    setSchedules(data ?? [])
  }

  const handleAddFromSearch = async (schedule: ScheduleResult) => {
    if (!selectedUniversity) return
    setAdding(true)
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_schedules').insert({
      user_id: user.id,
      university_schedule_id: schedule.id,
      university_name: selectedUniversity.name_ja,
      university_name_zh: selectedUniversity.name_zh,
      university_type: selectedUniversity.type,
      department: schedule.department,
      application_start: schedule.application_start,
      application_end: schedule.application_end,
      exam_date: schedule.exam_date,
      interview_date: schedule.interview_date,
      result_date: schedule.result_date,
    })
    setAdding(false)
    onAdded()
  }

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manual.university_name) return
    setAdding(true)
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_schedules').insert({
      user_id: user.id,
      university_name: manual.university_name,
      university_name_zh: manual.university_name_zh || null,
      university_type: manual.university_type,
      department: manual.department || null,
      application_start: manual.application_start || null,
      application_end: manual.application_end || null,
      exam_date: manual.exam_date || null,
      interview_date: manual.interview_date || null,
      result_date: manual.result_date || null,
    })
    setAdding(false)
    onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* モーダル本体 */}
      <div className="relative bg-bg-card border border-border-custom rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-border-custom">
          <h2 className="text-xl font-serif text-text-main">学校を追加</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:bg-primary/5 hover:text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ切替 */}
        <div className="flex border-b border-border-custom">
          <button
            onClick={() => setTab('search')}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              tab === 'search'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-sub hover:text-text-main'
            }`}
          >
            データベースから検索
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              tab === 'manual'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-sub hover:text-text-main'
            }`}
          >
            手動で入力
          </button>
        </div>

        <div className="p-6">
          {/* 検索タブ */}
          {tab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="大学名を入力..."
                  className="pl-10 border-primary/15 rounded-xl h-11"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
                )}
              </div>

              {/* 検索候補 */}
              {searchResults.length > 0 && (
                <div className="border border-border-custom rounded-xl overflow-hidden">
                  {searchResults.map((uni) => (
                    <button
                      key={uni.id}
                      onClick={() => handleSelectUniversity(uni)}
                      className="w-full text-left px-4 py-3 hover:bg-bg-hover transition-colors border-b border-border-custom last:border-b-0"
                    >
                      <p className="text-sm font-semibold text-text-main">{uni.name_ja}</p>
                      <p className="text-xs text-text-sub">{uni.name_zh} · {uni.type}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* 選択された大学の日程一覧 */}
              {selectedUniversity && schedules.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-text-main">
                    {selectedUniversity.name_ja} の日程
                  </p>
                  {schedules.map((s) => (
                    <div
                      key={s.id}
                      className="bg-primary/5 border border-primary/10 rounded-xl p-3 space-y-1"
                    >
                      <p className="text-sm font-bold text-text-main">{s.department}</p>
                      {s.exam_date && (
                        <p className="text-xs text-text-sub">試験日: {s.exam_date}</p>
                      )}
                      {s.application_end && (
                        <p className="text-xs text-text-sub">出願締切: {s.application_end}</p>
                      )}
                      <Button
                        onClick={() => handleAddFromSearch(s)}
                        disabled={adding}
                        className="mt-2 w-full bg-primary text-white rounded-xl h-9 text-sm font-bold hover:opacity-90"
                      >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : '追加する'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedUniversity && schedules.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">
                  この大学の日程データはまだ登録されていません。<br />
                  「手動で入力」タブから追加してください。
                </p>
              )}
            </div>
          )}

          {/* 手動入力タブ */}
          {tab === 'manual' && (
            <form onSubmit={handleAddManual} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">
                  学校名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="例：東京大学"
                  className="border-primary/15 rounded-xl h-11"
                  value={manual.university_name}
                  onChange={(e) => setManual({ ...manual, university_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">学校名（中国語）</Label>
                <Input
                  placeholder="例：东京大学"
                  className="border-primary/15 rounded-xl h-11"
                  value={manual.university_name_zh}
                  onChange={(e) => setManual({ ...manual, university_name_zh: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">種別</Label>
                <div className="flex gap-2">
                  {(['国立', '公立', '私立'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setManual({ ...manual, university_type: t })}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                        manual.university_type === t
                          ? 'bg-primary text-white'
                          : 'bg-primary/5 text-primary hover:bg-primary/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">研究科</Label>
                <Input
                  placeholder="例：工学系研究科"
                  className="border-primary/15 rounded-xl h-11"
                  value={manual.department}
                  onChange={(e) => setManual({ ...manual, department: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">出願開始日</Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.application_start}
                    onChange={(e) => setManual({ ...manual, application_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">出願締切日</Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.application_end}
                    onChange={(e) => setManual({ ...manual, application_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">試験日</Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.exam_date}
                    onChange={(e) => setManual({ ...manual, exam_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-main font-bold text-sm">面接日</Label>
                  <Input
                    type="date"
                    className="border-primary/15 rounded-xl h-11"
                    value={manual.interview_date}
                    onChange={(e) => setManual({ ...manual, interview_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-text-main font-bold text-sm">合格発表日</Label>
                <Input
                  type="date"
                  className="border-primary/15 rounded-xl h-11"
                  value={manual.result_date}
                  onChange={(e) => setManual({ ...manual, result_date: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                disabled={adding || !manual.university_name}
                className="w-full bg-primary text-white rounded-xl h-12 font-bold hover:opacity-90 shadow-md mt-2"
              >
                {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : '追加する'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 型チェック**

```bash
pnpm tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: ESLintチェック**

```bash
pnpm lint
```

Expected: エラーなし（警告は許容）

- [ ] **Step 4: 動作確認**

1. ログイン状態でカレンダーページを開く
2. 「学校を追加」ボタンをクリック → モーダルが表示されることを確認
3. **検索タブ**: 「東京」と入力 → 大学候補が表示 → 選択 → 研究科一覧が表示 → 「追加する」
4. Supabaseダッシュボード → Table Editor → `user_schedules` にレコードが追加されていることを確認
5. カレンダーページに追加した学校が表示されることを確認
6. **手動入力タブ**: 学校名・日程を入力 → 「追加する」 → リストに反映されることを確認
7. サイドバーの学校にホバー → ゴミ箱アイコンをクリック → 削除されることを確認
8. 試験日が重複する2校を追加 → ConflictBannerが表示され、GanttViewの該当ドットに赤リングが表示されることを確認

- [ ] **Step 5: コミット**

```bash
git add components/calendar/AddScheduleModal.tsx
git commit -m "feat: 学校追加モーダル（DBから検索・手動入力）を追加"
```

---

## Task 10: カレンダーページ — 実データ化・認証ガード・モーダル統合

**Files:**
- Modify: `app/calendar/page.tsx`

> **前提:** Task 8（SchoolSidebar onDelete）とTask 9（AddScheduleModal）が完了していること。

- [ ] **Step 1: カレンダーページをファイル全体で置き換え**

```tsx
// app/calendar/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarIcon, LayoutList, GanttChartSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SchoolSidebar } from '@/components/calendar/SchoolSidebar'
import { TimelineView } from '@/components/calendar/TimelineView'
import { GanttView } from '@/components/calendar/GanttView'
import { ConflictBanner } from '@/components/calendar/ConflictBanner'
import { AddScheduleModal } from '@/components/calendar/AddScheduleModal'
import { toBookmark } from '@/components/calendar/types'
import type { Bookmark, ViewType, UserScheduleRow } from '@/components/calendar/types'
import { createBrowserClient } from '@/lib/supabase/browser'

export default function CalendarPage() {
  const router = useRouter()
  const [activeView, setActiveView] = useState<ViewType>('timeline')
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchBookmarks = async () => {
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data } = await supabase
      .from('user_schedules')
      .select('*')
      .order('created_at', { ascending: false })

    setBookmarks((data as UserScheduleRow[] ?? []).map(toBookmark))
    setLoading(false)
  }

  useEffect(() => {
    fetchBookmarks()
  }, [])

  const handleDelete = async (id: string) => {
    const supabase = createBrowserClient()
    await supabase.from('user_schedules').delete().eq('id', id)
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
    if (selectedSchoolId === id) setSelectedSchoolId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <p className="text-text-sub">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-main py-10 px-6">
      <div className="max-w-6xl mx-auto">

        {/* ヘッダー */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary rounded-full px-4 py-2 text-sm font-bold mb-4">
              <CalendarIcon className="w-4 h-4" />
              <span>マイカレンダー</span>
            </div>
            <h1 className="text-4xl font-serif text-text-main">受験スケジュール</h1>
            <p className="text-text-sub mt-2">志望校の日程を確認し、重複をチェックしましょう。</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-bg-card border border-border-custom rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveView('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'timeline'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-sub hover:text-text-main'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                一覧
              </button>
              <button
                onClick={() => setActiveView('gantt')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'gantt'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-sub hover:text-text-main'
                }`}
              >
                <GanttChartSquare className="w-4 h-4" />
                年表
              </button>
            </div>

            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white rounded-xl font-bold px-5 h-10 shadow-md hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              学校を追加
            </Button>
          </div>
        </header>

        {/* 重複警告バナー */}
        <ConflictBanner bookmarks={bookmarks} />

        {/* メインコンテンツ */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-32 bg-bg-card rounded-3xl border border-dashed border-border-custom">
            <CalendarIcon className="w-16 h-16 text-text-muted mx-auto mb-6" />
            <h3 className="text-xl font-serif text-text-main">カレンダーは空です</h3>
            <p className="text-text-sub mt-2 mb-8">志望校を追加してスケジュールを管理しましょう。</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white rounded-xl font-bold px-8 h-12 shadow-lg"
            >
              学校を追加する
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <SchoolSidebar
              bookmarks={bookmarks}
              selectedId={selectedSchoolId}
              onSelect={setSelectedSchoolId}
              onDelete={handleDelete}
            />
            <div className="flex-1 bg-bg-card border border-border-custom rounded-2xl p-6 min-h-[600px] flex flex-col">
              {activeView === 'timeline' ? (
                <TimelineView bookmarks={bookmarks} selectedId={selectedSchoolId} />
              ) : (
                <GanttView bookmarks={bookmarks} selectedId={selectedSchoolId} />
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddScheduleModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false)
            fetchBookmarks()
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: 型チェック**

```bash
pnpm tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: ESLintチェック**

```bash
pnpm lint
```

Expected: エラーなし

- [ ] **Step 4: 動作確認**

1. ログイン状態でカレンダーページを開く → 実データが表示されることを確認
2. 未ログインでカレンダーページにアクセス → `/auth/login` にリダイレクトされることを確認
3. 「学校を追加」ボタンをクリック → モーダルが表示されることを確認
4. 検索タブ・手動入力タブが切り替えられることを確認
5. 学校を追加後にリストに反映されることを確認
6. 削除ボタンで学校が消えることを確認

- [ ] **Step 5: コミット**

```bash
git add app/calendar/page.tsx
git commit -m "feat: カレンダーページを実データ化・認証ガード・追加モーダル統合"
```

---

## 最終確認

- [ ] **全体の型チェック**

```bash
pnpm tsc --noEmit
```

Expected: エラーなし

- [ ] **ESLint**

```bash
pnpm lint
```

Expected: エラーなし

- [ ] **最終動作確認チェックリスト**

- [ ] Navbarに「マイカレンダー」と表示されている
- [ ] ビュー切替ボタンが「一覧」「年表」と表示されている
- [ ] ログイン/ログアウトがNavbarで正しく切り替わる
- [ ] 未ログインでカレンダーページにアクセスするとログインページに遷移する
- [ ] ログイン後にカレンダーページでユーザーのデータが表示される
- [ ] 学校を追加（DB検索）できる
- [ ] 学校を追加（手動入力）できる
- [ ] 学校を削除できる
- [ ] 試験日が重複するとConflictBannerと年表ハイライトが表示される
