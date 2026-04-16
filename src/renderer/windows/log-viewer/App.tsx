import { useState, useEffect } from 'react'
import type { Entry } from '@shared/types/entry'
import { formatDate, formatTime } from '@shared/utils/time'
const PAGE_SIZE = 50

const STATUS_STYLES: Record<Entry['status'], string> = {
  written: 'bg-orange-500/20 text-orange-300 border border-orange-500/25',
  skipped: 'bg-white/[0.06] text-white/40 border border-white/[0.08]',
}

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const load = async (newOffset: number) => {
    setLoading(true)
    const batch = await window.ipc.invoke('entries:getAll', { limit: PAGE_SIZE + 1, offset: newOffset })
    setHasMore(batch.length > PAGE_SIZE)
    setEntries(batch.slice(0, PAGE_SIZE))
    setOffset(newOffset)
    setLoading(false)
  }

  useEffect(() => { load(0) }, [])

  const exportFile = async (type: 'csv' | 'text') => {
    setExporting(true)
    await window.ipc.invoke(type === 'csv' ? 'export:csv' : 'export:text', {})
    setExporting(false)
  }

  return (
    <div className="flex flex-col h-screen bg-red-600 overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] shrink-0 backdrop-blur-sm">
          <span className="font-semibold text-sm text-white/80">Journal Log</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportFile('text')}
              disabled={exporting || entries.length === 0}
              className="text-xs px-2 py-1 text-white/40 hover:text-white/70 hover:bg-white/[0.07] rounded transition-colors disabled:opacity-30"
            >
              Export TXT
            </button>
            <button
              onClick={() => exportFile('csv')}
              disabled={exporting || entries.length === 0}
              className="text-xs px-2 py-1 text-white/40 hover:text-white/70 hover:bg-white/[0.07] rounded transition-colors disabled:opacity-30"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* entries list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32 text-sm text-white/30">Loading...</div>
          )}

          {!loading && entries.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-white/30">No entries yet.</div>
          )}

          {!loading && entries.map((entry) => (
            <div
              key={entry.id}
              className="px-5 py-3 border-b border-white/[0.05] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-white/35">{formatDate(entry.createdAt)}</span>
                <span className="text-xs text-white/20">·</span>
                <span className="text-xs font-medium text-white/60">{entry.periodLabel}</span>
                <span className="text-xs text-white/30">
                  {formatTime(entry.periodStart)} – {formatTime(entry.periodEnd)}
                </span>
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${STATUS_STYLES[entry.status]}`}>
                  {entry.status}
                </span>
              </div>
              {entry.status === 'written' && entry.text && (
                <p className="text-sm text-white/70 whitespace-pre-wrap leading-snug">{entry.text}</p>
              )}
            </div>
          ))}
        </div>

        {/* pagination */}
        {!loading && (offset > 0 || hasMore) && (
          <div className="flex items-center justify-between px-5 py-2 border-t border-white/[0.07] shrink-0">
            <button
              onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="text-xs px-3 py-1 text-white/40 hover:text-white/70 hover:bg-white/[0.07] rounded disabled:opacity-25 transition-colors"
            >
              ← Newer
            </button>
            <span className="text-xs text-white/30">
              {offset + 1}–{offset + entries.length}
            </span>
            <button
              onClick={() => load(offset + PAGE_SIZE)}
              disabled={!hasMore}
              className="text-xs px-3 py-1 text-white/40 hover:text-white/70 hover:bg-white/[0.07] rounded disabled:opacity-25 transition-colors"
            >
              Older →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
