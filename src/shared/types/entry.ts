export type EntryStatus = 'written' | 'skipped'

export interface Entry {
  id: number
  periodId: number
  periodLabel: string  // denormalized so log viewer works even if period is deleted
  periodStart: string  // "HH:MM" snapshot at time of entry
  periodEnd: string    // "HH:MM" snapshot at time of entry
  text: string
  status: EntryStatus
  createdAt: string    // ISO 8601
}

export type CreateEntryInput = Omit<Entry, 'id'>

// Entries are immutable after creation — no UpdateEntryInput by design