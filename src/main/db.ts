import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import { DB_JOURNAL_MODE, SCHEMA_VERSION_KEY } from '@shared/constants'
import { DEFAULT_SETTINGS } from '@shared/types/settings'
import type { Period, CreatePeriodInput, UpdatePeriodInput } from '@shared/types/period'
import type { Entry, CreateEntryInput } from '@shared/types/entry'
import type { AppSettings, SettingKey, SettingValue } from '@shared/types/settings'

let db: Database.Database

export function initDb(): void {
  const dbPath = path.join(app.getPath('userData'), 'journal.db')
  db = new Database(dbPath)
  db.pragma(`journal_mode = ${DB_JOURNAL_MODE}`)
  createSchema()
  seedSettings()
}

function createSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS periods (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      label     TEXT    NOT NULL,
      startTime TEXT    NOT NULL,
      endTime   TEXT    NOT NULL,
      days      TEXT    NOT NULL,
      active    INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT    NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      periodId    INTEGER NOT NULL,
      periodLabel TEXT    NOT NULL,
      periodStart TEXT    NOT NULL,
      periodEnd   TEXT    NOT NULL,
      text        TEXT    NOT NULL DEFAULT '',
      status      TEXT    NOT NULL DEFAULT 'written',
      createdAt   TEXT    NOT NULL,
      snoozeUntil TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

function seedSettings(): void {
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  const seed = db.transaction(() => {
    for(const [key, value] of Object.entries(DEFAULT_SETTINGS)){
      insert.run(key, JSON.stringify(value))
    }
    insert.run(SCHEMA_VERSION_KEY, JSON.stringify(1))
  })
  seed()
}

// ---- Periods ----

type PeriodRow = {
  id: number
  label: string
  startTime: string
  endTime: string
  days: string
  active: number
  createdAt: string
}

function rowToPeriod(row: PeriodRow): Period {
  return {
    id: row.id,
    label: row.label,
    startTime: row.startTime,
    endTime: row.endTime,
    days: JSON.parse(row.days),
    active: row.active === 1,
    createdAt: row.createdAt
  }
}

export function getAllPeriods(): Period[] {
  const rows = db.prepare('SELECT * FROM periods ORDER BY startTime').all() as PeriodRow[]
  return rows.map(rowToPeriod)
}

export function createPeriod(input: CreatePeriodInput): Period {
  const createdAt = new Date().toISOString()
  const result = db.prepare(`
    INSERT INTO periods (label, startTime, endTime, days, active, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(input.label, input.startTime, input.endTime, JSON.stringify(input.days), input.active ? 1 : 0, createdAt)
  const row = db.prepare('SELECT * FROM periods WHERE id = ?').get(result.lastInsertRowid) as PeriodRow
  return rowToPeriod(row)
}

export function updatePeriod(input: UpdatePeriodInput): Period {
  const existing = db.prepare('SELECT * FROM periods WHERE id = ?').get(input.id) as PeriodRow | undefined
  if(!existing) throw new Error(`Period ${input.id} not found`)
  const merged = {
    label:     input.label     ?? existing.label,
    startTime: input.startTime ?? existing.startTime,
    endTime:   input.endTime   ?? existing.endTime,
    days:      input.days !== undefined ? JSON.stringify(input.days) : existing.days,
    active:    input.active !== undefined ? (input.active ? 1 : 0) : existing.active
  }
  db.prepare(`
    UPDATE periods SET label=?, startTime=?, endTime=?, days=?, active=? WHERE id=?
  `).run(merged.label, merged.startTime, merged.endTime, merged.days, merged.active, input.id)
  const row = db.prepare('SELECT * FROM periods WHERE id = ?').get(input.id) as PeriodRow
  return rowToPeriod(row)
}

export function deletePeriod(id: number): void {
  db.prepare('DELETE FROM periods WHERE id = ?').run(id)
}

export function setPeriodActive(id: number, active: boolean): void {
  db.prepare('UPDATE periods SET active = ? WHERE id = ?').run(active ? 1 : 0, id)
}

// ---- Entries ----

type EntryRow = {
  id: number
  periodId: number
  periodLabel: string
  periodStart: string
  periodEnd: string
  text: string
  status: string
  createdAt: string
}

function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    periodId: row.periodId,
    periodLabel: row.periodLabel,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    text: row.text,
    status: row.status as Entry['status'],
    createdAt: row.createdAt
  }
}

export function getAllEntries(limit?: number, offset?: number): Entry[] {
  let sql = 'SELECT * FROM entries ORDER BY createdAt DESC'
  const params: number[] = []
  if(limit !== undefined){
    sql += ' LIMIT ?'
    params.push(limit)
    if(offset !== undefined){
      sql += ' OFFSET ?'
      params.push(offset)
    }
  }
  const rows = db.prepare(sql).all(...params) as EntryRow[]
  return rows.map(rowToEntry)
}

export function getEntriesByPeriod(periodId: number): Entry[] {
  const rows = db.prepare(
    'SELECT * FROM entries WHERE periodId = ? ORDER BY createdAt DESC'
  ).all(periodId) as EntryRow[]
  return rows.map(rowToEntry)
}

export function createEntry(input: CreateEntryInput): Entry {
  const result = db.prepare(`
    INSERT INTO entries (periodId, periodLabel, periodStart, periodEnd, text, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.periodId, input.periodLabel, input.periodStart, input.periodEnd,
    input.text, input.status, input.createdAt
  )
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(result.lastInsertRowid) as EntryRow
  return rowToEntry(row)
}

export function updateEntry(id: number, text: string): Entry {
  db.prepare('UPDATE entries SET text = ? WHERE id = ?').run(text, id)
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(id) as EntryRow
  return rowToEntry(row)
}

export function deleteEntry(id: number): void {
  db.prepare('DELETE FROM entries WHERE id = ?').run(id)
}

export function getEntriesForExport(from?: string, to?: string): Entry[] {
  if(from && to){
    return (db.prepare(
      'SELECT * FROM entries WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt ASC'
    ).all(from, to) as EntryRow[]).map(rowToEntry)
  }
  if(from){
    return (db.prepare(
      'SELECT * FROM entries WHERE createdAt >= ? ORDER BY createdAt ASC'
    ).all(from) as EntryRow[]).map(rowToEntry)
  }
  if(to){
    return (db.prepare(
      'SELECT * FROM entries WHERE createdAt <= ? ORDER BY createdAt ASC'
    ).all(to) as EntryRow[]).map(rowToEntry)
  }
  return (db.prepare('SELECT * FROM entries ORDER BY createdAt ASC').all() as EntryRow[]).map(rowToEntry)
}

// ---- Settings ----

type SettingRow = { key: string; value: string }

export function getAllSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as SettingRow[]
  const map: Record<string, unknown> = {}
  for(const row of rows){
    if(row.key !== SCHEMA_VERSION_KEY){
      map[row.key] = JSON.parse(row.value)
    }
  }
  return map as AppSettings
}

export function setSetting(key: SettingKey, value: SettingValue): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value))
}
