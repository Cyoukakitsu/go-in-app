// app/calendar/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarIcon, LayoutList, GanttChartSquare, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { SchoolSidebar } from '@/features/calendar/components/SchoolSidebar'
import { TimelineView } from '@/features/calendar/components/TimelineView'
import { GanttView } from '@/features/calendar/components/GanttView'
import { ConflictBanner } from '@/features/calendar/components/ConflictBanner'
import { AddScheduleModal } from '@/features/calendar/components/AddScheduleModal'
import { toBookmark } from '@/features/calendar/types'
import type { Bookmark, ViewType, UserScheduleRow } from '@/features/calendar/types'
import { createBrowserClient } from '@/shared/lib/supabase/browser'

export default function CalendarPage() {
  const router = useRouter()
  const [activeView, setActiveView] = useState<ViewType>('timeline')
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchBookmarks = async () => {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from('user_schedules')
      .select('*')
      .order('created_at', { ascending: false })

    setBookmarks((data as UserScheduleRow[] ?? []).map(toBookmark))
    setLoading(false)
  }

  useEffect(() => {
    const supabase = createBrowserClient()

    // 認証状態が確定してからブックマークを取得する
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (!session) {
          router.push('/auth/login')
        } else {
          fetchBookmarks()
        }
      } else if (event === 'SIGNED_OUT') {
        router.push('/auth/login')
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
