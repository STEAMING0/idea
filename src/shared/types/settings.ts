// All user-configurable preferences stored as key-value in the DB
export interface AppSettings {
}

export const DEFAULT_SETTINGS: AppSettings = {
}

// Keys are stored individually so partial updates don't overwrite the whole row
export type SettingKey = keyof AppSettings
export type SettingValue = AppSettings[SettingKey]