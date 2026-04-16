import { useState, useEffect, useRef } from 'react'
import type { IpcInput } from '@shared/types/ipc'
import { formatTime } from '@shared/utils/time'

type PeriodData = IpcInput<'notify:periodEnd'>

export default function App() {
  const [period, setPeriod] = useState<PeriodData | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    return window.ipc.on('notify:periodEnd', (data) => {
      setPeriod(data)
      setText('')
      setBusy(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    })
  }, [])

  const submit = async (status: 'written' | 'skipped') => {
    if(!period || busy) return
    setBusy(true)

    await window.ipc.invoke('entries:create', {
      periodId: period.periodId,
      periodLabel: period.periodLabel,
      periodStart: period.start,
      periodEnd: period.end,
      text: status === 'written' ? text.trim() : '',
      status,
      createdAt: new Date().toISOString()
    })

    window.ipc.invoke('window:close', undefined as never)
  }

  if(!period){
    return (
      <div className="flex items-center justify-center h-screen bg-red-600 overflow-hidden">
        <span className="text-sm text-white">Waiting...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-red-600 overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        <div
          className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div>
            <span className="text-sm font-semibold text-white">{period.periodLabel}</span>
            <span className="text-xs text-white/70 ml-2">
              {formatTime(period.start)} – {formatTime(period.end)}
            </span>
          </div>
        </div>

        <div className="flex-1 px-4 min-h-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit('written')
              if(e.key === 'Escape') submit('skipped')
            }}
            placeholder="What did you accomplish this period?"
            className="w-full h-full resize-none rounded-lg p-3 text-sm
              bg-white/[0.06] border border-white/[0.12]
              text-white placeholder-white/40
              focus:outline-none focus:border-orange-500/50
              transition-colors"
          />
        </div>

        <div className="flex gap-2 px-4 pb-4 pt-2 shrink-0">
          <button
            onClick={() => submit('written')}
            disabled={busy || !text.trim()}
            className="flex-1 rounded-lg py-1.5 text-sm font-medium
              bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white
              transition-colors shadow-lg shadow-orange-900/40"
          >
            Submit
          </button>
          <button
            onClick={() => submit('skipped')}
            disabled={busy}
            className="px-4 rounded-lg py-1.5 text-sm
              bg-white/[0.07] hover:bg-white/[0.12] disabled:opacity-30
              text-white hover:text-white border border-white/[0.08]
              transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
