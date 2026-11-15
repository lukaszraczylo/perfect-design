/**
 * Calendar-day maths for CalendarHeatmap. A day is the integer number of days since 1970-01-01 in UTC, so nothing here
 * depends on the time zone, the current date or the locale: the same input always gives the same grid (server and browser).
 */
export type WeekStart = 'sun' | 'mon'

const DAY_MS = 86_400_000
const MIN_YEAR = 1000
const MAX_YEAR = 9999

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** The day for a calendar date (`month` 1 to 12), or `null` when that date does not exist (31 Feb, year out of range). */
export function dayFromParts(year: number, month: number, date: number): number | null {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) return null
  const t = Date.UTC(year, month - 1, date)
  const d = new Date(t)
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== date) return null
  return Math.floor(t / DAY_MS)
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/

/**
 * Day of a `YYYY-MM-DD` string (an ISO date-time is read up to its date part, the time and offset are ignored) or of a
 * `Date` (its UTC date). Anything else, and impossible dates, give `null`.
 */
export function parseDay(value: unknown): number | null {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null
    return dayFromParts(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate())
  }
  if (typeof value !== 'string') return null
  const m = ISO.exec(value.trim())
  return m ? dayFromParts(Number(m[1]), Number(m[2]), Number(m[3])) : null
}

export interface DayParts {
  year: number
  /** 1 to 12. */
  month: number
  date: number
  /** 0 = Sunday. */
  weekday: number
}

export function partsOf(day: number): DayParts {
  const d = new Date(day * DAY_MS)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, date: d.getUTCDate(), weekday: d.getUTCDay() }
}

const pad = (n: number, width: number) => String(n).padStart(width, '0')

export function formatDay(day: number): string {
  const p = partsOf(day)
  return `${pad(p.year, 4)}-${pad(p.month, 2)}-${pad(p.date, 2)}`
}

/** `Mon 3 Mar 2025`. */
export function longDay(day: number): string {
  const p = partsOf(day)
  return `${WEEKDAYS[p.weekday]} ${p.date} ${MONTHS[p.month - 1]} ${p.year}`
}

/** Row of a day in the grid: with `sun` Sunday is row 0, with `mon` Monday is row 0. */
export function rowOf(day: number, weekStart: WeekStart): number {
  const weekday = (((day + 4) % 7) + 7) % 7 // 1970-01-01 was a Thursday
  return weekStart === 'mon' ? (weekday + 6) % 7 : weekday
}

/** Row of each weekday label for `weekStart`. */
export function weekdayRow(weekday: number, weekStart: WeekStart): number {
  return weekStart === 'mon' ? (weekday + 6) % 7 : weekday
}
