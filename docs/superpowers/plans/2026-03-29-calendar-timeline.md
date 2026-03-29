# Calendar Timeline Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the card-list calendar page with a two-pane layout featuring a school sidebar and switchable Timeline/Gantt views.

**Architecture:** `app/calendar/page.tsx` becomes a Client Component holding `activeView` and `selectedSchoolId` state, rendering a fixed `SchoolSidebar` on the left and either `TimelineView` or `GanttView` on the right. All components live under `components/calendar/`. Mock data matches the Supabase schema exactly so it can be swapped later.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS (custom warm palette from `globals.css`), shadcn/ui, lucide-react

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `components/calendar/types.ts` | `Bookmark` type + event color map |
| Create | `components/calendar/mockData.ts` | Mock bookmarks matching DB schema |
| Create | `components/calendar/ConflictBanner.tsx` | Exam date conflict warning |
| Create | `components/calendar/EventNode.tsx` | Single event node (icon + date + countdown) |
| Create | `components/calendar/SchoolSidebar.tsx` | Clickable school list |
| Create | `components/calendar/TimelineView.tsx` | Vertical chronological timeline |
| Create | `components/calendar/GanttView.tsx` | Horizontal per-school gantt chart |
| Rewrite | `app/calendar/page.tsx` | Page shell with state + layout |

---

## Task 1: Types and Mock Data

**Files:**
- Create: `components/calendar/types.ts`
- Create: `components/calendar/mockData.ts`

- [ ] **Step 1: Create types.ts**

```typescript
// components/calendar/types.ts

export type UniversityType = '国立' | '公立' | '私立'
export type BookmarkStatus = 'planning' | 'applied' | 'examined' | 'passed' | 'failed'
export type EventType = 'application_start' | 'application_end' | 'exam_date' | 'interview_date' | 'result_date'
export type ViewType = 'timeline' | 'gantt'

export interface Schedule {
  application_start: string   // "YYYY-MM-DD"
  application_end: string
  exam_date: string
  interview_date: string | null
  result_date: string
}

export interface Bookmark {
  id: string
  university_name: string       // 日本語名
  university_name_zh: string    // 中国語名
  department: string
  type: UniversityType
  status: BookmarkStatus
  schedule: Schedule
}

// タイムライン上の平坦化されたイベント
export interface FlatEvent {
  bookmarkId: string
  university_name: string
  department: string
  type: UniversityType
  eventType: EventType
  date: string   // "YYYY-MM-DD"
}

// イベント種別ごとの表示設定
export const EVENT_CONFIG: Record<EventType, { label: string; color: string }> = {
  application_start: { label: '出願開始', color: '#C4956A' },
  application_end:   { label: '出願締切', color: '#E8463A' },
  exam_date:         { label: '試験日',   color: '#6F4E37' },
  interview_date:    { label: '面接日',   color: '#3D6B5A' },
  result_date:       { label: '合格発表', color: '#8B5E3C' },
}
```

- [ ] **Step 2: Create mockData.ts**

```typescript
// components/calendar/mockData.ts
import { Bookmark } from './types'

export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: 'b1',
    university_name: '早稲田大学',
    university_name_zh: '早稻田大学',
    department: '経営学研究科 (Waseda Business)',
    type: '私立',
    status: 'planning',
    schedule: {
      application_start: '2026-06-01',
      application_end: '2026-06-15',
      exam_date: '2026-07-21',
      interview_date: '2026-07-21',
      result_date: '2026-08-10',
    },
  },
  {
    id: 'b2',
    university_name: '慶應義塾大学',
    university_name_zh: '庆应义塾大学',
    department: '商学研究科 (Keio Commerce)',
    type: '私立',
    status: 'applied',
    schedule: {
      application_start: '2026-06-10',
      application_end: '2026-06-20',
      exam_date: '2026-07-10',
      interview_date: null,
      result_date: '2026-08-05',
    },
  },
  {
    id: 'b3',
    university_name: '一橋大学',
    university_name_zh: '一桥大学',
    department: '経営管理研究科 (Hitotsubashi Mngmt)',
    type: '国立',
    status: 'planning',
    schedule: {
      application_start: '2026-07-01',
      application_end: '2026-08-15',
      exam_date: '2026-09-10',
      interview_date: '2026-09-20',
      result_date: '2026-10-05',
    },
  },
  {
    id: 'b4',
    university_name: '東京大学',
    university_name_zh: '东京大学',
    department: '工学系研究科',
    type: '国立',
    status: 'planning',
    schedule: {
      application_start: '2026-06-20',
      application_end: '2026-07-10',
      exam_date: '2026-07-21',  // 早稲田と同日 → conflict!
      interview_date: null,
      result_date: '2026-09-01',
    },
  },
]
```

