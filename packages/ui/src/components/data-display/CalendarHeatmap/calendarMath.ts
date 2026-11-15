/**
 * Pure data helpers of CalendarHeatmap: tolerant aggregation of the `data` prop, the visible date range, the week grid,
 * intensity levels and per-month totals. No Vue, no DOM, no current date.
 */
import { isFiniteNumber } from '../_chart/chartMath'
import type { ChartTone } from '../_chart/tones'
import { CALENDAR_RAMP } from './calendarRamp'
import { MONTHS, parseDay, partsOf, rowOf, type WeekStart } from './calendarDates'

export interface CalendarEntry {
  /** `YYYY-MM-DD`, an ISO date-time (only its date part is used) or a `Date` (its UTC date). */
  date: string | Date
  /** Non-negative amount for that day (commits, visits, ...). Entries of the same day are summed. */
  value: number
}

/** Longest range that is drawn; a longer range shows its last `MAX_DAYS` days. */
export const MAX_DAYS = 1830
/** Values are clamped here so sums and ratios never overflow. */
export const MAX_VALUE = 1e15
export const MIN_LEVELS = 3
export const MAX_LEVELS = 7
export const DEFAULT_LEVELS = 5

export interface Aggregated {
  days: Map<number, number>
  /** Entries skipped: not an object, a date that does not exist, a value that is not a finite number >= 0. */
  invalid: number
  min: number | null
  max: number | null
}

/** Sum the entries per day. Never throws. */
export function aggregate(data: unknown): Aggregated {
  const days = new Map<number, number>()
  let invalid = 0
  let min: number | null = null
  let max: number | null = null
  for (const item of Array.isArray(data) ? data : []) {
    const e = typeof item === 'object' && item !== null ? (item as Partial<CalendarEntry>) : null
    const day = e ? parseDay(e.date) : null
    if (day === null || !isFiniteNumber(e!.value) || e!.value < 0) {
      invalid++
      continue
    }
    days.set(day, Math.min(MAX_VALUE, (days.get(day) ?? 0) + Math.min(MAX_VALUE, e!.value)))
    if (min === null || day < min) min = day
    if (max === null || day > max) max = day
  }
  return { days, invalid, min, max }
}

export interface Range {
  start: number
  end: number
  /** True when the range was longer than `MAX_DAYS` and only its last days are kept. */
  capped: boolean
}

/**
 * The visible days. Both `start` and `end` given: that range (swapped when reversed). Only one: the other end is the
 * data's latest (or earliest) day, or 364 days away when the data does not reach that way. Neither: the data's span.
 * `null` when there is nothing to show (no data, no valid start or end).
 */
export function resolveRange(dataMin: number | null, dataMax: number | null, start?: unknown, end?: unknown): Range | null {
  let a = parseDay(start)
  let b = parseDay(end)
  if (a === null && b === null && dataMin === null) return null
  if (a === null) a = dataMin !== null && (b === null || dataMin <= b) ? dataMin : b! - 364
  if (b === null) b = dataMax !== null && dataMax >= a ? dataMax : a
  if (a > b) [a, b] = [b, a]
  let capped = false
  if (b - a + 1 > MAX_DAYS) {
    a = b - MAX_DAYS + 1
    capped = true
  }
  return { start: a, end: b, capped }
}

/** `levels` as an integer from 3 to 7 (not a number: 5). */
export function normalizeLevels(levels: unknown): number {
  if (!isFiniteNumber(levels)) return DEFAULT_LEVELS
  return Math.min(MAX_LEVELS, Math.max(MIN_LEVELS, Math.floor(levels)))
}

/**
 * Intensity of `value`: 0 for no activity, otherwise 1 to `levels` by its share of the domain [lo, hi]. A value below `lo`
 * is level 1, above `hi` the top level; a domain without width puts every positive value on the top level.
 */
export function calendarLevel(value: number | null, lo: number, hi: number, levels: number): number {
  if (value === null || !(value > 0)) return 0
  const n = normalizeLevels(levels)
  if (!(hi > lo)) return n
  const t = (value / 2 - lo / 2) / (hi / 2 - lo / 2)
  return Math.min(n, Math.max(1, Math.ceil(t * n)))
}

export const NO_DATA_CLASS = 'fill-transparent stroke-border forced-colors:stroke-foreground'
export const ZERO_CLASS = 'fill-muted forced-colors:stroke-foreground'

/** Fill class of a level (`0` = no activity) for a tone, spreading `levels` steps over the seven-step ramp. */
export function levelFill(tone: ChartTone, level: number, levels: number): string {
  if (level <= 0) return ZERO_CLASS
  const ramp = CALENDAR_RAMP[tone] ?? CALENDAR_RAMP['chart-1']
  const n = normalizeLevels(levels)
  const lv = Math.min(n, Math.max(1, Math.floor(level)))
  return `${ramp[Math.round(((lv - 1) * (ramp.length - 1)) / (n - 1))]!} forced-colors:stroke-foreground`
}

export interface GridCell {
  day: number
  col: number
  row: number
  value: number | null
}

/** The week grid: one cell per day, weeks as columns and weekdays as rows. */
export function buildGrid(range: Range, days: Map<number, number>, weekStart: WeekStart): { cells: GridCell[]; columns: number } {
  const offset = rowOf(range.start, weekStart)
  const cells: GridCell[] = []
  for (let day = range.start; day <= range.end; day++) {
    cells.push({ day, col: Math.floor((day - range.start + offset) / 7), row: rowOf(day, weekStart), value: days.get(day) ?? null })
  }
  return { cells, columns: Math.floor((range.end - range.start + offset) / 7) + 1 }
}

export interface MonthLabel {
  col: number
  /** `Mar`. */
  name: string
  year: number
  /** True for the first label and every January: these carry the year when there is room. */
  yearHint: boolean
  /** True for the first month when the range starts after its first day. */
  partial: boolean
}

/** One label per month at the column of its first visible day (the first month at column 0). */
export function monthLabels(cells: readonly GridCell[]): MonthLabel[] {
  const out: MonthLabel[] = []
  let current = -1
  for (const c of cells) {
    const p = partsOf(c.day)
    const key = p.year * 12 + p.month
    if (key === current) continue
    current = key
    out.push({ col: c.col, name: MONTHS[p.month - 1]!, year: p.year, yearHint: out.length === 0 || p.month === 1, partial: out.length === 0 && p.date > 1 })
  }
  return out
}

export interface MonthTotals {
  label: string
  total: number
  active: number
  busiest: number
  noData: number
}

/** Totals per calendar month of the range, in order. */
export function monthTotals(cells: readonly GridCell[]): MonthTotals[] {
  const out: MonthTotals[] = []
  let current = -1
  for (const c of cells) {
    const p = partsOf(c.day)
    const key = p.year * 12 + p.month
    if (key !== current) {
      current = key
      out.push({ label: `${MONTHS[p.month - 1]} ${p.year}`, total: 0, active: 0, busiest: 0, noData: 0 })
    }
    const m = out[out.length - 1]!
    if (c.value === null) m.noData++
    else {
      m.total = Math.min(MAX_VALUE, m.total + c.value)
      if (c.value > 0) m.active++
      if (c.value > m.busiest) m.busiest = c.value
    }
  }
  return out
}
