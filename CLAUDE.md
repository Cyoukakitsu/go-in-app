# 院GO — プロジェクト開発ガイド

## プロジェクト概要

GO院（いんご）は、日本の大学院を目指す中国人留学生向けの志望校管理ツールです。

### 解決する課題

- 大学院の出願日・試験日の情報が各大学のサイトに散らばっていて、一元管理できない
- 複数校を受験する際、日程の重複に気づきにくい
- 考学（受験）の流れ自体がわからない留学生が多い

### ターゲットユーザー

- 在日中国人留学生（語学学校・塾に通っている学生）
- 大学院（修士/博士）を受験予定の学生
- 日本語がまだ不十分で、情報収集に苦労している学生

---

## 技術スタック（厳守）

| レイヤー             | 技術                    | 備考                                 |
| -------------------- | ----------------------- | ------------------------------------ |
| フレームワーク       | Next.js 16 (App Router) | Pages Routerは使わない               |
| 言語                 | TypeScript              | strict mode                          |
| UIライブラリ         | shadcn/ui               | コンポーネントは個別にインストール   |
| スタイリング         | Tailwind CSS            | カスタムカラーパレットを使用（後述） |
| データベース         | Supabase (PostgreSQL)   | Auth + DB + RLS                      |
| パッケージマネージャ | pnpm                    | npm/yarnは使わない                   |
| デプロイ             | Vercel                  | Hobby Plan（無料）                   |
| Linter/Formatter     | ESLint + Prettier       |                                      |

---

## アーキテクチャ

```
クライアント（ブラウザ）
        ↓
┌────────────────────────────┐
│   Next.js 16（Vercel）      │
│                            │
│  Server       Client       │
│  Components   Components   │
│  学校一覧     カレンダー     │
│  検索         操作UI        │
└────────────┬───────────────┘
             ↓
┌────────────────────────────┐
│        Supabase            │
│   認証 + PostgreSQL + RLS   │
└────────────────────────────┘
```

### アーキテクチャルール

- データ取得が中心のページは **Server Components** を使用する
- インタラクティブな操作が必要な部分のみ **Client Components**（`"use client"`）を使用する
- **API Routeは使わない**。データ取得はServer ComponentからSupabaseに直接クエリする
- ユーザーのカレンダーデータはSupabaseの **RLS（Row Level Security）** で保護する
- Server ActionsはClient Componentからのデータ更新に使用する

---

## ユーザーフロー

```
ランディングページ
       ↓
Dashboard（学校一覧）        ← ログイン不要で閲覧可能
 検索 + カテゴリ（国公立/私立）
       ↓
学校カード
 学校情報・出願日・試験日
       ↓
「カレンダーに追加」をクリック
       ↓
ログイン / 新規登録           ← 未ログインの場合のみ表示
       ↓
志望校をマイカレンダーに保存
       ↓
マイカレンダー
 日程一覧 + 重複検出
```

### 重要なUXポイント

- **ログインなしで閲覧可能**: Dashboardは誰でもアクセスできる。登録のハードルを下げて離脱を防ぐ
- **必要なタイミングでログイン**: 「カレンダーに追加」をクリックした時に初めてログインを要求する
- **カテゴリフィルタ**: 「すべて」「国公立」「私立」の3つ。地域フィルタはなし

---

## ページ構成

| ルート         | 内容                               | レンダリング     |
| -------------- | ---------------------------------- | ---------------- |
| `/`            | ランディングページ                 | Server Component |
| `/dashboard`   | 学校一覧 + 検索 + カテゴリフィルタ | Server Component |
| `/calendar`    | マイカレンダー（要ログイン）       | Client Component |
| `/auth/login`  | ログイン                           | Client Component |
| `/auth/signup` | 新規登録                           | Client Component |

---

## データベース設計（Supabase）

### universities テーブル（学校マスタデータ）

| カラム      | 型          | 説明                     |
| ----------- | ----------- | ------------------------ |
| id          | uuid        | PK                       |
| name_ja     | text        | 学校名（日本語）         |
| name_zh     | text        | 学校名（中国語）         |
| type        | text        | "国立" / "公立" / "私立" |
| departments | jsonb       | 研究科リスト             |
| created_at  | timestamptz | 作成日時                 |

