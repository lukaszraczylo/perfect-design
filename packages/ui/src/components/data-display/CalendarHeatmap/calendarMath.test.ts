import { describe, expect, it } from 'vitest'
import { CALENDAR_RAMP } from './calendarRamp'
import { dayFromParts, formatDay } from './calendarDates'
import {
  MAX_DAYS, MAX_VALUE, NO_DATA_CLASS, ZERO_CLASS, aggregate, buildGrid, calendarLevel, levelFill, monthLabels, monthTotals, normalizeLevels, resolveRange,
} from './calendarMath'

const d = (y: number, m: number, day: number) => dayFromParts(y, m, day)!

describe('aggregate', () => {
  it('sums entries of the same day and tracks the first and last day', () => {
    const a = aggregate([{ date: '2025-03-05', value: 2 }, { date: '2025-03-03', value: 1 }, { date: '2025-03-05', value: 3 }])
    expect(a.days.get(d(2025, 3, 5))).toBe(5)
    expect(a.days.size).toBe(2)
    expect([a.min, a.max]).toEqual([d(2025, 3, 3), d(2025, 3, 5)])
    expect(a.invalid).toBe(0)
  })
  it('accepts ISO date-times and Date objects', () => {
    const a = aggregate([{ date: '2025-03-03T10:00:00Z', value: 1 }, { date: new Date(Date.UTC(2025, 2, 3)), value: 2 }])
    expect(a.days.get(d(2025, 3, 3))).toBe(3)
  })
  it('counts and skips entries with a bad date, a bad value or no shape', () => {
    const a = aggregate([
      { date: '2025-02-30', value: 1 }, { date: '2025-03-01', value: Number.NaN }, { date: '2025-03-01', value: Infinity }, { date: '2025-03-01', value: -1 },
      { date: '2025-03-01', value: '3' }, { date: 'x', value: 1 }, { value: 1 }, null, 7, 'text', { date: '2025-03-01' }, { date: '2025-03-01', value: 4 },
    ])
    expect(a.invalid).toBe(11)
    expect(a.days.size).toBe(1)
    expect(a.days.get(d(2025, 3, 1))).toBe(4)
  })
  it('keeps zero values (a quiet day is not missing data)', () => {
    expect(aggregate([{ date: '2025-03-01', value: 0 }]).days.get(d(2025, 3, 1))).toBe(0)
  })
  it('returns nothing for a non-array', () => {
    for (const bad of [undefined, null, 'x', 4, {}]) expect(aggregate(bad)).toMatchObject({ invalid: 0, min: null, max: null })
  })
  it('clamps huge values and sums', () => {
    const a = aggregate([{ date: '2025-03-01', value: 1e300 }, { date: '2025-03-01', value: 1e300 }])
    expect(a.days.get(d(2025, 3, 1))).toBe(MAX_VALUE)
  })
  it('is independent of the order of the entries', () => {
    const rows = [{ date: '2025-03-05', value: 2 }, { date: '2025-03-03', value: 1 }, { date: '2025-03-04', value: 9 }]
    expect([...aggregate(rows).days].sort()).toEqual([...aggregate([...rows].reverse()).days].sort())
  })
})

describe('resolveRange', () => {
  const lo = d(2025, 3, 3)
  const hi = d(2025, 3, 20)
  it('is the span of the data without start and end', () => {
    expect(resolveRange(lo, hi)).toEqual({ start: lo, end: hi, capped: false })
  })
  it('uses an explicit start and end, swapping them when reversed', () => {
    expect(resolveRange(lo, hi, '2025-01-01', '2025-02-01')).toEqual({ start: d(2025, 1, 1), end: d(2025, 2, 1), capped: false })
    expect(resolveRange(lo, hi, '2025-02-01', '2025-01-01')).toEqual({ start: d(2025, 1, 1), end: d(2025, 2, 1), capped: false })
  })
  it('fills in the missing end from the data', () => {
    expect(resolveRange(lo, hi, '2025-03-10')).toEqual({ start: d(2025, 3, 10), end: hi, capped: false })
    expect(resolveRange(lo, hi, '2025-06-01')).toEqual({ start: d(2025, 6, 1), end: d(2025, 6, 1), capped: false })
    expect(resolveRange(null, null, '2025-06-01')).toEqual({ start: d(2025, 6, 1), end: d(2025, 6, 1), capped: false })
  })
  it('fills in the missing start from the data, or 364 days before the end', () => {
    expect(resolveRange(lo, hi, undefined, '2025-03-10')).toEqual({ start: lo, end: d(2025, 3, 10), capped: false })
    const r = resolveRange(lo, hi, undefined, '2025-01-01')!
    expect(r.end - r.start).toBe(364)
    expect(formatDay(r.start)).toBe('2024-01-03')
    const none = resolveRange(null, null, undefined, '2025-12-31')!
    expect(none.end - none.start).toBe(364)
  })
  it('is null with no data and no usable start or end', () => {
    expect(resolveRange(null, null)).toBeNull()
    expect(resolveRange(null, null, 'bad', '2025-02-30')).toBeNull()
  })
  it('ignores an unusable start or end when there is data', () => {
    expect(resolveRange(lo, hi, 'bad', 7)).toEqual({ start: lo, end: hi, capped: false })
  })
  it('keeps the last MAX_DAYS days of a longer range and says so', () => {
    const r = resolveRange(null, null, '2000-01-01', '2025-01-01')!
    expect(r.capped).toBe(true)
    expect(r.end).toBe(d(2025, 1, 1))
    expect(r.end - r.start + 1).toBe(MAX_DAYS)
    expect(resolveRange(null, null, '2024-01-01', '2025-01-01')!.capped).toBe(false)
  })
  it('works for a single day', () => {
    expect(resolveRange(lo, lo)).toEqual({ start: lo, end: lo, capped: false })
  })
})

