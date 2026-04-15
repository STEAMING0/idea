import { useState, useEffect } from 'react'
import type { AppSettings } from '@shared/types/settings'
import type { Period, CreatePeriodInput, DayOfWeek } from '@shared/types/period'

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Tab = 'general' | 'periods'

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

export default function App() {
  const [tab, setTab] = useState<Tab>('general')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])
  const [form, setForm] = useState<PeriodForm | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    window.ipc.invoke('settings:getAll', undefined as never).then(setSettings)
    window.ipc.invoke('periods:getAll', undefined as never).then(setPeriods)
  }, [])

  const saveSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((s) => s ? { ...s, [key]: value } : s)
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
    <div className="flex flex-col h-screen bg-white text-gray-800">
      {/* header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm">Hourly Journal — Settings</span>
        <button
          onClick={() => window.ipc.invoke('window:close', undefined as never)}
          className="text-gray-300 hover:text-gray-500 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* tabs */}
      <div className="flex gap-1 px-5 pt-3 pb-1">
        {(['general', 'periods'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
              tab === t ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'general' && settings && (
          <div className="space-y-5">
            <Row label="Launch at login">
              <Toggle value={settings.autostart} onChange={(v) => saveSetting('autostart', v)} />
            </Row>
            <Row label="Notification sound">
              <Toggle value={settings.notificationSound} onChange={(v) => saveSetting('notificationSound', v)} />
            </Row>
            <Row label="Theme">
              <select
                value={settings.theme}
                onChange={(e) => saveSetting('theme', e.target.value as AppSettings['theme'])}
                className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </Row>
            <Row label="Snooze duration (minutes)">
              <input
                type="number"
                min={1}
                max={120}
                value={settings.snoozeDurationMinutes}
                onChange={(e) => saveSetting('snoozeDurationMinutes', Number(e.target.value))}
                className="w-20 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
              />
            </Row>
            <Row label="Missed period window (minutes)">
              <input
                type="number"
                min={1}
                max={240}
                value={settings.missedWindowMinutes}
                onChange={(e) => saveSetting('missedWindowMinutes', Number(e.target.value))}
                className="w-20 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
              />
            </Row>
          </div>
        )}

        {tab === 'periods' && (
          <div className="space-y-3">
            {periods.length === 0 && !form && (
              <p className="text-sm text-gray-400">No periods yet. Add one below.</p>
            )}

            {periods.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2">
                <Toggle value={p.active} onChange={(v) => toggleActive(p.id, v)} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.label}</div>
                  <div className="text-xs text-gray-400">
                    {p.startTime} – {p.endTime} · {p.days.join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => startEdit(p)}
                  className="text-xs text-gray-400 hover:text-blue-500 px-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePeriod(p.id)}
                  className="text-xs text-gray-400 hover:text-red-500 px-1"
                >
                  Delete
                </button>
              </div>
            ))}

            {form ? (
              <div className="border border-blue-200 rounded-lg p-3 space-y-3 bg-blue-50/30">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Label</label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. Morning block"
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Start</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">End</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Days</label>
                  <div className="flex gap-1">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`px-2 py-0.5 rounded text-xs transition-colors ${
                          form.days.includes(d)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <Toggle value={form.active} onChange={(v) => setForm({ ...form, active: v })} />
                    Active
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setForm(null); setEditingId(null) }}
                      className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitPeriod}
                      disabled={form.days.length === 0}
                      className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-md"
                    >
                      {editingId !== null ? 'Save' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setEditingId(null); setForm(emptyForm()) }}
                className="w-full border border-dashed border-gray-200 rounded-lg py-2 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors"
              >
                + Add period
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
