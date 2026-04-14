import type { Entry } from '../types/entry'
import { formatDate, formatTime } from './time'

// Pure serialization — no file I/O here, that happens in the IPC export handler
// Keeping these as pure functions makes them trivially testable

export function entriesToCsv(entries: Entry[]): string {
  const header = 'Date,Period,Start,End,Status,Text'
  const rows = entries.map((e) => {
    const date   = formatDate(e.createdAt)
    const start  = formatTime(e.periodStart)
    const end    = formatTime(e.periodEnd)
    const text   = `"${e.text.replace(/"/g, '""')}"` // escape quotes in CSV
    return `${date},${e.periodLabel},${start},${end},${e.status},${text}`
  })
  return [header, ...rows].join('\n')
}

export function entriesToText(entries: Entry[]): string {
  if(entries.length === 0){
    return 'No journal entries found.'
  }

  const blocks = entries.map((e) => {
    const date  = formatDate(e.createdAt)
    const start = formatTime(e.periodStart)
    const end   = formatTime(e.periodEnd)
    const label = `${date} — ${e.periodLabel} (${start} to ${end})`
    const body  = e.status === 'written' ? e.text : `[${e.status}]`
    return `${label}\n${body}`
  })

  return blocks.join('\n\n---\n\n')
}