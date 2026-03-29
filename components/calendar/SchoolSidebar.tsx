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
    <aside className="w-60 shrink-0 bg-[#FFFCF8] border border-[rgba(111,78,55,0.12)] rounded-2xl overflow-hidden self-start sticky top-6">
      <div className="p-4 border-b border-[rgba(111,78,55,0.12)]">
        <h2 className="text-[#3D2B1F] font-bold text-sm">大学名称</h2>
      </div>

      {/* 全て表示ボタン */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-[rgba(111,78,55,0.12)] ${
          selectedId === null
            ? 'bg-[rgba(111,78,55,0.05)] text-[#6F4E37] border-l-2 border-l-[#6F4E37]'
            : 'text-[#8B7355] hover:bg-[#FFFAF5] border-l-2 border-l-transparent'
        }`}
      >
        すべて表示
      </button>

      {bookmarks.map((b) => {
        const isSelected = selectedId === b.id
        const typeColor =
          b.type === '国立' || b.type === '公立'
            ? 'bg-[rgba(86,130,115,0.12)] text-[#3D6B5A]'
            : 'bg-[rgba(160,110,90,0.12)] text-[#8B5E3C]'

        return (
          <button
            key={b.id}
            onClick={() => onSelect(isSelected ? null : b.id)}
            className={`w-full text-left px-4 py-3 transition-colors border-b border-[rgba(111,78,55,0.12)] last:border-b-0 ${
              isSelected
                ? 'bg-[rgba(111,78,55,0.05)] border-l-2 border-l-[#6F4E37]'
                : 'hover:bg-[#FFFAF5] border-l-2 border-l-transparent'
            }`}
          >
            <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-[#6F4E37]' : 'text-[#3D2B1F]'}`}>
              {b.university_name}
            </p>
            <p className="text-[#8B7355] text-xs mt-0.5 truncate">{b.department}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeColor}`}>
                {b.type}
              </span>
              <span className="text-[10px] text-[#A89279]">{STATUS_LABEL[b.status]}</span>
            </div>
          </button>
        )
      })}
    </aside>
  )
}
