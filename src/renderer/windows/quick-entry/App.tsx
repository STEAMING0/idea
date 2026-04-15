import { useState, useEffect, useRef } from 'react'
import type { IpcInput } from '@shared/types/ipc'
import { formatTime } from '@shared/utils/time'
import AnimatedBg from '@renderer/components/AnimatedBg'

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
      <div className="flex items-center justify-center h-screen bg-[#070b14] overflow-hidden">
        <AnimatedBg />
        <span className="relative z-10 text-sm text-white/30">Waiting...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#070b14] overflow-hidden">
      <AnimatedBg />

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {/* drag region / header */}
        <div
          className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div>
            <span className="text-sm font-semibold text-white/90">{period.periodLabel}</span>
            <span className="text-xs text-white/40 ml-2">
              {formatTime(period.start)} – {formatTime(period.end)}
            </span>
          </div>
        </div>

        {/* textarea */}
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
              bg-white/[0.06] border border-white/[0.12] backdrop-blur-sm
              text-white/90 placeholder-white/25
              focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08]
              transition-colors"
          />
        </div>

        {/* actions */}
        <div className="flex gap-2 px-4 pb-4 pt-2 shrink-0">
          <button
            onClick={() => submit('written')}
            disabled={busy || !text.trim()}
            className="flex-1 rounded-lg py-1.5 text-sm font-medium
              bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white
              transition-colors shadow-lg shadow-violet-900/40"
          >
            Submit
          </button>
          <button
            onClick={() => submit('snoozed')}
            disabled={busy}
            className="px-4 rounded-lg py-1.5 text-sm
              bg-white/[0.07] hover:bg-white/[0.12] disabled:opacity-30
              text-white/60 hover:text-white/80 border border-white/[0.08]
              transition-colors"
          >
            Snooze
          </button>
          <button
            onClick={() => submit('skipped')}
            disabled={busy}
            className="px-4 rounded-lg py-1.5 text-sm
              bg-white/[0.07] hover:bg-white/[0.12] disabled:opacity-30
              text-white/60 hover:text-white/80 border border-white/[0.08]
              transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
