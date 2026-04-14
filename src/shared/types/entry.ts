// The outcome of a period prompt — either written, skipped, or snoozed
export type EntryStatus = 'written' | 'skipped' | 'snoozed'

export interface Entry {
  id: number
  periodId: number
  periodLabel: string  // denormalized so log viewer works even if period is deleted
  periodStart: string  // "HH:MM" snapshot at time of entry
  periodEnd: string    // "HH:MM" snapshot at time of entry
  text: string
  status: EntryStatus
  createdAt: string    // ISO 8601
  snoozeUntil: string | null // ISO 8601, only set when status is 'snoozed'
}

export type CreateEntryInput = Omit<Entry, 'id'>

// Entries are immutable after creation — no UpdateEntryInput by design