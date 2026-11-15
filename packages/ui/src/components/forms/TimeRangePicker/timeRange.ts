/**
 * Pure helpers for TimeRangePicker. Instants are epoch milliseconds, the value on the wire is an ISO 8601 string in UTC.
 * Time zones use `Intl.DateTimeFormat` only: the zone name is validated by constructing a formatter, wall-clock parts come
 * from `formatToParts`, and wall time to instant uses the offsets on both sides of the day so a DST gap or overlap resolves
 * the same way everywhere (gap: the clock moves forward; overlap: the first occurrence).
 */
import { createDate } from '../Calendar/dateMath'
import { parseTimeInput } from '../TimeInput/time'

/** v-model: UTC ISO 8601 strings (`2024-05-01T10:00:00.000Z`), `from <= to`. */
export interface TimeRangeValue {
  from: string
  to: string
}

export const TIME_RANGE_PRESET_IDS = ['last-15-minutes', 'last-30-minutes', 'last-1-hour', 'last-6-hours', 'last-24-hours', 'last-7-days', 'last-30-days', 'today', 'yesterday', 'custom'] as const
export type TimeRangePresetId = (typeof TIME_RANGE_PRESET_IDS)[number]

export const TIME_RANGE_PRESET_LABELS: Record<TimeRangePresetId, string> = {
  'last-15-minutes': 'Last 15 minutes',
  'last-30-minutes': 'Last 30 minutes',
  'last-1-hour': 'Last hour',
  'last-6-hours': 'Last 6 hours',
  'last-24-hours': 'Last 24 hours',
  'last-7-days': 'Last 7 days',
  'last-30-days': 'Last 30 days',
  today: 'Today',
  yesterday: 'Yesterday',
  custom: 'Custom range',
}

export type TimeRangeReason = 'incomplete' | 'order' | 'min' | 'max'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
/** Elapsed length of the relative presets. A "day" is 24 elapsed hours, so a range that spans a DST change is 23 or 25 wall-clock hours long. */
const RELATIVE_MS: Partial<Record<TimeRangePresetId, number>> = {
  'last-15-minutes': 15 * MINUTE,
  'last-30-minutes': 30 * MINUTE,
  'last-1-hour': HOUR,
  'last-6-hours': 6 * HOUR,
  'last-24-hours': DAY,
  'last-7-days': 7 * DAY,
  'last-30-days': 30 * DAY,
}

export const MIN_YEAR = 1000
export const MAX_YEAR = 9999
export const MIN_INSTANT = Date.UTC(MIN_YEAR, 0, 1)
export const MAX_INSTANT = Date.UTC(MAX_YEAR, 11, 31, 23, 59, 59, 999)
/** Longest string that is parsed; anything longer is rejected before a regular expression sees it. */
export const MAX_INPUT_LENGTH = 64
const MAX_ZONE_LENGTH = 100

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[Tt ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?(Z|z|[+-]\d{2}(?::?\d{2})?)?)?$/

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const daysIn = (y: number, m: number) => (m === 2 ? (isLeap(y) ? 29 : 28) : m === 4 || m === 6 || m === 9 || m === 11 ? 30 : 31)

const inRange = (ms: number) => Number.isFinite(ms) && ms >= MIN_INSTANT && ms <= MAX_INSTANT

/**
 * Epoch milliseconds of a value, or null. Accepts a valid `Date`, a finite number of milliseconds, or a strict ISO 8601 string
 * (`2024-05-01`, `2024-05-01T10:00`, `2024-05-01T10:00:00.123Z`, `...+02:00`). A string without an offset is UTC. Years outside
 * 1000..9999, impossible dates (`2024-02-30`), `24:00`, and strings over 64 characters give null.
 */
