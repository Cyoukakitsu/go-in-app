# GO院 — カレンダー・認証・UI改善 設計仕様書

**作成日:** 2026-03-31
**スコープ:** Auth接続 / user_schedulesテーブル / カレンダーUI5点改善

---

## 1. 概要

現在モックデータで動いているカレンダーページをSupabase実データに切り替え、Auth接続を完成させる。あわせてカレンダーUIの5つの問題点を修正する。

AI（URL/PDF読み込み）機能は今回のスコープ外。後フェーズで追加する。

---

## 2. データベース変更

### 2-1. user_bookmarks → user_schedules に置き換え

既存の `user_bookmarks`（schedule_idのみ保持）では手動入力に対応できないため、`user_schedules` テーブルに移行する。

```sql
CREATE TABLE user_schedules (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  -- 既存DBから追加した場合（任意）
  university_schedule_id  uuid REFERENCES university_schedules ON DELETE SET NULL,
  -- 表示用フィールド（既存連携時はコピー、手動入力時は直接入力）
  university_name         text NOT NULL,
  department              text,
  application_start       date,
  application_end         date,
  exam_date               date,
  interview_date          date,
  result_date             date,
  -- ステータス管理
  status                  text DEFAULT 'planning'
    CHECK (status IN ('planning','applied','examined','passed','failed')),
  notes                   text,
  created_at              timestamptz DEFAULT now()
);
```

**データ種別の判定:**
- `university_schedule_id IS NOT NULL` → 既存DBから追加
- `university_schedule_id IS NULL` → 手動入力

### 2-2. RLSポリシー

```sql
ALTER TABLE user_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のスケジュールのみ操作可能"
  ON user_schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 3. Auth接続

### 3-1. AuthForm（login / signup）

`components/auth/AuthForm.tsx` の `handleSubmit` を実装する。

- **ログイン:** `supabase.auth.signInWithPassword({ email, password })`
- **新規登録:** `supabase.auth.signUp({ email, password })`
- エラー時はフォーム内にエラーメッセージを表示（日本語）
- 成功時は `/calendar` にリダイレクト

### 3-2. Navbar のAuth状態反映

`components/Navbar.tsx` にAuth状態を追加する。

- **未ログイン:** 「ログイン」リンクを表示（現状通り）
- **ログイン済み:** ユーザーアイコン（アバター）＋「ログアウト」ボタンを表示
- `supabase.auth.getUser()` でクライアント側のセッションを取得
- ログアウトは `supabase.auth.signOut()` → `/dashboard` へリダイレクト

### 3-3. カレンダーページのAuth保護

`app/calendar/page.tsx` でセッションチェックを行う。

- 未ログイン → `/auth/login?redirect=/calendar` にリダイレクト
- ログイン済み → Supabaseから `user_schedules` を取得して表示

---

## 4. UI改善（5点）

### 4-1. Navbar ラベル変更

`components/Navbar.tsx`:
- 「カレンダー」→「マイカレンダー」

### 4-2. ビュー切替ボタンを日本語化

`app/calendar/page.tsx`:
- "Timeline" → 「一覧」
- "Gantt" → 「年表」

### 4-3. 重複試験日のビジュアルハイライト

現状はバナーで通知するのみ。該当イベントを視覚的にマークする。

**実装方針:**
- `ConflictBanner` が検出している重複ロジックを共通ユーティリティ（`utils.ts`）に切り出す
- `TimelineView` と `GanttView` で、`exam_date` が重複しているエントリに対して:
  - 赤系のボーダー（`border-red-400`）
  - ⚠️アイコン（`AlertTriangle` from lucide-react）をイベントカードに追加

### 4-4. 学校削除機能

`components/calendar/SchoolSidebar.tsx` の各学校カードに削除ボタンを追加。

- ゴミ箱アイコン（`Trash2` from lucide-react）
- クリック時に確認なしで即削除（モックデータ段階では `useState` で管理、実データ連携後は Supabase DELETE）
- Server Action: `deleteUserSchedule(id: string)`

### 4-5. 学校追加モーダル

「学校を追加する」ボタンをクリックすると、Dashboardへの遷移ではなくモーダルを表示。

**モーダル構成（2タブ）:**

**タブA: 既存DBから検索**
- テキスト入力でオートコンプリート（`universities` テーブルを検索）
- 候補を選択すると研究科一覧が表示
- 研究科を選択すると日程が自動入力される
- 「追加」ボタンで `user_schedules` にINSERT

**タブB: 手動入力**
| フィールド | 型 | 必須 |
|-----------|----|----|
| 学校名 | text | ✓ |
| 研究科 | text | - |
| 出願開始日 | date | - |
| 出願締切日 | date | - |
| 試験日 | date | - |
| 面接日 | date | - |
| 合格発表日 | date | - |

- 「追加」ボタンで `user_schedules` にINSERT（`university_schedule_id` はNULL）

**モーダルコンポーネント:** `components/calendar/AddScheduleModal.tsx`（新規作成）

---

## 5. データフロー

```
カレンダーページ起動
  ↓
セッションチェック（クライアント側）
  ├─ 未ログイン → /auth/login にリダイレクト
  └─ ログイン済み
       ↓
  user_schedules を user_id でフェッチ
       ↓
  重複チェック（exam_dateが被るエントリを検出）
       ↓
  ConflictBanner + TimelineView/GanttView（ハイライト付き）に渡す
```

---

## 6. スコープ外（後フェーズ）

- URL/PDF読み込みによるAI自動入力
- SchoolCard の「カレンダーに追加」ボタンの実動作（現在はログインページへリダイレクト）
- user_bookmarks テーブルの削除（移行後）

---

## 7. 実装順序

1. DBマイグレーション（`user_schedules` テーブル作成 + RLS）
2. Auth接続（AuthForm → Supabase Auth）
3. Navbar Auth状態反映
4. カレンダーページ実データ化（`user_schedules` フェッチ）
5. UI改善①② ラベル変更（簡単なので先にやる）
6. 重複ハイライト（④-3）
7. 削除機能（④-4）
8. 追加モーダル（④-5、最も複雑）