### university_schedules テーブル（入試日程データ）

| カラム            | 型     | 説明                      |
| ----------------- | ------ | ------------------------- |
| id                | uuid   | PK                        |
| university_id     | uuid   | FK → universities         |
| department        | text   | 研究科名                  |
| application_start | date   | 出願開始日                |
| application_end   | date   | 出願締切日                |
| exam_date         | date   | 試験日                    |
| result_date       | date   | 合格発表日                |
| year              | int    | 入試年度                  |
| tags              | text[] | タグ（例: "経済", "MBA"） |

### user_bookmarks テーブル（ユーザーの志望校）

| カラム      | 型          | 説明                                                      |
| ----------- | ----------- | --------------------------------------------------------- |
| id          | uuid        | PK                                                        |
| user_id     | uuid        | FK → auth.users（RLS対象）                                |
| schedule_id | uuid        | FK → university_schedules                                 |
| status      | text        | "planning" / "applied" / "examined" / "passed" / "failed" |
| notes       | text        | メモ                                                      |
| created_at  | timestamptz | 作成日時                                                  |

### RLSポリシー

```sql
-- user_bookmarksはログインユーザーが自分のデータのみアクセス可能
CREATE POLICY "Users can view own bookmarks"
  ON user_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON user_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON user_bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON user_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- universities, university_schedulesは誰でも閲覧可能
CREATE POLICY "Anyone can view universities"
  ON universities FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view schedules"
  ON university_schedules FOR SELECT
  USING (true);
```

---

## UIデザインガイドライン

### カラーパレット（温暖・柔和なテーマ）

温かみのあるterracotta/creamカラーパレットを使用する。**ダーク/ブラック系のテーマは使わない。**

```css
/* Tailwind CSS カスタムカラー設定 */
:root {
  --color-primary: #6f4e37; /* 深いコーヒーブラウン — メインカラー */
  --color-accent: #c4956a; /* キャラメル — アクセント */
  --color-accent-light: #d4a574; /* ライトキャラメル — サブアクセント */
  --color-accent-pale: #e8c9a0; /* ペールキャラメル — グラデーション用 */
  --color-bg-main: #fff8f0; /* クリームホワイト — 背景メイン */
  --color-bg-card: #fffcf8; /* ウォームホワイト — カード背景 */
  --color-bg-hover: #fffaf5; /* ホバー背景 */
  --color-text-main: #3d2b1f; /* ダークブラウン — テキストメイン */
  --color-text-sub: #8b7355; /* ミディアムブラウン — テキストサブ */
  --color-text-muted: #a89279; /* ライトブラウン — テキスト薄め */
  --color-border: rgba(111, 78, 55, 0.12); /* ボーダー */
  --color-border-hover: #d4a574; /* ホバー時ボーダー */
  --color-badge-public: rgba(86, 130, 115, 0.12); /* 国公立バッジ背景 */
  --color-badge-public-text: #3d6b5a; /* 国公立バッジテキスト */
  --color-badge-private: rgba(160, 110, 90, 0.12); /* 私立バッジ背景 */
  --color-badge-private-text: #8b5e3c; /* 私立バッジテキスト */
}
```

### デザイン原則

- **角丸**: カード = `rounded-2xl`（16px）、ボタン・バッジ = `rounded-xl`（12px）または `rounded-full`
- **シャドウ**: 控えめに。ホバー時のみ `shadow-lg`、通常時は `shadow-sm` または影なし
- **ホバーエフェクト**: カードにホバーすると `-translate-y-0.5` + 上部にグラデーションアクセントライン表示
- **フォント**: 見出し = セリフ体（Playfair Display）、本文 = サンセリフ（DM Sans + Noto Sans JP）
- **余白**: たっぷり取る。詰め込まない。呼吸感のあるレイアウト
- **バッジ・ピル**: 薄い背景色 + 濃い文字色。ボーダーは使わない

### shadcn/uiコンポーネントのカスタマイズ

shadcn/uiのコンポーネントを使用する際は、上記カラーパレットに合わせてテーマをカスタマイズすること。デフォルトのグレー系ではなく、ブラウン系の配色に統一する。

### コンポーネントスタイル例

