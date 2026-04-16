import { useState, useEffect, useRef } from 'react'
import type { AppSettings } from '@shared/types/settings'
import type { Period, CreatePeriodInput, DayOfWeek } from '@shared/types/period'
import type { Entry } from '@shared/types/entry'
import type { IpcInput } from '@shared/types/ipc'
import { formatDate, formatTime } from '@shared/utils/time'

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PAGE_SIZE = 50

type Tab = 'journal' | 'periods' | 'settings'
type PeriodData = IpcInput<'notify:periodEnd'>

type PeriodForm = {
  label: string
  startTime: string
  endTime: string
  days: DayOfWeek[]
  active: boolean
}

const emptyForm = (): PeriodForm => ({
  label: '',
  startTime: '09:00',
  endTime: '17:00',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  active: true
})

const STATUS_STYLES: Record<Entry['status'], string> = {
  written: 'bg-orange-500/20 text-orange-300 border border-orange-500/25',
  skipped: 'bg-white/[0.06] text-white/40 border border-white/[0.08]',
}

export default function App() {
  const [tab, setTab] = useState<Tab>('journal')

  // ── compose overlay (shown when a period ends) ──
  const [composePeriod, setComposePeriod] = useState<PeriodData | null>(null)
  const [composeText, setComposeText] = useState('')
  const [composeBusy, setComposeBusy] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── journal ──
  const [entries, setEntries] = useState<Entry[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
  const [editingEntryText, setEditingEntryText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // ── settings ──
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)

  // ── periods ──
  const [periods, setPeriods] = useState<Period[]>([])
  const [form, setForm] = useState<PeriodForm | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    window.ipc.invoke('settings:getAll', undefined as never).then(setAppSettings)
    window.ipc.invoke('periods:getAll', undefined as never).then(setPeriods)
    loadEntries(0)

    // Listen for period-end notifications — show compose overlay
    return window.ipc.on('notify:periodEnd', (data) => {
      setComposePeriod(data)
      setComposeText('')
      setComposeBusy(false)
      setTimeout(() => textareaRef.current?.focus(), 80)
    })
  }, [])

  const loadEntries = async (newOffset: number) => {
    setLoadingEntries(true)
    const batch = await window.ipc.invoke('entries:getAll', { limit: PAGE_SIZE + 1, offset: newOffset })
    setHasMore(batch.length > PAGE_SIZE)
    setEntries(batch.slice(0, PAGE_SIZE))
    setOffset(newOffset)
    setLoadingEntries(false)
  }

  const saveEntryEdit = async (id: number) => {
    await window.ipc.invoke('entries:update', { id, text: editingEntryText })
    setEditingEntryId(null)
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, text: editingEntryText } : e))
  }

  const deleteEntry = async (id: number) => {
    await window.ipc.invoke('entries:delete', { id })
    setConfirmDeleteId(null)
    setExpandedId(null)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  // ── compose submit ──
  const submitEntry = async (status: 'written' | 'skipped') => {
    if(!composePeriod || composeBusy) return
    setComposeBusy(true)

    await window.ipc.invoke('entries:create', {
      periodId: composePeriod.periodId,
      periodLabel: composePeriod.periodLabel,
      periodStart: composePeriod.start,
      periodEnd: composePeriod.end,
      text: status === 'written' ? composeText.trim() : '',
      status,
      createdAt: new Date().toISOString()
    })

    setComposePeriod(null)
    setTab('journal')
    loadEntries(0)
  }

  const exportFile = async (type: 'csv' | 'text') => {
    setExporting(true)
    await window.ipc.invoke(type === 'csv' ? 'export:csv' : 'export:text', {})
    setExporting(false)
  }

  const saveSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setAppSettings((s) => s ? { ...s, [key]: value } : s)
    window.ipc.invoke('settings:set', { key, value })
  }

  const reloadPeriods = () =>
    window.ipc.invoke('periods:getAll', undefined as never).then(setPeriods)

  const submitPeriod = async () => {
    if(!form) return
    const input: CreatePeriodInput = {
      label: form.label.trim() || 'Unnamed',
      startTime: form.startTime,
      endTime: form.endTime,
      days: form.days,
      active: form.active
    }
    if(editingId !== null){
      await window.ipc.invoke('periods:update', { ...input, id: editingId })
    } else {
      await window.ipc.invoke('periods:create', input)
    }
    setForm(null)
    setEditingId(null)
    reloadPeriods()
  }

  const deletePeriod = async (id: number) => {
    await window.ipc.invoke('periods:delete', { id })
    reloadPeriods()
  }

  const toggleActive = async (id: number, active: boolean) => {
    await window.ipc.invoke('periods:setActive', { id, active })
    reloadPeriods()
  }

  const startEdit = (p: Period) => {
    setEditingId(p.id)
    setForm({ label: p.label, startTime: p.startTime, endTime: p.endTime, days: p.days, active: p.active })
  }

  const toggleDay = (day: DayOfWeek) => {
    if(!form) return
    const days = form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day]
    setForm({ ...form, days })
  }

  return (
    <div className="flex flex-col h-screen bg-red-600 overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">

        {/* ── top bar ── */}
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-center shrink-0">
          <span className="font-bold text-2xl text-white">THIS IS MY JOURNAL :)</span>
        </div>

        {/* ── tabs ── */}
        <div className="flex justify-between px-5 pt-3 pb-1 shrink-0">
          {(['journal', 'periods', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1 text-sm rounded-md capitalize transition-colors ${
                tab === t
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.07]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Journal tab ── */}
        {tab === 'journal' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto">
              {loadingEntries && (
                <div className="flex items-center justify-center h-32 text-sm text-white/30">Loading...</div>
              )}
              {!loadingEntries && entries.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 gap-1">
                  <span className="text-sm text-white/30">No entries yet.</span>
                  <span className="text-xs text-white/20">Entries appear here after you respond to a period prompt.</span>
                </div>
              )}
              {!loadingEntries && entries.map((entry) => {
                const isExpanded = expandedId === entry.id
                return (
                  <div key={entry.id} className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="w-full text-left px-5 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-white/70">{entry.periodLabel}</span>
                            <span className="text-xs text-white/30">{formatTime(entry.periodStart)} – {formatTime(entry.periodEnd)}</span>
                            <span className="text-xs text-white/30">{formatDate(entry.createdAt)}</span>
                          </div>
                          {entry.status === 'written' && entry.text && !isExpanded && (
                            <p className="text-xs text-white/55 mt-0.5 truncate leading-snug">{entry.text}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLES[entry.status]}`}>
                            {entry.status}
                          </span>
                          <span className="text-white/20 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4">
                        <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] p-3">
                          {editingEntryId === entry.id ? (
                            <>
                              <textarea
                                value={editingEntryText}
                                onChange={(e) => setEditingEntryText(e.target.value)}
                                rows={4}
                                className="w-full resize-none rounded-md p-2 text-sm
                                  bg-white/[0.06] border border-white/[0.12] text-white/90
                                  focus:outline-none focus:border-orange-500/50 transition-colors"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => saveEntryEdit(entry.id)}
                                  className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingEntryId(null)}
                                  className="px-3 py-1 text-xs text-white/45 hover:bg-white/[0.07] rounded-md transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              {entry.status === 'written' && entry.text ? (
                                <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                              ) : (
                                <p className="text-sm text-white/25 italic">
                                  Period was skipped.
                                </p>
                              )}
                              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-4">
                                <div className="ml-auto flex gap-2">
                                  {entry.status === 'written' && (
                                    <button
                                      onClick={() => { setEditingEntryId(entry.id); setEditingEntryText(entry.text) }}
                                      className="text-xs text-white/35 hover:text-orange-400 transition-colors"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {confirmDeleteId === entry.id ? (
                                    <>
                                      <span className="text-xs text-white/35">Delete?</span>
                                      <button
                                        onClick={() => deleteEntry(entry.id)}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="text-xs text-white/35 hover:text-white/60 transition-colors"
                                      >
                                        No
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteId(entry.id)}
                                      className="text-xs text-white/35 hover:text-red-400 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {!loadingEntries && (offset > 0 || hasMore) && (
              <div className="flex items-center justify-between px-5 py-2 border-t border-white/[0.07] shrink-0">
                <button
                  onClick={() => loadEntries(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0}
                  className="text-xs px-3 py-1 text-white/40 hover:text-white/70 hover:bg-white/[0.07] rounded disabled:opacity-25 transition-colors"
                >
                  ← Newer
                </button>
                <span className="text-xs text-white/30">{offset + 1}–{offset + entries.length}</span>
                <button
                  onClick={() => loadEntries(offset + PAGE_SIZE)}
                  disabled={!hasMore}
                  className="text-xs px-3 py-1 text-white/40 hover:text-white/70 hover:bg-white/[0.07] rounded disabled:opacity-25 transition-colors"
                >
                  Older →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Periods tab ── */}
        {tab === 'periods' && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              {periods.length === 0 && !form && (
                <p className="text-sm text-white/30">No periods yet. Add one below.</p>
              )}
              {periods.map((p) => (
                <div key={p.id} className="flex items-center gap-3 border border-white/[0.09] rounded-lg px-3 py-2 bg-white/[0.04]">
                  <Toggle value={p.active} onChange={(v) => toggleActive(p.id, v)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-white/80">{p.label}</div>
                    <div className="text-xs text-white/35">{p.startTime} – {p.endTime} · {p.days.join(', ')}</div>
                  </div>
                  <button onClick={() => startEdit(p)} className="text-xs text-white/35 hover:text-orange-400 px-1 transition-colors">Edit</button>
                  <button onClick={() => deletePeriod(p.id)} className="text-xs text-white/35 hover:text-red-400 px-1 transition-colors">Delete</button>
                </div>
              ))}
              {form ? (
                <div className="border border-orange-500/25 rounded-lg p-3 space-y-3 bg-orange-500/[0.06]">
                  <div>
                    <label className="text-xs text-white/45 block mb-1">Label</label>
                    <input
                      type="text"
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="e.g. Morning block"
                      className="w-full border border-white/[0.12] rounded-md px-2 py-1 text-sm bg-white/[0.06] text-white/80 placeholder-white/25 focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-white/45 block mb-1">Start</label>
                      <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full border border-white/[0.12] rounded-md px-2 py-1 text-sm bg-white/[0.06] text-white/80 focus:outline-none focus:border-orange-500/50 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-white/45 block mb-1">End</label>
                      <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full border border-white/[0.12] rounded-md px-2 py-1 text-sm bg-white/[0.06] text-white/80 focus:outline-none focus:border-orange-500/50 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/45 block mb-1">Days</label>
                    <div className="flex gap-1">
                      {DAYS.map((d) => (
                        <button key={d} onClick={() => toggleDay(d)} className={`px-2 py-0.5 rounded text-xs transition-colors ${form.days.includes(d) ? 'bg-orange-600 text-white' : 'bg-white/[0.07] text-white/45 hover:bg-white/[0.12]'}`}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Toggle value={form.active} onChange={(v) => setForm({ ...form, active: v })} />
                      <span>Active</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setForm(null); setEditingId(null) }} className="px-3 py-1 text-sm text-white/45 hover:bg-white/[0.07] rounded-md transition-colors">Cancel</button>
                      <button onClick={submitPeriod} disabled={form.days.length === 0} className="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white rounded-md transition-colors">{editingId !== null ? 'Save' : 'Add'}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setEditingId(null); setForm(emptyForm()) }} className="w-full border border-dashed border-white/[0.12] rounded-lg py-2 text-sm text-white/30 hover:border-orange-500/40 hover:text-orange-400 transition-colors">
                  + Add period
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Settings tab ── */}
        {tab === 'settings' && appSettings && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-5">
<div className="pt-2 border-t border-white/[0.07] flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => loadEntries(0)}
                    disabled={loadingEntries}
                    className="px-3 py-1.5 text-sm text-white/70 hover:text-white bg-white/[0.07] hover:bg-white/[0.12] rounded-md transition-colors disabled:opacity-30"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => exportFile('text')}
                    disabled={exporting || entries.length === 0}
                    className="px-3 py-1.5 text-sm text-white/70 hover:text-white bg-white/[0.07] hover:bg-white/[0.12] rounded-md transition-colors disabled:opacity-30"
                  >
                    Export TXT
                  </button>
                  <button
                    onClick={() => exportFile('csv')}
                    disabled={exporting || entries.length === 0}
                    className="px-3 py-1.5 text-sm text-white/70 hover:text-white bg-white/[0.07] hover:bg-white/[0.12] rounded-md transition-colors disabled:opacity-30"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Compose overlay — shown when a period ends ── */}
      {composePeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[480px] rounded-2xl bg-[#0f1220] border border-white/[0.12] shadow-2xl overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-white/[0.07]">
              <p className="text-xs text-white/40 mb-0.5">Period ended</p>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold text-white/90">{composePeriod.periodLabel}</span>
                <span className="text-sm text-white/40">{formatTime(composePeriod.start)} – {formatTime(composePeriod.end)}</span>
              </div>
            </div>
            <div className="px-5 py-3">
              <textarea
                ref={textareaRef}
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                onKeyDown={(e) => {
                  if((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitEntry('written')
                  if(e.key === 'Escape') submitEntry('skipped')
                }}
                placeholder="What did you accomplish this period?"
                rows={5}
                className="w-full resize-none rounded-lg p-3 text-sm
                  bg-white/[0.06] border border-white/[0.10]
                  text-white/90 placeholder-white/25
                  focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => submitEntry('written')}
                disabled={composeBusy || !composeText.trim()}
                className="flex-1 rounded-lg py-2 text-sm font-medium
                  bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white
                  transition-colors shadow-lg shadow-orange-900/40"
              >
                Submit  <span className="text-white/40 text-xs ml-1">⌘↵</span>
              </button>
              <button
                onClick={() => submitEntry('skipped')}
                disabled={composeBusy}
                className="px-4 rounded-lg py-2 text-sm bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] text-white/60 hover:text-white/80 disabled:opacity-30 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/60">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        value ? 'bg-orange-600' : 'bg-white/[0.15]'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}
