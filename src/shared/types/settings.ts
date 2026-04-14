// All user-configurable preferences stored as key-value in the DB
export interface AppSettings {
  autostart: boolean
  snoozeDurationMinutes: number  // how long a snooze defers the prompt
  missedWindowMinutes: number    // how long after period end before auto-skip
  theme: 'light' | 'dark' | 'system'
  notificationSound: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  autostart: true,
  snoozeDurationMinutes: 15,
  missedWindowMinutes: 30,
  theme: 'system',
  notificationSound: true
}

// Keys are stored individually so partial updates don't overwrite the whole row
export type SettingKey = keyof AppSettings
export type SettingValue = AppSettings[SettingKey]