/**
 * Pure, dependency-free date maths for Calendar / DatePicker / DateRangePicker.
 *
 * Model: a "day" is a local calendar date (year, month, day). Every Date returned here is that day at local
 * midnight. Comparison and arithmetic work on calendar fields or on a UTC day number, never on 24h millisecond
 * offsets, so DST transitions (23h/25h days) and leap years cannot shift a result. Invalid input never throws:
 * helpers return `null`, an Invalid Date, or `false` as documented per function.
 */

/** Inclusive range of days; `start <= end` always (normalised). */
export interface CalendarRange {
  start: Date
  end: Date
}

export type CalendarMode = 'single' | 'range' | 'multiple'

/** v-model shape: `Date | null` (single), `{ start, end } | null` (range), `Date[]` (multiple). */
export type CalendarValue = Date | CalendarRange | Date[] | null

export interface CalendarBounds {
  min?: Date | null
  max?: Date | null
  /** Extra predicate; return true to disable the day. Receives a fresh copy. */
  isDisabled?: ((date: Date) => boolean) | null
}

const MS_DAY = 86_400_000

export function isValidDate(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]' && !Number.isNaN((value as Date).getTime())
}

/** Local midnight of the given calendar day. Years 0-99 are honoured literally (not mapped to 1900-1999). */
export function createDate(year: number, month: number, day: number): Date {
  const d = new Date(2000, 0, 1)
  d.setFullYear(year, month, day)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Copy with the time stripped. Invalid input yields an Invalid Date. */
export function startOfDay(d: Date): Date {
  return createDate(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Whole days since 1970-01-01 for the calendar day (UTC arithmetic, DST proof). NaN when invalid. */
export function dayNumber(d: Date): number {
  const u = new Date(0)
  u.setUTCFullYear(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round(u.getTime() / MS_DAY)
}

/** Negative when a is before b, 0 when same calendar day, positive when after. NaN when either is invalid. */
export function compareDays(a: Date, b: Date): number {
  return dayNumber(a) - dayNumber(b)
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return isValidDate(a) && isValidDate(b) && compareDays(a, b) === 0
}

/** Month counter used to compare months: year * 12 + month. */
export function monthIndex(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth()
}

export function isSameMonth(a: Date, b: Date): boolean {
  return monthIndex(a) === monthIndex(b)
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** Days in `month` (0-11, overflow/negative months roll the year). NaN for non-finite input. */
export function daysInMonth(year: number, month: number): number {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return Number.NaN
  const total = year * 12 + Math.trunc(month)
  const y = Math.floor(total / 12)
  const m = total - y * 12
  return m === 1 && isLeapYear(y) ? 29 : MONTH_LENGTHS[m]
}

/** Add whole days (fractions truncated). Calendar-field arithmetic, so DST days are never skipped or doubled. */
export function addDays(d: Date, n: number): Date {
  return createDate(d.getFullYear(), d.getMonth(), d.getDate() + Math.trunc(n))
}

/** Add months, clamping the day (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(d: Date, n: number): Date {
  const total = d.getFullYear() * 12 + d.getMonth() + Math.trunc(n)
  const year = Math.floor(total / 12)
  const month = total - year * 12
  return createDate(year, month, Math.min(d.getDate(), daysInMonth(year, month)))
}

/** Add years (Feb 29 becomes Feb 28 in non-leap years). */
export function addYears(d: Date, n: number): Date {
  return addMonths(d, Math.trunc(n) * 12)
}

export function startOfMonth(d: Date): Date {
  return createDate(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date): Date {
  return createDate(d.getFullYear(), d.getMonth() + 1, 0)
}

/** First day of the week containing `d`. `weekStart`: 0 = Sunday ... 6 = Saturday. */
export function startOfWeek(d: Date, weekStart = 0): Date {
  return addDays(d, -((d.getDay() - weekStart + 7) % 7))
}

export function endOfWeek(d: Date, weekStart = 0): Date {
  return addDays(startOfWeek(d, weekStart), 6)
}

/** Integer 0-6 or `fallback` (NaN, fractions, out of range, non-numbers fall back). */
export function normalizeWeekStart(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6 ? value : fallback
}

interface WeekInfoLocale {
  getWeekInfo?: () => { firstDay: number }
  weekInfo?: { firstDay: number }
}

/** First day of week for a locale via Intl.Locale (0 = Sunday); 0 when the runtime cannot tell. */
export function localeWeekStart(locale?: string): number {
  try {
    const l = new Intl.Locale(locale || new Intl.DateTimeFormat().resolvedOptions().locale) as unknown as WeekInfoLocale
    const info = l.getWeekInfo?.() ?? l.weekInfo
    if (info && Number.isInteger(info.firstDay)) return info.firstDay % 7
  } catch {
    /* invalid locale tag: fall through */
  }
  return 0
}

/** Weeks (rows of 7) for a month; days outside the month are `null`. 4-6 rows. */
export function getMonthGrid(year: number, month: number, weekStart = 0): (Date | null)[][] {
  const first = createDate(year, month, 1)
  const lead = (first.getDay() - weekStart + 7) % 7
  const total = daysInMonth(year, month)
  const rows = Math.ceil((lead + total) / 7)
  const weeks: (Date | null)[][] = []
  for (let r = 0; r < rows; r++) {
    const week: (Date | null)[] = []
    for (let c = 0; c < 7; c++) {
      const n = r * 7 + c - lead + 1
      week.push(n < 1 || n > total ? null : createDate(year, month, n))
    }
    weeks.push(week)
  }
  return weeks
}

/** `YYYY-MM-DD` of the local calendar day; '' for invalid dates. */
export function formatISODate(d: Date): string {
  if (!isValidDate(d)) return ''
  const y = d.getFullYear()
  const ys = y < 0 ? `-${String(-y).padStart(6, '0')}` : String(y).padStart(4, '0')
  return `${ys}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Valid `min`/`max` as day-start copies; swapped when reversed so min <= max. */
export function resolveBounds(min?: unknown, max?: unknown): { min: Date | null; max: Date | null } {
  let lo = isValidDate(min) ? startOfDay(min) : null
  let hi = isValidDate(max) ? startOfDay(max) : null
  if (lo && hi && compareDays(lo, hi) > 0) [lo, hi] = [hi, lo]
  return { min: lo, max: hi }
}

/** Clamp a day into [min, max] (either optional). Returns a day-start copy. */
export function clampDate(d: Date, min?: unknown, max?: unknown): Date {
  const { min: lo, max: hi } = resolveBounds(min, max)
  const day = startOfDay(d)
  if (lo && compareDays(day, lo) < 0) return lo
  if (hi && compareDays(day, hi) > 0) return hi
  return day
}

/** True when the day is outside min/max or the predicate says so. Invalid dates are always disabled. */
export function isDateDisabled(d: Date, bounds: CalendarBounds = {}): boolean {
  if (!isValidDate(d)) return true
  const { min, max } = resolveBounds(bounds.min, bounds.max)
  if (min && compareDays(d, min) < 0) return true
  if (max && compareDays(d, max) > 0) return true
  return !!bounds.isDisabled && !!bounds.isDisabled(startOfDay(d))
}

/** Order two days into a range (reversed input is swapped). `null` when either is invalid. */
export function normalizeRange(a: unknown, b: unknown): CalendarRange | null {
  if (!isValidDate(a) || !isValidDate(b)) return null
  const x = startOfDay(a)
  const y = startOfDay(b)
  return compareDays(x, y) <= 0 ? { start: x, end: y } : { start: y, end: x }
}

/** Any `{ start, end }`-like value to a normalised range, else null. */
export function toRange(value: unknown): CalendarRange | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { start?: unknown; end?: unknown }
  return normalizeRange(v.start, v.end)
}

/** A valid Date to its day-start copy, else null. */
export function toSingle(value: unknown): Date | null {
  return isValidDate(value) ? startOfDay(value) : null
}

/** Array of dates to valid, de-duplicated (by day), ascending day-start copies. Non-arrays give []. */
export function toDateList(value: unknown): Date[] {
  if (!Array.isArray(value)) return []
  const seen = new Map<number, Date>()
  for (const item of value) {
    if (!isValidDate(item)) continue
    const day = startOfDay(item)
    seen.set(dayNumber(day), day)
  }
  return [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([, d]) => d)
}

/** Add the day to the list or remove it when present. Result is sorted and de-duplicated. */
export function toggleDay(list: Date[], d: Date): Date[] {
  const n = dayNumber(d)
  const base = toDateList(list)
  return base.some((x) => dayNumber(x) === n) ? base.filter((x) => dayNumber(x) !== n) : toDateList([...base, d])
}

/** Inclusive membership; the range is normalised first so reversed ranges work. */
export function isDayInRange(d: Date, range: { start: Date; end: Date } | null | undefined): boolean {
  const r = range ? normalizeRange(range.start, range.end) : null
  if (!r || !isValidDate(d)) return false
  return compareDays(d, r.start) >= 0 && compareDays(d, r.end) <= 0
}

/** ISO 8601 week number (1-53) of the week containing `d`. */
export function isoWeekNumber(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1)
  return Math.ceil(((t.getTime() - yearStart) / 86400000 + 1) / 7)
}

export interface CalendarWeekday {
  short: string
  long: string
}

export interface CalendarFormatters {
  /** "February 2024" */
  monthYear: (d: Date) => string
  /** Seven weekday names starting at `weekStart`. */
  weekdays: (weekStart: number) => CalendarWeekday[]
  /** Day-of-month in the locale's numerals. */
  dayNumber: (n: number) => string
  /** "Thursday, February 29, 2024" */
  fullDate: (d: Date) => string
}

/** Intl.DateTimeFormat that never throws: bad locale or options degrade to the runtime default. */
export function safeDateTimeFormat(locale: string | undefined, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const attempts: [string | undefined, Intl.DateTimeFormatOptions | undefined][] = [
    [locale, options],
    [undefined, options],
    [undefined, undefined],
  ]
  let last: unknown
  for (const [l, o] of attempts) {
    try {
      return new Intl.DateTimeFormat(l || undefined, o)
    } catch (e) {
      last = e
    }
  }
  throw last
}

/** Format a day with Intl. Invalid dates give ''. Bad locale/options fall back to the runtime default. */
export function formatDateIntl(d: Date, locale?: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  return isValidDate(d) ? safeDateTimeFormat(locale, options).format(d) : ''
}

/** Build the Intl formatters once per locale (constructing them per cell is slow). */
export function createCalendarFormatters(locale?: string): CalendarFormatters {
  const monthYear = safeDateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const full = safeDateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const short = safeDateTimeFormat(locale, { weekday: 'short' })
  const long = safeDateTimeFormat(locale, { weekday: 'long' })
  let numbers: Intl.NumberFormat
  try {
    numbers = new Intl.NumberFormat(locale || undefined, { useGrouping: false })
  } catch {
    numbers = new Intl.NumberFormat(undefined, { useGrouping: false })
  }
  return {
    monthYear: (d) => (isValidDate(d) ? monthYear.format(d) : ''),
    fullDate: (d) => (isValidDate(d) ? full.format(d) : ''),
    dayNumber: (n) => numbers.format(n),
    weekdays: (weekStart) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = createDate(2023, 0, 1 + ((weekStart + i) % 7)) // 2023-01-01 is a Sunday
        return { short: short.format(d), long: long.format(d) }
      }),
  }
}