describe('levels', () => {
  it('normalizes to 3..7 with 5 as the fallback', () => {
    expect(normalizeLevels(3)).toBe(3)
    expect(normalizeLevels(7)).toBe(7)
    expect(normalizeLevels(1)).toBe(3)
    expect(normalizeLevels(99)).toBe(7)
    expect(normalizeLevels(4.9)).toBe(4)
    expect(normalizeLevels(-2)).toBe(3)
    for (const bad of [Number.NaN, Infinity, undefined, '5', null]) expect(normalizeLevels(bad)).toBe(5)
  })
  it('calendarLevel: zero and missing are level 0', () => {
    expect(calendarLevel(null, 0, 10, 5)).toBe(0)
    expect(calendarLevel(0, 0, 10, 5)).toBe(0)
    expect(calendarLevel(-3, 0, 10, 5)).toBe(0)
    expect(calendarLevel(Number.NaN, 0, 10, 5)).toBe(0)
  })
  it('calendarLevel: spreads positive values over the levels', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => calendarLevel(v, 0, 10, 5))).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
    expect([1, 5, 10].map((v) => calendarLevel(v, 0, 10, 3))).toEqual([1, 2, 3])
    expect(calendarLevel(10, 0, 10, 7)).toBe(7)
  })
  it('calendarLevel: clamps outside the domain and handles a flat domain', () => {
    expect(calendarLevel(100, 0, 10, 5)).toBe(5)
    expect(calendarLevel(1, 5, 10, 5)).toBe(1)
    expect(calendarLevel(4, 5, 5, 5)).toBe(5)
    expect(calendarLevel(4, 9, 3, 6)).toBe(6)
    expect(calendarLevel(1e308, 0, 1e308, 5)).toBe(5)
  })
  it('levelFill: level 0 is the quiet cell, others come from the ramp', () => {
    expect(levelFill('chart-1', 0, 5)).toBe(ZERO_CLASS)
    expect(levelFill('chart-1', 1, 5)).toContain('fill-chart-1/20')
    expect(levelFill('chart-1', 5, 5)).toContain('fill-chart-1 ')
    expect(levelFill('chart-1', 3, 3)).toContain('fill-chart-1 ')
  })
  it('levelFill: every level count uses distinct, increasing steps of the ramp', () => {
    for (let n = 3; n <= 7; n++) {
      const used = Array.from({ length: n }, (_, i) => levelFill('success', i + 1, n).split(' ')[0]!)
      expect(new Set(used).size).toBe(n)
      expect(used.map((u) => CALENDAR_RAMP.success.indexOf(u))).toEqual([...used.map((u) => CALENDAR_RAMP.success.indexOf(u))].sort((a, b) => a - b))
      expect(used[0]).toBe(CALENDAR_RAMP.success[0])
      expect(used[n - 1]).toBe(CALENDAR_RAMP.success[6])
    }
  })
  it('levelFill: an unknown tone uses chart-1 and out-of-range levels clamp', () => {
    expect(levelFill('nope' as never, 2, 5)).toBe(levelFill('chart-1', 2, 5))
    expect(levelFill('chart-1', 99, 5)).toBe(levelFill('chart-1', 5, 5))
    expect(levelFill('chart-1', -1, 5)).toBe(ZERO_CLASS)
    expect(NO_DATA_CLASS).toContain('fill-transparent')
  })
  it('the ramp has seven literal steps for every tone', () => {
    for (const ramp of Object.values(CALENDAR_RAMP)) {
      expect(ramp).toHaveLength(7)
      expect(new Set(ramp).size).toBe(7)
    }
  })
})