export function toInstant(value: unknown): number | null {
  if (value instanceof Date) return inRange(value.getTime()) ? value.getTime() : null
  if (typeof value === 'number') return inRange(value) ? value : null
  if (typeof value !== 'string' || value.length > MAX_INPUT_LENGTH) return null
  const m = ISO.exec(value.trim())
  if (!m) return null
  const [year, month, day, hour, minute, second] = [m[1], m[2], m[3], m[4] ?? '0', m[5] ?? '0', m[6] ?? '0'].map(Number)
  if (year < MIN_YEAR || month < 1 || month > 12 || day < 1 || day > daysIn(year, month) || hour > 23 || minute > 59 || second > 59) return null
  const ms = m[7] ? Number(m[7].padEnd(3, '0').slice(0, 3)) : 0
  let offset = 0
  const zone = m[8]
  if (zone && zone.toUpperCase() !== 'Z') {
    const digits = zone.replace(':', '')
    const oh = Number(digits.slice(1, 3))
    const om = digits.length > 3 ? Number(digits.slice(3, 5)) : 0
    if (oh > 23 || om > 59) return null
    offset = (zone[0] === '-' ? -1 : 1) * (oh * HOUR + om * MINUTE)
  }
  const t = Date.UTC(year, month - 1, day, hour, minute, second, ms) - offset
  return inRange(t) ? t : null
}

/** Canonical UTC ISO string of an instant. */
export const toIso = (ms: number): string => new Date(ms).toISOString()

/** `{ from, to }` of a v-model value as instants, or null when either end is not a valid date. A reversed range is returned as it is. */
export function parseRange(value: unknown): { from: number; to: number } | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { from?: unknown; to?: unknown }
  const from = toInstant(v.from)
  const to = toInstant(v.to)
  return from === null || to === null ? null : { from, to }
}

// --- time zones -------------------------------------------------------------------------------------------------------------

const formats = new Map<string, Intl.DateTimeFormat>()

/** True for an IANA zone name (or any other name the runtime's Intl accepts). Never throws. */
export function isValidTimeZone(zone: unknown): zone is string {
  if (typeof zone !== 'string' || !zone.trim() || zone.length > MAX_ZONE_LENGTH) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone })
    return true
  } catch {
    return false
  }
}

/** The zone name Intl resolves (`utc` becomes `UTC`); anything invalid becomes `UTC`. */
export function normalizeTimeZone(zone: unknown): string {
  if (!isValidTimeZone(zone)) return 'UTC'
  return new Intl.DateTimeFormat('en-US', { timeZone: zone }).resolvedOptions().timeZone
}

function partsFormat(zone: string): Intl.DateTimeFormat {
  let f = formats.get(zone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    formats.set(zone, f)
  }
  return f
}

export interface WallParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/** Wall-clock parts of an instant in a zone (a normalised zone name). */
export function wallParts(ms: number, zone: string): WallParts {
  const out: Record<string, number> = {}
  for (const p of partsFormat(zone).formatToParts(ms)) if (p.type !== 'literal') out[p.type] = Number(p.value)
  return { year: out.year, month: out.month, day: out.day, hour: out.hour % 24, minute: out.minute, second: out.second }
}

/** Offset of a zone from UTC at an instant, in ms (positive east of Greenwich). Includes seconds, which old zone rules have. */
function offsetAt(ms: number, zone: string): number {
  const p = wallParts(ms, zone)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000
}

/**
 * Instant of a wall-clock time in a zone. A time that does not exist (spring forward, or a skipped day such as Samoa on
 * 2011-12-30) resolves forward, using the offset from before the change. A time that happens twice (fall back) resolves to the
 * first occurrence.
 */
export function zonedToInstant(year: number, month: number, day: number, hour: number, minute: number, zone: string): number {
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const before = offsetAt(wall - DAY, zone)
  const after = offsetAt(wall + DAY, zone)
  const valid = [before, after]
    .filter((o, i, all) => all.indexOf(o) === i)
    .map((o) => wall - o)
    .filter((t) => offsetAt(t, zone) === wall - t)
  return valid.length ? Math.min(...valid) : wall - before
}

