# カレンダーページ リデザイン仕様書

**日付:** 2026-03-29
**対象ページ:** `/calendar`（受験スケジュール）
**参考デザイン:** タイムライン + ガントビュー切替型スケジュール管理UI

---

## 概要

現在のカードリスト形式の受験スケジュールページを、**縦型タイムラインビュー**と**横型ガントビュー**を切り替えられる2-paneレイアウトにリデザインする。左サイドバーで学校を選択し、右エリアに日程が可視化される。

---

## アーキテクチャ

### レイアウト構成

```
┌─────────────────────────────────────────────────────┐
│  Header: タイトル + Timeline / Gantt 切替ボタン       │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  左サイドバー │  右メインエリア                       │
│  (240px固定)  │  <TimelineView> or <GanttView>      │
│  学校リスト   │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

### ファイル構成

```
app/calendar/page.tsx               ← Client Component（状態管理）
components/calendar/
  SchoolSidebar.tsx                 ← 学校リストサイドバー
  TimelineView.tsx                  ← 縦型タイムライン
  GanttView.tsx                     ← 横型ガントチャート
  EventNode.tsx                     ← タイムライン上のイベントノード
  ConflictBanner.tsx                ← 試験日重複警告バナー
```

---

## データ構造

```ts
type Bookmark = {
  id: string
  university_name: string       // 日本語名
  university_name_zh: string    // 中国語名
  department: string
  type: '国立' | '公立' | '私立'
  status: 'planning' | 'applied' | 'examined' | 'passed' | 'failed'
  schedule: {
    application_start: string   // "YYYY-MM-DD"
    application_end: string
    exam_date: string
    interview_date: string | null
    result_date: string
  }
}
```

Mock データはデータベース設計（`universities` + `university_schedules` + `user_bookmarks`）に対応した構造で定義し、後でSupabaseクエリに差し替え可能にする。

---

## 状態管理

`app/calendar/page.tsx` の `useState` で管理：

```ts
const [activeView, setActiveView] = useState<'timeline' | 'gantt'>('timeline')
const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
```

- `selectedSchoolId === null` → 全校のイベントをフラットに表示
- `selectedSchoolId === 'xxx'` → 該当校をハイライト、他校は透明度を下げる

---

## コンポーネント仕様

### SchoolSidebar

- `bookmarks` + `selectedId` + `onSelect(id: string | null)` を props で受け取る
- 各アイテム：校名（日本語）+ 類型バッジ（国立/私立）
- 選択中のアイテムは左ボーダー + 背景色で強調
- 「全て表示」ボタンで `selectedId` を `null` にリセット

### TimelineView

- 縦軸：時間（月単位のセパレーター）
- 各イベントノードを時系列でソートして表示
- `selectedSchoolId` が設定されている場合、非選択校のノードは `opacity-30`
- 重複している `exam_date` のノードは赤リング表示

### GanttView

- 横軸：日付範囲（全ブックマークの最早〜最遅日を自動計算）
- 各行：1校1行、左に校名、右に水平バー
- バーは出願期間（開始〜締切）を塗りつぶし、試験日・面接日・合格発表日を点/アイコンで示す
- `selectedSchoolId` が設定されている場合、該当行を強調

### EventNode（TimelineView内で使用）

- アイコン + イベント種別ラベル + 日付 + カウントダウン（`N days left` or `N days ago`）
- 事件類型と色のマッピング：

| イベント | 色 |
|---------|-----|
| 出願開始 | `#C4956A`（キャラメル）|
| 出願締切 | `#E8463A`（警告赤）|
| 試験日   | `#6F4E37`（プライマリブラウン）|
| 面接日   | `#3D6B5A`（グリーン）|
| 合格発表 | `#8B5E3C`（ブラウン）|

### ConflictBanner

- `exam_date` が同日の bookmark が2件以上ある場合に表示
- 将来的に `interview_date` も同様チェック可能な構造にする
- デザイン：既存の警告バナー（`AlertTriangle` アイコン）を踏襲

---

## デザイン原則

CLAUDE.md の UIガイドラインに従う：
- 背景：`#FFF8F0`（クリームホワイト）
- カード背景：`#FFFCF8`
- ボーダー：`rgba(111,78,55,0.12)`
- 角丸：`rounded-2xl`
- ダーク/ブラック系テーマは使わない（参考デザインのダークテーマは採用しない）
- フォント：見出し = Playfair Display（serif）、本文 = DM Sans + Noto Sans JP

---

## スコープ外（今回は実装しない）

- Supabase からのデータ取得（Mock データのまま）
- ドラッグ&ドロップでスケジュール変更
- ステータス更新機能
- モバイルでのGanttビュー最適化（Timelineビューのみモバイル対応）
