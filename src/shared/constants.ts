export const APP_NAME = 'computerjournal'

// Window names — used as keys in WindowManager to prevent duplicates
export const WINDOW_QUICK_ENTRY = 'quick-entry'
export const WINDOW_SETTINGS    = 'settings'
export const WINDOW_LOG_VIEWER  = 'log-viewer'

// How often the scheduler polls to check for missed periods on startup (ms)
export const MISSED_PERIOD_LOOKBACK_HOURS = 24

// SQLite journal mode — WAL is safer under concurrent reads
export const DB_JOURNAL_MODE = 'WAL'

// Schema version key stored in settings table
export const SCHEMA_VERSION_KEY = '__schema_version__'