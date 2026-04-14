export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

// A period is a named time block the user defines (e.g. "Morning 9-12")
export interface Period {
  id: number
  label: string
  startTime: string // "HH:MM" 24h format
  endTime: string   // "HH:MM" 24h format
  days: DayOfWeek[]
  active: boolean
  createdAt: string // ISO 8601
}

// Used when creating — no id or createdAt yet
export type CreatePeriodInput = Omit<Period, 'id' | 'createdAt'>

// All fields optional except id for partial updates
export type UpdatePeriodInput = Partial<Omit<Period, 'id' | 'createdAt'>> & { id: number }