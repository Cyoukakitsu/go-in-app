import { FlatEvent, EVENT_CONFIG } from './types'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { formatDate } from './utils'

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
      <div
        className={`flex-1 bg-bg-card border rounded-xl p-3 mb-2 ${
          conflicted ? 'border-destructive/30' : 'border-border-custom'
        }`}
      >
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
            <p className="text-text-main font-bold text-sm">{formatDate(event.date)}</p>
            <p className="text-text-muted text-xs mt-0.5">{getCountdown(event.date)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
