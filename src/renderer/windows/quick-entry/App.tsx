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

  const submit = async (status: 'written' | 'skipped' | 'snoozed') => {
    if(!period || busy) return
    setBusy(true)

    let snoozeUntil: string | null = null
    if(status === 'snoozed'){
      const settings = await window.ipc.invoke('settings:getAll', undefined as never)
      snoozeUntil = new Date(Date.now() + settings.snoozeDurationMinutes * 60 * 1000).toISOString()
    }

    await window.ipc.invoke('entries:create', {
      periodId: period.periodId,
      periodLabel: period.periodLabel,
      periodStart: period.start,
      periodEnd: period.end,
      text: status === 'written' ? text.trim() : '',
      status,
      createdAt: new Date().toISOString(),
      snoozeUntil
    })

    window.ipc.invoke('window:close', undefined as never)
  }

  if(!period){
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900 text-gray-400 text-sm">
        Waiting...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{period.periodLabel}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
            {formatTime(period.start)} – {formatTime(period.end)}
          </span>
        </div>
        <button
          className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 text-xl leading-none"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          onClick={() => window.ipc.invoke('window:close', undefined as never)}
        >
          ×
        </button>
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
          className="w-full h-full resize-none rounded-md border border-gray-200 dark:border-gray-700 p-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 placeholder-gray-300 dark:placeholder-gray-600"
        />
      </div>

      <div className="flex gap-2 px-4 pb-4 pt-2 shrink-0">
        <button
          onClick={() => submit('written')}
          disabled={busy || !text.trim()}
          className="flex-1 rounded-md py-1.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white transition-colors"
        >
          Submit
        </button>
        <button
          onClick={() => submit('snoozed')}
          disabled={busy}
          className="px-4 rounded-md py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"
        >
          Snooze
        </button>
        <button
          onClick={() => submit('skipped')}
          disabled={busy}
          className="px-4 rounded-md py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