- [ ] **Step 3: Commit**

```bash
git add components/calendar/types.ts components/calendar/mockData.ts
git commit -m "feat(calendar): add Bookmark types and mock data"
```

---

## Task 2: ConflictBanner Component

**Files:**
- Create: `components/calendar/ConflictBanner.tsx`

- [ ] **Step 1: Create ConflictBanner.tsx**

```tsx
// components/calendar/ConflictBanner.tsx
import { AlertTriangle } from 'lucide-react'
import { Bookmark } from './types'

interface ConflictBannerProps {
  bookmarks: Bookmark[]
}

// exam_date が同日の bookmark が2件以上ある場合に警告表示
export function ConflictBanner({ bookmarks }: ConflictBannerProps) {
  const dateCounts = bookmarks.reduce<Record<string, number>>((acc, b) => {
    acc[b.schedule.exam_date] = (acc[b.schedule.exam_date] ?? 0) + 1
    return acc
  }, {})

  const conflictDates = Object.entries(dateCounts)
    .filter(([, count]) => count > 1)
    .map(([date]) => date)

  if (conflictDates.length === 0) return null

  return (
    <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-5 flex items-start gap-4">
      <div className="bg-destructive text-white p-2 rounded-xl shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-destructive font-bold text-base">試験日の重複が検出されました！</h3>
        <p className="text-text-main/80 text-sm mt-1">
          {conflictDates.join('、')} に複数の試験が重複しています。スケジュールを再確認してください。
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify — run dev server and check no TypeScript errors**

```bash
pnpm dev
```

Open `http://localhost:3000/calendar`. No red errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add components/calendar/ConflictBanner.tsx
git commit -m "feat(calendar): add ConflictBanner component"
```

---

## Task 3: EventNode Component

**Files:**
- Create: `components/calendar/EventNode.tsx`

- [ ] **Step 1: Create EventNode.tsx**

```tsx
// components/calendar/EventNode.tsx
import { FlatEvent, EVENT_CONFIG } from './types'
import { differenceInCalendarDays, parseISO } from 'date-fns'

interface EventNodeProps {
  event: FlatEvent
  dimmed: boolean       // 非選択校のとき true → opacity-30
  conflicted: boolean   // exam_date が重複しているとき true
}

// 日付からカウントダウン文字列を生成
function getCountdown(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = parseISO(dateStr)
  const diff = differenceInCalendarDays(target, today)
  if (diff > 0) return `あと ${diff} 日`
  if (diff === 0) return '今日'
  return `${Math.abs(diff)} 日前`
}

