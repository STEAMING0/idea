import { useState, useEffect } from 'react'
import type { Entry } from '@shared/types/entry'
import { formatDate, formatTime } from '@shared/utils/time'

const PAGE_SIZE = 50

const STATUS_STYLES: Record<Entry['status'], string> = {
  written:  'bg-green-100 text-green-700',
  skipped:  'bg-gray-100 text-gray-500',
  snoozed:  'bg-yellow-100 text-yellow-700'
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
    <div className="flex flex-col h-screen bg-white text-gray-800">
      {/* header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
        <span className="font-semibold text-sm">Journal Log</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFile('text')}
            disabled={exporting || entries.length === 0}
            className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40"
          >
            Export TXT
          </button>
          <button
            onClick={() => exportFile('csv')}
            disabled={exporting || entries.length === 0}
            className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={() => window.ipc.invoke('window:close', undefined as never)}
            className="text-gray-300 hover:text-gray-500 text-xl leading-none ml-1"
          >
            ×
          </button>
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">Loading...</div>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">No entries yet.</div>
        )}

        {!loading && entries.map((entry) => (
          <div key={entry.id} className="px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400">{formatDate(entry.createdAt)}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs font-medium text-gray-600">{entry.periodLabel}</span>
              <span className="text-xs text-gray-300">
                {formatTime(entry.periodStart)} – {formatTime(entry.periodEnd)}
              </span>
              <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${STATUS_STYLES[entry.status]}`}>
                {entry.status}
              </span>
            </div>
            {entry.status === 'written' && entry.text && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-snug">{entry.text}</p>
            )}
          </div>
        ))}
      </div>

      {/* pagination */}
      {!loading && (offset > 0 || hasMore) && (
        <div className="flex items-center justify-between px-5 py-2 border-t border-gray-100 shrink-0">
          <button
            onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
            className="text-xs px-3 py-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
          >
            ← Newer
          </button>
          <span className="text-xs text-gray-400">
            {offset + 1}–{offset + entries.length}
          </span>
          <button
            onClick={() => load(offset + PAGE_SIZE)}
            disabled={!hasMore}
            className="text-xs px-3 py-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30"
          >
            Older →
          </button>
        </div>
      )}
    </div>
  )
}