```tsx
// カード
<div className="bg-bg-card border border-border-custom rounded-2xl p-5
                hover:bg-bg-hover hover:border-[#D4A574] hover:-translate-y-0.5
                hover:shadow-lg transition-all duration-300">

// プライマリボタン
<Button className="bg-[#6F4E37] text-bg-main rounded-xl px-5 py-2 font-medium
                   hover:opacity-90 transition-all">

// アウトラインボタン
<Button variant="outline" className="border-[1.5px] border-[#6F4E37] text-[#6F4E37] rounded-xl hover:bg-[#6F4E37] hover:text-bg-main transition-all">

// 検索インプット
<Input className="pl-11 pr-5 py-3.5 border-[1.5px] border-[rgba(111,78,55,0.15)] rounded-xl
                  bg-bg-card text-text-main focus:border-accent-custom
                  focus:ring-2 focus:ring-[rgba(196,149,106,0.15)]" />

// カテゴリピル（アクティブ）
<span className="bg-[#6F4E37] text-bg-main  rounded-full px-4 py-1.5 text-sm font-medium">

// カテゴリピル（非アクティブ）
<span className="bg-[rgba(111,78,55,0.06)] text-[#6F4E37] rounded-full px-4 py-1.5 text-sm font-medium">

// タグ
<span className="bg-[rgba(111,78,55,0.06)] text-[#6F4E37] rounded-xl px-2.5 py-0.5 text-xs font-medium">
```

---

## 学校データについて

- 学校名のマスタデータ（日本語名 + 中国語名 + 研究科）はJSONファイルまたはSupabaseのseedデータとして事前に用意する
- 入試日程データは **jpss.jp からの月次バッチスクレイピング** で自動更新する（手動入力は廃止）
- 初期データはTOP 50の人気校をカバーすればOK
- 学校検索はオートコンプリート対応（ユーザーが1文字入力するとマッチする候補を表示）

### スクレイピング仕様（jpss.jp）

- **対象サイト**: https://www.jpss.jp/ja/grad/{university_id}/{course_id}/
- **URL発見**: sitemap2.xml から `/ja/grad/` 系URLを全抽出
- **パース方法**: Cheerio（SSRページのため Puppeteer 不要）
- **取得フィールド**: `<dt>/<dd>` タグの出願期間開始日・終了日・試験日・合格発表日
- **実行タイミング**: Vercel Cron Job（月1回）
- **robots.txt**: `Allow: /`（全クロール許可済み）
- **追加パッケージ**: `cheerio` のみ

---

## コーディングルール

- コンポーネントは機能ごとにファイルを分ける
- コメントは日本語または中国語で書く
- 変数名・関数名・コンポーネント名は英語で書く
- `any`型は使わない。型を明示的に定義する
- エラーハンドリングは必ず行う
- レスポンシブ対応は必須（モバイルファースト）
- `console.log`は本番コードに残さない

---

## 開発の進め方

### Phase 1（Week 1）: 基盤構築

- Next.js 15プロジェクト初期化（pnpm）
- shadcn/ui + Tailwindセットアップ + カスタムカラー設定
- Supabase接続 + テーブル作成 + RLS設定
- 学校マスタデータのseed作成

### Phase 2（Week 2）: Dashboard

- 学校一覧ページ（Server Component）
- 検索機能（オートコンプリート）
- カテゴリフィルタ（すべて/国公立/私立）
- 学校カードコンポーネント

### Phase 3（Week 3）: 認証 + カレンダー

- Supabase Auth（ログイン/新規登録）
- 「カレンダーに追加」機能（未ログイン時にログイン画面へリダイレクト）
- マイカレンダーページ
- 日程重複検出機能

### Phase 4（Week 4）: 仕上げ + 公開

- UIの磨き込み + レスポンシブ対応
- Vercelにデプロイ
- ランディングページ作成
- 小紅書での宣伝コンテンツ準備

### Phase 5: スクレイピング自動化

- `pnpm add cheerio` でパッケージ追加
- `/api/scrape` API Route 実装（sitemap取得 → Cheerioパース → Supabase upsert）
- Vercel Cron Job 設定（月1回、`vercel.json`）
- バッチ分割対応（Hobby Planの60秒タイムアウト対策）
- ダッシュボードに「データ最終更新日」表示
