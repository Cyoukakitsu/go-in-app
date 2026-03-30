# 院GO（いんご）

日本の大学院を目指す中国人留学生向けの志望校管理ツールです。

## プロジェクト概要

院GOは、大学院受験に関する以下の課題を解決します：

- 各大学のサイトに散らばっている出願日・試験日を一元管理
- 複数校受験時の日程重複を可視化
- 考学（受験）の流れが分からない留学生をサポート

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| UIライブラリ | shadcn/ui |
| スタイリング | Tailwind CSS |
| データベース | Supabase (PostgreSQL + Auth + RLS) |
| パッケージマネージャ | pnpm |
| デプロイ | Vercel |

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- pnpm

### インストール

```bash
pnpm install
```

### 環境変数の設定

`.env.local` ファイルをプロジェクトルートに作成し、以下を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## ページ構成

| ルート | 内容 |
|-------|------|
| `/` | ランディングページ |
| `/dashboard` | 学校一覧・検索・カテゴリフィルタ |
| `/calendar` | マイカレンダー（要ログイン） |
| `/auth/login` | ログイン |
| `/auth/signup` | 新規登録 |

## 主な機能

- **学校検索**: 日本語・中国語でのオートコンプリート検索
- **カテゴリフィルタ**: 国立・公立・私立で絞り込み
- **マイカレンダー**: 志望校の日程を一覧管理
- **重複検出**: 試験日・出願期間の重複を自動検出
- **認証**: Supabase Authによるメール認証

## デプロイ

[Vercel](https://vercel.com) へのデプロイを推奨します。環境変数をVercelのダッシュボードで設定してください。