describe('buildGrid', () => {
  const range = { start: d(2025, 3, 3), end: d(2025, 3, 23), capped: false } // Monday to Sunday, three weeks
  it('weeks start on Monday: three full columns', () => {
    const g = buildGrid(range, new Map(), 'mon')
    expect(g.columns).toBe(3)
    expect(g.cells).toHaveLength(21)
    expect(g.cells[0]).toMatchObject({ col: 0, row: 0 })
    expect(g.cells[6]).toMatchObject({ col: 0, row: 6 })
    expect(g.cells[7]).toMatchObject({ col: 1, row: 0 })
    expect(g.cells[20]).toMatchObject({ col: 2, row: 6 })
  })
  it('weeks start on Sunday: the first column is partial and there is a fourth', () => {
    const g = buildGrid(range, new Map(), 'sun')
    expect(g.columns).toBe(4)
    expect(g.cells[0]).toMatchObject({ col: 0, row: 1 })
    expect(g.cells[6]).toMatchObject({ col: 1, row: 0 }) // the Sunday starts the next column
    expect(g.cells[20]).toMatchObject({ col: 3, row: 0 })
  })
  it('puts values on their day and null on days without data', () => {
    const g = buildGrid(range, new Map([[d(2025, 3, 5), 7], [d(2025, 3, 6), 0]]), 'mon')
    expect(g.cells.map((c) => c.value).slice(0, 5)).toEqual([null, null, 7, 0, null])
  })
  it('every day appears once, in order, in the right column over a leap year', () => {
    const r = { start: d(2024, 1, 1), end: d(2024, 12, 31), capped: false }
    for (const ws of ['sun', 'mon'] as const) {
      const g = buildGrid(r, new Map(), ws)
      expect(g.cells).toHaveLength(366)
      expect(new Set(g.cells.map((c) => `${c.col}:${c.row}`)).size).toBe(366)
      expect(g.cells.every((c, i) => i === 0 || c.day === g.cells[i - 1]!.day + 1)).toBe(true)
      expect(g.columns).toBe(Math.max(...g.cells.map((c) => c.col)) + 1)
    }
    expect(buildGrid(r, new Map(), 'mon').columns).toBe(53) // 1 Jan 2024 is a Monday
    expect(buildGrid(r, new Map(), 'sun').columns).toBe(53)
  })
  it('a single day is one column', () => {
    const g = buildGrid({ start: d(2025, 3, 3), end: d(2025, 3, 3), capped: false }, new Map(), 'sun')
    expect(g).toMatchObject({ columns: 1 })
    expect(g.cells).toHaveLength(1)
  })
  it('handles the full cap quickly', () => {
    const t0 = performance.now()
    const g = buildGrid({ start: d(2020, 1, 1), end: d(2020, 1, 1) + MAX_DAYS - 1, capped: false }, new Map(), 'sun')
    expect(g.cells).toHaveLength(MAX_DAYS)
    expect(performance.now() - t0).toBeLessThan(200)
  })
})

describe('monthLabels and monthTotals', () => {
  it('labels each month at the column of its first visible day, flagging the first month and every January for the year', () => {
    const r = { start: d(2024, 11, 20), end: d(2025, 2, 10), capped: false }
    const labels = monthLabels(buildGrid(r, new Map(), 'mon').cells)
    expect(labels.map((l) => [l.name, l.year, l.yearHint])).toEqual([['Nov', 2024, true], ['Dec', 2024, false], ['Jan', 2025, true], ['Feb', 2025, false]])
    expect(labels[0]).toMatchObject({ col: 0, partial: true })
    expect(labels.slice(1).every((l) => !l.partial)).toBe(true)
    expect(labels.map((l) => l.col)).toEqual([...labels.map((l) => l.col)].sort((a, b) => a - b))
  })
  it('a range that starts on the first of a month is not partial', () => {
    const labels = monthLabels(buildGrid({ start: d(2025, 3, 1), end: d(2025, 3, 31), capped: false }, new Map(), 'sun').cells)
    expect(labels).toEqual([{ col: 0, name: 'Mar', year: 2025, yearHint: true, partial: false }])
  })
  it('totals per month: sum, active days, busiest day and days without data', () => {
    const r = { start: d(2025, 1, 30), end: d(2025, 2, 2), capped: false }
    const days = new Map([[d(2025, 1, 30), 4], [d(2025, 1, 31), 0], [d(2025, 2, 1), 9]])
    expect(monthTotals(buildGrid(r, days, 'sun').cells)).toEqual([
      { label: 'Jan 2025', total: 4, active: 1, busiest: 4, noData: 0 },
      { label: 'Feb 2025', total: 9, active: 1, busiest: 9, noData: 1 },
    ])
  })
  it('a leap February has 29 days', () => {
    const totals = monthTotals(buildGrid({ start: d(2024, 2, 1), end: d(2024, 2, 29), capped: false }, new Map(), 'sun').cells)
    expect(totals).toEqual([{ label: 'Feb 2024', total: 0, active: 0, busiest: 0, noData: 29 }])
  })
})
