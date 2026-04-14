import type { DayOfWeek } from '../types/period'

// Parse "HH:MM" into { hours, minutes }
export function parseTime(hhmm: string): { hours: number; minutes: number } {
  const parts = hhmm.split(':')
  const hours   = parseInt(parts[0] ?? '0', 10)
  const minutes = parseInt(parts[1] ?? '0', 10)
  return { hours, minutes }
}

// Convert a Date to "HH:MM" in local time
export function toHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// Format "HH:MM" to "9:00 AM" style for display
export function formatTime(hhmm: string): string {
  const { hours, minutes } = parseTime(hhmm)
  const ampm   = hours >= 12 ? 'PM' : 'AM'
  const h12    = hours % 12 === 0 ? 12 : hours % 12
  const mStr   = String(minutes).padStart(2, '0')
  return `${h12}:${mStr} ${ampm}`
}

// Get today's DayOfWeek abbreviation
export function todayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const day = days[new Date().getDay()]
  // getDay() returns 0-6 so this is always defined
  return day!
}

// Returns true if the given "HH:MM" end time was within the last windowMinutes
export function wasRecentlyEnded(endTime: string, windowMinutes: number): boolean {
  const now = new Date()
  const { hours, minutes } = parseTime(endTime)
  const end = new Date(now)
  end.setHours(hours, minutes, 0, 0)
  const diffMs = now.getTime() - end.getTime()
  return diffMs >= 0 && diffMs <= windowMinutes * 60 * 1000
}

// Returns true if now is past the period's end time today
export function isPeriodEndedToday(endTime: string): boolean {
  const now = new Date()
  const { hours, minutes } = parseTime(endTime)
  const end = new Date(now)
  end.setHours(hours, minutes, 0, 0)
  return now >= end
}

// Build a cron expression that fires at HH:MM every day
// The scheduler layer filters by active days itself
export function buildCronExpression(hhmm: string): string {
  const { hours, minutes } = parseTime(hhmm)
  return `${minutes} ${hours} * * *`
}

// Format an ISO 8601 string to a readable date for the log viewer
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}