export function EventNode({ event, dimmed, conflicted }: EventNodeProps) {
  const config = EVENT_CONFIG[event.eventType]

  return (
    <div className={`flex items-start gap-3 transition-opacity duration-200 ${dimmed ? 'opacity-30' : 'opacity-100'}`}>
      {/* タイムラインドット */}
      <div className="flex flex-col items-center shrink-0 mt-1">
        <div
          className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${conflicted ? 'ring-2 ring-destructive' : ''}`}
          style={{ backgroundColor: config.color }}
        />
      </div>

      {/* イベント内容 */}
      <div className={`flex-1 bg-bg-card border rounded-xl p-3 mb-2 ${
        conflicted ? 'border-destructive/30' : 'border-border-custom'
      }`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              {config.label}
            </span>
            <p className="text-text-main font-semibold text-sm mt-1">{event.university_name}</p>
            <p className="text-text-sub text-xs">{event.department}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-text-main font-bold text-sm">{event.date}</p>
            <p className="text-text-muted text-xs mt-0.5">{getCountdown(event.date)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Install date-fns if not present**

```bash
pnpm add date-fns
```

- [ ] **Step 3: Commit**

```bash
git add components/calendar/EventNode.tsx
git commit -m "feat(calendar): add EventNode component with countdown"
```

---

## Task 4: SchoolSidebar Component

**Files:**
- Create: `components/calendar/SchoolSidebar.tsx`

- [ ] **Step 1: Create SchoolSidebar.tsx**

```tsx
// components/calendar/SchoolSidebar.tsx
import { Bookmark } from './types'
import { Badge } from '@/components/ui/badge'

interface SchoolSidebarProps {
  bookmarks: Bookmark[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

const STATUS_LABEL: Record<Bookmark['status'], string> = {
  planning:  '検討中',
  applied:   '出願済',
  examined:  '受験済',
  passed:    '合格',
  failed:    '不合格',
}

export function SchoolSidebar({ bookmarks, selectedId, onSelect }: SchoolSidebarProps) {
  return (
    <aside className="w-60 shrink-0 bg-bg-card border border-border-custom rounded-2xl overflow-hidden self-start sticky top-6">
      <div className="p-4 border-b border-border-custom">
        <h2 className="text-text-main font-bold text-sm">大学名称</h2>
      </div>

      {/* 全て表示ボタン */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-border-custom ${
          selectedId === null
            ? 'bg-primary/5 text-primary border-l-2 border-l-primary'
            : 'text-text-sub hover:bg-bg-hover'
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
          <button
            key={b.id}
            onClick={() => onSelect(isSelected ? null : b.id)}
            className={`w-full text-left px-4 py-3 transition-colors border-b border-border-custom last:border-b-0 ${
              isSelected
                ? 'bg-primary/5 border-l-2 border-l-primary'
                : 'hover:bg-bg-hover border-l-2 border-l-transparent'
            }`}
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
        )
      })}
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendar/SchoolSidebar.tsx
git commit -m "feat(calendar): add SchoolSidebar component"
```

---

## Task 5: TimelineView Component

**Files:**
- Create: `components/calendar/TimelineView.tsx`

- [ ] **Step 1: Create TimelineView.tsx**

```tsx
// components/calendar/TimelineView.tsx
import { Bookmark, FlatEvent, EventType } from './types'
import { EventNode } from './EventNode'

interface TimelineViewProps {
  bookmarks: Bookmark[]
  selectedId: string | null
}

// Bookmark の schedule から FlatEvent[] を生成
function flattenEvents(bookmarks: Bookmark[]): FlatEvent[] {
  const eventTypes: EventType[] = [
    'application_start',
    'application_end',
    'exam_date',
    'interview_date',
    'result_date',
  ]

  const events: FlatEvent[] = []
  for (const b of bookmarks) {
    for (const eventType of eventTypes) {
      const date = b.schedule[eventType]
      if (!date) continue
      events.push({
        bookmarkId: b.id,
        university_name: b.university_name,
        department: b.department,
        type: b.type,
        eventType,
        date,
      })
    }
  }
  // 日付昇順でソート
  return events.sort((a, b) => a.date.localeCompare(b.date))
}

// イベントリストを月ごとにグループ化
function groupByMonth(events: FlatEvent[]): Map<string, FlatEvent[]> {
  const map = new Map<string, FlatEvent[]>()
  for (const event of events) {
    const month = event.date.slice(0, 7)  // "YYYY-MM"
    if (!map.has(month)) map.set(month, [])
    map.get(month)!.push(event)
  }
  return map
}

// exam_date が重複している bookmarkId のセット
function getConflictedIds(bookmarks: Bookmark[]): Set<string> {
  const dateCounts: Record<string, string[]> = {}
  for (const b of bookmarks) {
    const d = b.schedule.exam_date
    if (!dateCounts[d]) dateCounts[d] = []
    dateCounts[d].push(b.id)
  }
  const conflicted = new Set<string>()
  for (const ids of Object.values(dateCounts)) {
    if (ids.length > 1) ids.forEach((id) => conflicted.add(id))
  }
  return conflicted
}

// "YYYY-MM" → "YYYY年M月" に変換
function formatMonth(ym: string): string {
  const [year, month] = ym.split('-')
  return `${year}年${parseInt(month)}月`
}

export function TimelineView({ bookmarks, selectedId }: TimelineViewProps) {
  const events = flattenEvents(bookmarks)
  const grouped = groupByMonth(events)
  const conflictedIds = getConflictedIds(bookmarks)

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted py-20">
        <p>表示するイベントがありません</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {Array.from(grouped.entries()).map(([month, monthEvents]) => (
        <div key={month} className="mb-8">
          {/* 月セパレーター */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-bold text-text-sub bg-primary/5 rounded-full px-3 py-1">
              {formatMonth(month)}
            </span>
            <div className="flex-1 h-px bg-border-custom" />
          </div>

          {/* タイムラインライン + イベントノード */}
          <div className="relative pl-4 border-l-2 border-border-custom ml-4 space-y-1">
            {monthEvents.map((event, idx) => {
              const isConflicted =
                event.eventType === 'exam_date' && conflictedIds.has(event.bookmarkId)
              const isDimmed = selectedId !== null && event.bookmarkId !== selectedId

              return (
                <EventNode
                  key={`${event.bookmarkId}-${event.eventType}-${idx}`}
                  event={event}
                  dimmed={isDimmed}
                  conflicted={isConflicted}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendar/TimelineView.tsx
git commit -m "feat(calendar): add TimelineView with monthly grouping"
```

---

## Task 6: GanttView Component

**Files:**
- Create: `components/calendar/GanttView.tsx`

- [ ] **Step 1: Create GanttView.tsx**

```tsx
// components/calendar/GanttView.tsx
import { Bookmark, EVENT_CONFIG } from './types'
import { differenceInCalendarDays, parseISO, format, addDays } from 'date-fns'

interface GanttViewProps {
  bookmarks: Bookmark[]
  selectedId: string | null
}

// 全ブックマークの最早日・最遅日を計算
function getDateRange(bookmarks: Bookmark[]): { minDate: string; maxDate: string } {
  const allDates: string[] = bookmarks.flatMap((b) =>
    [
      b.schedule.application_start,
      b.schedule.application_end,
      b.schedule.exam_date,
      b.schedule.interview_date,
      b.schedule.result_date,
    ].filter((d): d is string => d !== null)
  )
  const sorted = [...allDates].sort()
  return { minDate: sorted[0], maxDate: sorted[sorted.length - 1] }
}

// 月ごとのヘッダーを生成（「6月」「7月」など）
function buildMonthHeaders(minDate: string, totalDays: number): { label: string; offsetDays: number; spanDays: number }[] {
  const headers: { label: string; offsetDays: number; spanDays: number }[] = []
  const start = parseISO(minDate)
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)

  while (differenceInCalendarDays(cursor, start) < totalDays) {
    const offset = Math.max(0, differenceInCalendarDays(cursor, start))
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    const endOfMonth = addDays(nextMonth, -1)
    const span = Math.min(
      differenceInCalendarDays(endOfMonth, start) + 1,
      totalDays
    ) - offset
    if (span > 0) {
      headers.push({ label: format(cursor, 'M月'), offsetDays: offset, spanDays: span })
    }
    cursor = nextMonth
  }
  return headers
}

const POINT_EVENTS = ['exam_date', 'interview_date', 'result_date'] as const

export function GanttView({ bookmarks, selectedId }: GanttViewProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted py-20">
        <p>表示するデータがありません</p>
      </div>
    )
  }

  const { minDate, maxDate } = getDateRange(bookmarks)
  const totalDays = differenceInCalendarDays(parseISO(maxDate), parseISO(minDate)) + 7
  const monthHeaders = buildMonthHeaders(minDate, totalDays)

  function toPct(dateStr: string): number {
    return (differenceInCalendarDays(parseISO(dateStr), parseISO(minDate)) / totalDays) * 100
  }

  return (
    <div className="flex-1 overflow-x-auto">
      <div style={{ minWidth: '600px' }}>
        {/* 月ヘッダー */}
        <div className="flex border-b border-border-custom pb-2 mb-4 ml-44">
          {monthHeaders.map((h) => (
            <div
              key={h.label + h.offsetDays}
              className="text-xs font-bold text-text-sub text-center"
              style={{ width: `${(h.spanDays / totalDays) * 100}%` }}
            >
              {h.label}
            </div>
          ))}
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-4 mb-6 flex-wrap ml-44">
          <span className="text-xs font-bold text-text-sub">凡例:</span>
          {(Object.entries(EVENT_CONFIG) as [keyof typeof EVENT_CONFIG, { label: string; color: string }][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className={`${POINT_EVENTS.includes(key as typeof POINT_EVENTS[number]) ? 'w-2.5 h-2.5 rounded-full' : 'w-6 h-2.5 rounded-sm'}`}
                style={{ backgroundColor: cfg.color }}
              />
              <span className="text-xs text-text-sub">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* 各学校の行 */}
        {bookmarks.map((b) => {
          const isDimmed = selectedId !== null && b.id !== selectedId
          const appStartPct = toPct(b.schedule.application_start)
          const appEndPct = toPct(b.schedule.application_end)
          const appWidthPct = appEndPct - appStartPct

          return (
            <div
              key={b.id}
              className={`flex items-center gap-2 mb-3 transition-opacity duration-200 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
            >
              {/* 学校名 */}
              <div className="w-44 shrink-0 pr-3 text-right">
                <p className="text-sm font-semibold text-text-main leading-tight truncate">{b.university_name}</p>
                <p className="text-[10px] text-text-sub truncate">{b.department}</p>
              </div>

              {/* ガントバー */}
              <div className="flex-1 relative h-8">
                {/* 出願期間バー */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 rounded-sm opacity-80"
                  style={{
                    left: `${appStartPct}%`,
                    width: `${appWidthPct}%`,
                    backgroundColor: EVENT_CONFIG.application_start.color,
                  }}
                />

                {/* ポイントイベント（試験日・面接日・合格発表） */}
                {POINT_EVENTS.map((eventType) => {
                  const dateStr = b.schedule[eventType]
                  if (!dateStr) return null
                  return (
                    <div
                      key={eventType}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{
                        left: `${toPct(dateStr)}%`,
                        backgroundColor: EVENT_CONFIG[eventType].color,
                      }}
                      title={`${EVENT_CONFIG[eventType].label}: ${dateStr}`}
                    />
                  )
                })}

                {/* 今日ライン */}
                {(() => {
                  const todayStr = new Date().toISOString().slice(0, 10)
                  const todayPct = toPct(todayStr)
                  if (todayPct < 0 || todayPct > 100) return null
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-destructive/50"
                      style={{ left: `${todayPct}%` }}
                    />
                  )
                })()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/calendar/GanttView.tsx
git commit -m "feat(calendar): add GanttView with application bar and point events"
```

---

## Task 7: Rewrite Calendar Page

**Files:**
- Rewrite: `app/calendar/page.tsx`

- [ ] **Step 1: Rewrite app/calendar/page.tsx**

```tsx
// app/calendar/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarIcon, LayoutList, GanttChartSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SchoolSidebar } from '@/components/calendar/SchoolSidebar'
import { TimelineView } from '@/components/calendar/TimelineView'
import { GanttView } from '@/components/calendar/GanttView'
import { ConflictBanner } from '@/components/calendar/ConflictBanner'
import { MOCK_BOOKMARKS } from '@/components/calendar/mockData'
import type { ViewType } from '@/components/calendar/types'

export default function CalendarPage() {
  const [activeView, setActiveView] = useState<ViewType>('timeline')
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)

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
            {/* ビュー切替ボタン */}
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
                Timeline
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
                Gantt
              </button>
            </div>

            <Link href="/dashboard">
              <Button className="bg-primary text-white rounded-xl font-bold px-5 h-10 shadow-md hover:opacity-90 transition-all">
                学校を追加する
              </Button>
            </Link>
          </div>
        </header>

        {/* 重複警告バナー */}
        <ConflictBanner bookmarks={MOCK_BOOKMARKS} />

        {/* メインコンテンツ: サイドバー + ビューエリア */}
        {MOCK_BOOKMARKS.length === 0 ? (
          <div className="text-center py-32 bg-bg-card rounded-3xl border border-dashed border-border-custom">
            <CalendarIcon className="w-16 h-16 text-text-muted mx-auto mb-6" />
            <h3 className="text-xl font-serif text-text-main">カレンダーは空です</h3>
            <p className="text-text-sub mt-2 mb-8">志望校を追加してスケジュールを管理しましょう。</p>
            <Link href="/dashboard">
              <Button className="bg-primary text-white rounded-xl font-bold px-8 h-12 shadow-lg">
                学校を探す
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-6 items-start">
            <SchoolSidebar
              bookmarks={MOCK_BOOKMARKS}
              selectedId={selectedSchoolId}
              onSelect={setSelectedSchoolId}
            />

            <div className="flex-1 bg-bg-card border border-border-custom rounded-2xl p-6 min-h-[600px] flex flex-col">
              {activeView === 'timeline' ? (
                <TimelineView
                  bookmarks={MOCK_BOOKMARKS}
                  selectedId={selectedSchoolId}
                />
              ) : (
                <GanttView
                  bookmarks={MOCK_BOOKMARKS}
                  selectedId={selectedSchoolId}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
pnpm dev
```

1. Open `http://localhost:3000/calendar`
2. 確認項目:
   - ConflictBanner が表示されている（早稲田・東京大が同日）
   - 左サイドバーに4校が表示されている
   - Timeline ボタン → 月単位で縦型タイムライン表示
   - Gantt ボタン → 横型ガントチャート表示（出願期間バー + 試験日ドット）
   - サイドバーで学校クリック → 他校が `opacity-30` になる
   - 「すべて表示」クリック → 全校 `opacity-100` に戻る
   - TypeScript エラーなし

- [ ] **Step 3: Commit**

```bash
git add app/calendar/page.tsx
git commit -m "feat(calendar): rewrite page with sidebar + timeline/gantt view toggle"
```

---

## Self-Review

**Spec coverage:**
- ✅ 2-paneレイアウト（Sidebar + 右メインエリア）
- ✅ Timeline View（縦型、月セパレーター）
- ✅ Gantt View（横型、出願バー + ポイントイベント）
- ✅ ビュー切替ボタン
- ✅ サイドバー学校クリック → dimmed effect
- ✅ 「全て表示」ボタン
- ✅ ConflictBanner（exam_date重複検出）
- ✅ EventNode（アイコン + 日付 + カウントダウン）
- ✅ 完全な Bookmark 型（全5フィールド）
- ✅ CLAUDE.md カラーパレット準拠（ダークテーマなし）

**Placeholder scan:** プレースホルダーなし。全ステップに実際のコードあり。

**Type consistency:** `Bookmark`, `FlatEvent`, `EventType`, `ViewType` は全タスクで `types.ts` から import。`MOCK_BOOKMARKS` は `mockData.ts` から一元管理。
