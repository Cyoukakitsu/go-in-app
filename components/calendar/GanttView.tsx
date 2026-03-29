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
function buildMonthHeaders(
  minDate: string,
  totalDays: number
): { label: string; offsetDays: number; spanDays: number }[] {
  const headers: { label: string; offsetDays: number; spanDays: number }[] = []
  const start = parseISO(minDate)
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)

  while (differenceInCalendarDays(cursor, start) < totalDays) {
    const offset = Math.max(0, differenceInCalendarDays(cursor, start))
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    const endOfMonth = addDays(nextMonth, -1)
    const span =
      Math.min(differenceInCalendarDays(endOfMonth, start) + 1, totalDays) - offset
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
  const totalDays =
    differenceInCalendarDays(parseISO(maxDate), parseISO(minDate)) + 7
  const monthHeaders = buildMonthHeaders(minDate, totalDays)

  function toPct(dateStr: string): number {
    return (
      (differenceInCalendarDays(parseISO(dateStr), parseISO(minDate)) / totalDays) *
      100
    )
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
          {(
            Object.entries(EVENT_CONFIG) as [
              keyof typeof EVENT_CONFIG,
              { label: string; color: string },
            ][]
          ).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className={`${
                  POINT_EVENTS.includes(key as (typeof POINT_EVENTS)[number])
                    ? 'w-2.5 h-2.5 rounded-full'
                    : 'w-6 h-2.5 rounded-sm'
                }`}
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
              className={`flex items-center gap-2 mb-3 transition-opacity duration-200 ${
                isDimmed ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {/* 学校名 */}
              <div className="w-44 shrink-0 pr-3 text-right">
                <p className="text-sm font-semibold text-text-main leading-tight truncate">
                  {b.university_name}
                </p>
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
