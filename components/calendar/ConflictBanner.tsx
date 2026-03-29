// components/calendar/ConflictBanner.tsx
import { AlertTriangle } from 'lucide-react'
import { Bookmark } from './types'

interface ConflictBannerProps {
  bookmarks: Bookmark[]
}

// YYYY-MM-DD を YYYY年M月D日 形式に変換する
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${year}年${parseInt(month)}月${parseInt(day)}日`
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
    .sort()

  if (conflictDates.length === 0) return null

  return (
    <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-5 flex items-start gap-4">
      <div className="bg-destructive text-white p-2 rounded-xl shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-destructive font-bold text-base">試験日の重複が検出されました！</h3>
        <p className="text-text-main/80 text-sm mt-1">
          {conflictDates.map(formatDate).join('、')} に複数の試験が重複しています。スケジュールを再確認してください。
        </p>
      </div>
    </div>
  )
}
