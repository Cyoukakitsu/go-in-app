// components/calendar/SchoolSidebar.tsx
import { Trash2 } from 'lucide-react'
import { Bookmark } from '../types'

interface SchoolSidebarProps {
  bookmarks: Bookmark[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onDelete: (id: string) => void
}

const STATUS_LABEL: Record<Bookmark['status'], string> = {
  planning: '検討中',
  applied: '出願済',
  examined: '受験済',
  passed: '合格',
  failed: '不合格',
}

export function SchoolSidebar({ bookmarks, selectedId, onSelect, onDelete }: SchoolSidebarProps) {
  return (
    <aside className="w-full lg:w-60 shrink-0 bg-bg-card border border-border-custom rounded-2xl overflow-hidden self-start lg:sticky lg:top-6">
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
          <div
            key={b.id}
            className={`group relative border-b border-border-custom last:border-b-0 ${
              isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-bg-hover border-l-2 border-l-transparent'
            }`}
          >
            <button
              onClick={() => onSelect(isSelected ? null : b.id)}
              className="w-full text-left px-4 py-3 pr-10 transition-colors"
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

            {/* 削除ボタン（ホバーで表示） */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(b.id)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
              title="削除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </aside>
  )
}
