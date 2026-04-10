// features/calendar/types.ts

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
  application_end:   { label: '出願締切', color: '#AF4448' },
  exam_date:         { label: '試験日',   color: '#6F4E37' },
  interview_date:    { label: '面接日',   color: '#3D6B5A' },
  result_date:       { label: '合格発表', color: '#8B5E3C' },
}

// DB行の型（user_schedulesテーブル）
export interface UserScheduleRow {
  id: string
  user_id: string
  university_schedule_id: string | null
  university_name: string
  university_name_zh: string | null
  university_type: string
  department: string | null
  application_start: string | null
  application_end: string | null
  exam_date: string | null
  interview_date: string | null
  result_date: string | null
  status: string
  notes: string | null
  created_at: string
}

// DB行 → Bookmark型へのマッパー
export function toBookmark(row: UserScheduleRow): Bookmark {
  return {
    id: row.id,
    university_name: row.university_name,
    university_name_zh: row.university_name_zh ?? '',
    department: row.department ?? '',
    type: (row.university_type as UniversityType) ?? '私立',
    status: (row.status as BookmarkStatus) ?? 'planning',
    schedule: {
      application_start: row.application_start ?? '',
      application_end: row.application_end ?? '',
      exam_date: row.exam_date ?? '',
      interview_date: row.interview_date ?? null,
      result_date: row.result_date ?? '',
    },
  }
}
