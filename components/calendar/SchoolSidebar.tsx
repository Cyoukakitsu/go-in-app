import { Bookmark } from './types'
import { Badge } from '@/components/ui/badge'

interface SchoolSidebarProps {
  bookmarks: Bookmark[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

const STATUS_LABEL: Record<Bookmark['status'], string> = {
  planning: '検討中',
  applied: '出願済',
  examined: '受験済',
  passed: '合格',
  failed: '不合格',
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
            : 'text-text-sub hover:bg-bg-hover border-l-2 border-l-transparent'
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
