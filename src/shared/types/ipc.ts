import type { Period, CreatePeriodInput, UpdatePeriodInput } from './period'
import type { Entry, CreateEntryInput } from './entry'
import type { AppSettings, SettingKey, SettingValue } from './settings'

// Single source of truth for every IPC channel name and its payload/response shape.
// Both main-side handlers and renderer-side callers import from here.
// Changing a type here causes compile errors on both sides — intentional.

export interface IpcChannels {
  // Periods
  'periods:getAll':    { input: void;                  output: Period[] }
  'periods:create':   { input: CreatePeriodInput;      output: Period }
  'periods:update':   { input: UpdatePeriodInput;      output: Period }
  'periods:delete':   { input: { id: number };         output: void }
  'periods:setActive':{ input: { id: number; active: boolean }; output: void }

  // Entries
  'entries:getAll':   { input: { limit?: number; offset?: number }; output: Entry[] }
  'entries:getByPeriod': { input: { periodId: number }; output: Entry[] }
  'entries:create':   { input: CreateEntryInput;       output: Entry }
  'entries:update':   { input: { id: number; text: string }; output: Entry }
  'entries:delete':   { input: { id: number };         output: void }

  // Settings
  'settings:getAll':  { input: void;                   output: AppSettings }
  'settings:set':     { input: { key: SettingKey; value: SettingValue }; output: void }

  // Export
  'export:csv':       { input: { from?: string; to?: string }; output: string } // file path
  'export:text':      { input: { from?: string; to?: string }; output: string } // file path

  // Window/app control (renderer → main)
  'window:close':     { input: void;                   output: void }
  'window:openSettings': { input: void;                output: void }
  'window:openLogViewer':{ input: void;                output: void }

  // Scheduler events (main → renderer, push)
  'notify:periodEnd': { input: { periodId: number; periodLabel: string; start: string; end: string }; output: void }
}

// Utility types so handlers and callers don't repeat themselves
export type IpcChannel = keyof IpcChannels
export type IpcInput<C extends IpcChannel>  = IpcChannels[C]['input']
export type IpcOutput<C extends IpcChannel> = IpcChannels[C]['output']