export interface Draft {
  /** `YYYY-MM-DD` or ''. */
  date: string
  /** `HH:mm` or ''. */
  time: string
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

/** Date and time strings of an instant, in a zone. */
export function instantToDraft(ms: number, zone: string): Draft {
  const p = wallParts(ms, zone)
  return { date: `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` }
}

/** Instant of a `YYYY-MM-DD` date and `HH:mm` time read in a zone; null when either is blank, malformed or impossible. */
export function draftToInstant(date: unknown, time: unknown, zone: string): number | null {
  if (typeof date !== 'string' || typeof time !== 'string') return null
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const t = parseTimeInput(time)
  if (!d || !t) return null
  const [year, month, day] = [Number(d[1]), Number(d[2]), Number(d[3])]
  if (year < MIN_YEAR || month < 1 || month > 12 || day < 1 || day > daysIn(year, month)) return null
  const ms = zonedToInstant(year, month, day, t.hour, t.minute, zone)
  return inRange(ms) ? ms : null
}

/** Start of the zone's calendar day that contains `ms`. */
export function startOfZonedDay(ms: number, zone: string): number {
  const p = wallParts(ms, zone)
  return zonedToInstant(p.year, p.month, p.day, 0, 0, zone)
}

// --- presets ----------------------------------------------------------------------------------------------------------------

/**
 * Concrete `{ from, to }` of a preset at the instant `now`. Relative presets (`last-*`) end at `now`; `today` runs from the start
 * of the zone's day to `now`; `yesterday` is the previous whole zone day (so 23 or 25 hours on a DST change). `custom` and
 * unknown ids give null.
 */
export function resolvePreset(id: unknown, now: number, zone: string): { from: number; to: number } | null {
  if (typeof id !== 'string' || !inRange(now)) return null
  const span = RELATIVE_MS[id as TimeRangePresetId]
  if (span !== undefined) return inRange(now - span) ? { from: now - span, to: now } : null
  if (id === 'today') return { from: startOfZonedDay(now, zone), to: now }
  if (id === 'yesterday') {
    const today = startOfZonedDay(now, zone)
    const p = wallParts(now, zone)
    const prev = new Date(Date.UTC(p.year, p.month - 1, p.day - 1))
    const from = zonedToInstant(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate(), 0, 0, zone)
    return inRange(from) ? { from, to: today - 1 } : null
  }
  return null
}

// --- validation and display ---------------------------------------------------------------------------------------------------

/** First problem of a range, or null. `min` and `max` are inclusive instants. A missing end is `incomplete`. */
export function validateRange(from: number | null, to: number | null, min: number | null, max: number | null): TimeRangeReason | null {
  if (from === null || to === null) return 'incomplete'
  if (from > to) return 'order'
  if (min !== null && from < min) return 'min'
  if (max !== null && to > max) return 'max'
  return null
}

export const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }

/** Local-midnight `Date` that carries the calendar day of a `YYYY-MM-DD` string (for `Calendar`); null when malformed or impossible. */
export function dayToDate(date: unknown): Date | null {
  const d = typeof date === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(date) : null
  if (!d) return null
  const [year, month, day] = [Number(d[1]), Number(d[2]), Number(d[3])]
  return year < MIN_YEAR || month < 1 || month > 12 || day < 1 || day > daysIn(year, month) ? null : createDate(year, month - 1, day)
}

/** Formatter in a zone that never throws: a bad locale or bad options fall back, the zone is always kept. */
export function zoneFormat(locale: string | undefined, zone: string, options?: Intl.DateTimeFormatOptions, base: Intl.DateTimeFormatOptions = DEFAULT_FORMAT): Intl.DateTimeFormat {
  const attempts: [string | undefined, Intl.DateTimeFormatOptions][] = [
    [locale, { ...(options ?? base), timeZone: zone }],
    [undefined, { ...(options ?? base), timeZone: zone }],
    [locale, { ...base, timeZone: zone }],
    [undefined, { ...base, timeZone: zone }],
  ]
  for (const [l, o] of attempts) {
    try {
      return new Intl.DateTimeFormat(l || undefined, o)
    } catch {
      /* try the next fallback */
    }
  }
  return new Intl.DateTimeFormat('en-US', { timeZone: zone })
}
