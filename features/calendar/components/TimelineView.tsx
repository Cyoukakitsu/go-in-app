import { Bookmark, FlatEvent, EventType } from '../types'
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
