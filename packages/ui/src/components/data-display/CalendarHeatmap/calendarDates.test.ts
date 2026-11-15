import { describe, expect, it } from 'vitest'
import { MONTHS, WEEKDAYS, dayFromParts, formatDay, longDay, parseDay, partsOf, rowOf, weekdayRow } from './calendarDates'

describe('dayFromParts', () => {
  it('numbers days from 1970-01-01', () => {
    expect(dayFromParts(1970, 1, 1)).toBe(0)
    expect(dayFromParts(1970, 1, 2)).toBe(1)
    expect(dayFromParts(1969, 12, 31)).toBe(-1)
    expect(dayFromParts(2025, 3, 3)).toBe(20150)
  })
  it('knows leap years', () => {
    expect(dayFromParts(2024, 2, 29)).not.toBeNull()
    expect(dayFromParts(2000, 2, 29)).not.toBeNull()
    expect(dayFromParts(2025, 2, 29)).toBeNull()
    expect(dayFromParts(1900, 2, 29)).toBeNull()
    expect(dayFromParts(2100, 2, 29)).toBeNull()
  })
  it('rejects dates that do not exist and years out of range', () => {
    for (const [y, mo, d] of [[2025, 2, 30], [2025, 4, 31], [2025, 13, 1], [2025, 0, 1], [2025, 1, 0], [2025, 1, 32], [999, 1, 1], [10000, 1, 1], [2025.5, 1, 1], [Number.NaN, 1, 1]] as const) {
      expect(dayFromParts(y, mo, d), `${y}-${mo}-${d}`).toBeNull()
    }
  })
  it('consecutive days differ by one across a year boundary and a leap day', () => {
    expect(dayFromParts(2025, 1, 1)! - dayFromParts(2024, 12, 31)!).toBe(1)
    expect(dayFromParts(2024, 3, 1)! - dayFromParts(2024, 2, 28)!).toBe(2)
    expect(dayFromParts(2025, 3, 1)! - dayFromParts(2025, 2, 28)!).toBe(1)
  })
})

describe('parseDay', () => {
  it('reads YYYY-MM-DD, with surrounding whitespace', () => {
    expect(parseDay('2025-03-03')).toBe(20150)
    expect(parseDay('  2025-03-03 ')).toBe(20150)
  })
  it('reads only the date part of an ISO date-time, whatever the offset', () => {
    expect(parseDay('2025-03-03T23:59:59Z')).toBe(20150)
    expect(parseDay('2025-03-03T00:00:00+14:00')).toBe(20150)
    expect(parseDay('2025-03-03 10:00')).toBe(20150)
  })
  it('reads the UTC date of a Date', () => {
    expect(parseDay(new Date(Date.UTC(2025, 2, 3, 23, 59)))).toBe(20150)
    expect(parseDay(new Date(Date.UTC(2025, 2, 3)))).toBe(20150)
  })
  it('gives null for anything else', () => {
    for (const bad of [undefined, null, 5, {}, [], '', 'x', '2025-3-3', '2025/03/03', '03-03-2025', '2025-02-30', '2025-13-01', '20250303', new Date(Number.NaN), true]) {
      expect(parseDay(bad), String(bad)).toBeNull()
    }
  })
})

describe('partsOf, formatDay, longDay', () => {
  it('round-trips every day over a leap year and a year boundary', () => {
    const start = dayFromParts(2023, 12, 25)!
    for (let i = 0; i < 400; i++) expect(parseDay(formatDay(start + i))).toBe(start + i)
  })
  it('splits a day into parts', () => {
    expect(partsOf(20150)).toEqual({ year: 2025, month: 3, date: 3, weekday: 1 })
    expect(partsOf(-1)).toEqual({ year: 1969, month: 12, date: 31, weekday: 3 })
  })
  it('formats ISO and long text', () => {
    expect(formatDay(20150)).toBe('2025-03-03')
    expect(formatDay(dayFromParts(1000, 1, 5)!)).toBe('1000-01-05')
    expect(longDay(20150)).toBe('Mon 3 Mar 2025')
    expect(longDay(dayFromParts(2024, 2, 29)!)).toBe('Thu 29 Feb 2024')
  })
  it('has seven weekday and twelve month names', () => {
    expect(WEEKDAYS).toHaveLength(7)
    expect(MONTHS).toHaveLength(12)
  })
})

describe('rowOf and weekdayRow', () => {
  it('puts Sunday first with sun and Monday first with mon', () => {
    const sun = dayFromParts(2025, 3, 2)! // a Sunday
    const mon = sun + 1
    expect(rowOf(sun, 'sun')).toBe(0)
    expect(rowOf(mon, 'sun')).toBe(1)
    expect(rowOf(sun, 'mon')).toBe(6)
    expect(rowOf(mon, 'mon')).toBe(0)
  })
  it('covers all seven rows over a week in both modes, also before 1970', () => {
    for (const ws of ['sun', 'mon'] as const) {
      for (const start of [dayFromParts(2025, 3, 3)!, dayFromParts(1960, 6, 15)!]) {
        expect(new Set(Array.from({ length: 7 }, (_, i) => rowOf(start + i, ws))).size).toBe(7)
      }
    }
    expect(rowOf(-1, 'sun')).toBe(3) // 1969-12-31 was a Wednesday
  })
  it('maps weekdays to rows', () => {
    expect(weekdayRow(1, 'sun')).toBe(1)
    expect(weekdayRow(1, 'mon')).toBe(0)
    expect(weekdayRow(0, 'mon')).toBe(6)
    expect(weekdayRow(5, 'mon')).toBe(4)
  })
})
