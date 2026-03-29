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
          <div className="flex flex-col lg:flex-row gap-6 items-start">
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
