# Feature-Driven Architecture リファクタリング設計

**日付:** 2026-04-10  
**対象プロジェクト:** GO院（school-search-app）

---

## Context

現在のプロジェクトは `components/` 配下に機能別フォルダ（`auth/`, `calendar/`）と型別ルート（`ui/`）が混在し、`SchoolCard`・`SearchFilters`・`Navbar` などは根目錄に散在している。`lib/` の hooks・utils も機能との対応が不明瞭。

Feature-Driven Architecture（宽松 FDA）に移行することで、各機能が自己完結した単位となり、可読性・保守性・拡張性が向上する。

---

## 目標

- 機能ごとにコードを `features/` に集約する
- 共有リソースを `shared/` に統一する
- `app/` はルーティング層に留め、ビジネスロジックは持たない
- 既存の動作を一切変えない（import パスの付け替えのみ）

---

## 新ディレクトリ構成

```
school-search-app/
├── app/                          # Next.js ルーティング層（変更なし）
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── calendar/page.tsx
│   ├── dashboard/page.tsx
│   ├── layout.tsx                # shared/ からのインポートに更新
│   ├── page.tsx
│   └── globals.css
│
├── features/                     # 機能モジュール
│   ├── auth/
│   │   └── components/
│   │       └── AuthForm.tsx      # 移動元: components/auth/AuthForm.tsx
│   ├── dashboard/
│   │   └── components/
│   │       ├── SchoolCard.tsx    # 移動元: components/SchoolCard.tsx
│   │       └── SearchFilters.tsx # 移動元: components/SearchFilters.tsx
│   └── calendar/
│       ├── components/
│       │   ├── AddScheduleModal.tsx
│       │   ├── ConflictBanner.tsx
│       │   ├── EventNode.tsx
│       │   ├── GanttView.tsx
│       │   ├── SchoolSidebar.tsx
│       │   └── TimelineView.tsx  # 移動元: components/calendar/
│       ├── types.ts              # 移動元: components/calendar/types.ts
│       ├── utils.ts              # 移動元: components/calendar/utils.ts
│       └── mockData.ts           # 移動元: components/calendar/mockData.ts
│
├── shared/                       # 共有・クロス機能リソース
│   ├── components/
│   │   ├── Navbar.tsx            # 移動元: components/Navbar.tsx
│   │   ├── providers.tsx         # 移動元: components/providers.tsx
│   │   └── theme-provider.tsx    # 移動元: components/theme-provider.tsx
│   ├── ui/                       # shadcn/ui コンポーネント
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── skeleton.tsx
│   │   └── tabs.tsx              # 移動元: components/ui/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── browser.ts        # 移動元: lib/supabase/browser.ts
│   │   │   └── server.ts         # 移動元: lib/supabase/server.ts
│   │   ├── supabase.ts           # 移動元: lib/supabase.ts
│   │   └── utils.ts              # 移動元: lib/utils.ts
│   └── hooks/
│       └── use-debounce.ts       # 移動元: lib/hooks/use-debounce.ts
│
├── supabase/migrations/          # 変更なし
└── public/                       # 変更なし
```

---

## Import パスの変更

`tsconfig.json` の `@/*` エイリアスは root 指向のまま維持（変更不要）。

| 変更前 | 変更後 |
|--------|--------|
| `@/components/auth/AuthForm` | `@/features/auth/components/AuthForm` |
| `@/components/SchoolCard` | `@/features/dashboard/components/SchoolCard` |
| `@/components/SearchFilters` | `@/features/dashboard/components/SearchFilters` |
| `@/components/calendar/*` | `@/features/calendar/components/*` |
| `@/components/calendar/types` | `@/features/calendar/types` |
| `@/components/calendar/utils` | `@/features/calendar/utils` |
| `@/components/Navbar` | `@/shared/components/Navbar` |
| `@/components/providers` | `@/shared/components/providers` |
| `@/components/theme-provider` | `@/shared/components/theme-provider` |
| `@/components/ui/*` | `@/shared/ui/*` |
| `@/lib/utils` | `@/shared/lib/utils` |
| `@/lib/supabase` | `@/shared/lib/supabase` |
| `@/lib/supabase/browser` | `@/shared/lib/supabase/browser` |
| `@/lib/supabase/server` | `@/shared/lib/supabase/server` |
| `@/lib/hooks/use-debounce` | `@/shared/hooks/use-debounce` |

---

## 設定ファイルの更新

### `components.json`（shadcn/ui 設定）

```json
{
  "aliases": {
    "components": "@/shared/components",
    "utils": "@/shared/lib/utils",
    "ui": "@/shared/ui",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  }
}
```

---

## 変更しないもの

- `app/` 配下の全ページファイルの**内容**（import パスのみ更新）
- `supabase/migrations/`
- `public/`
- `tsconfig.json`（`@/*` エイリアスはそのまま）
- `next.config.ts`、`tailwind.config.ts` 等の設定ファイル

---

## 検証方法

1. `pnpm build` がエラーなく完了すること
2. `pnpm dev` でアプリが起動し、以下のルートが動作すること
   - `/dashboard` — 学校一覧・検索・フィルタ
   - `/calendar` — タイムライン・ガントチャート表示
   - `/auth/login`、`/auth/signup` — 認証フォーム
3. shadcn/ui の新規コンポーネント追加（`pnpm dlx shadcn@latest add dialog` など）が `shared/ui/` に正しく配置されること
