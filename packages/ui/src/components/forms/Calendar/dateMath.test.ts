import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDays,
  createCalendarFormatters,
  createDate,
  dayNumber,
  daysInMonth,
  endOfMonth,
  endOfWeek,
  formatDateIntl,
  formatISODate,
  getMonthGrid,
  isDateDisabled,
  isDayInRange,
  isLeapYear,
  isSameDay,
  isSameMonth,
  isValidDate,
  localeWeekStart,
  monthIndex,
  normalizeRange,
  normalizeWeekStart,
  resolveBounds,
  safeDateTimeFormat,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateList,
  toRange,
  toSingle,
  toggleDay,
} from './dateMath'

const d = (y: number, m: number, day: number) => createDate(y, m - 1, day)
const originalTZ = process.env.TZ

afterEach(() => {
  if (originalTZ === undefined) delete process.env.TZ
  else process.env.TZ = originalTZ
  vi.restoreAllMocks()
})

describe('isValidDate / createDate / startOfDay', () => {
  it('accepts real dates, rejects everything else', () => {
    expect(isValidDate(new Date())).toBe(true)
    expect(isValidDate(new Date('nope'))).toBe(false)
    for (const bad of [null, undefined, 0, NaN, '2024-01-01', {}, [], { getTime: () => 1 }]) expect(isValidDate(bad)).toBe(false)
  })

  it('createDate is local midnight and handles overflow', () => {
    const r = createDate(2024, 0, 32)
    expect([r.getFullYear(), r.getMonth(), r.getDate(), r.getHours(), r.getMinutes()]).toEqual([2024, 1, 1, 0, 0])
    expect(createDate(2024, 12, 1).getFullYear()).toBe(2025)
    expect(createDate(2024, -1, 1).getMonth()).toBe(11)
  })

  it('createDate keeps years 0-99 literal (no 1900 mapping)', () => {
    expect(createDate(99, 0, 1).getFullYear()).toBe(99)
    expect(createDate(0, 0, 1).getFullYear()).toBe(0)
  })

  it('createDate with NaN is invalid', () => {
    expect(isValidDate(createDate(Number.NaN, 0, 1))).toBe(false)
  })

  it('startOfDay strips time and does not mutate input', () => {
    const src = new Date(2024, 4, 5, 23, 59, 59, 999)
    const r = startOfDay(src)
    expect(r.getHours() + r.getMinutes() + r.getSeconds() + r.getMilliseconds()).toBe(0)
    expect(r.getDate()).toBe(5)
    expect(src.getHours()).toBe(23)
    expect(isValidDate(startOfDay(new Date('x')))).toBe(false)
  })
})

describe('day numbers and comparisons', () => {
  it('dayNumber is consecutive across month, year and leap boundaries', () => {
    expect(dayNumber(d(1970, 1, 1))).toBe(0)
    expect(dayNumber(d(2024, 3, 1)) - dayNumber(d(2024, 2, 29))).toBe(1)
    expect(dayNumber(d(2024, 2, 29)) - dayNumber(d(2024, 2, 28))).toBe(1)
    expect(dayNumber(d(2023, 3, 1)) - dayNumber(d(2023, 2, 28))).toBe(1)
    expect(dayNumber(d(2025, 1, 1)) - dayNumber(d(2024, 12, 31))).toBe(1)
    expect(dayNumber(d(1969, 12, 31))).toBe(-1)
  })

  it('dayNumber works for years < 100 and invalid dates', () => {
    expect(dayNumber(createDate(50, 0, 2)) - dayNumber(createDate(50, 0, 1))).toBe(1)
    expect(dayNumber(new Date('x'))).toBeNaN()
  })

  it('compareDays ignores time of day', () => {
    expect(compareDays(new Date(2024, 0, 1, 23, 59), new Date(2024, 0, 1, 0, 0))).toBe(0)
    expect(compareDays(d(2024, 1, 1), d(2024, 1, 2))).toBeLessThan(0)
    expect(compareDays(d(2024, 1, 3), d(2024, 1, 2))).toBeGreaterThan(0)
    expect(compareDays(new Date('x'), d(2024, 1, 1))).toBeNaN()
  })

  it('isSameDay / isSameMonth / monthIndex', () => {
    expect(isSameDay(new Date(2024, 0, 1, 1), new Date(2024, 0, 1, 22))).toBe(true)
    expect(isSameDay(d(2024, 1, 1), d(2024, 1, 2))).toBe(false)
    expect(isSameDay(null, d(2024, 1, 1))).toBe(false)
    expect(isSameDay(undefined, undefined)).toBe(false)
    expect(isSameDay(new Date('x'), new Date('x'))).toBe(false)
    expect(isSameMonth(d(2024, 1, 1), d(2024, 1, 31))).toBe(true)
    expect(isSameMonth(d(2024, 1, 1), d(2025, 1, 1))).toBe(false)
    expect(monthIndex(d(2024, 2, 1))).toBe(2024 * 12 + 1)
  })
})

describe('leap years and month lengths', () => {
  it.each([
    [2024, true],
    [2023, false],
    [1900, false],
    [2000, true],
    [2100, false],
    [0, true],
  ])('isLeapYear(%i) = %s', (y, expected) => expect(isLeapYear(y)).toBe(expected))

  it('daysInMonth handles Feb in leap/non-leap years and all months', () => {
    expect(daysInMonth(2024, 1)).toBe(29)
    expect(daysInMonth(2023, 1)).toBe(28)
    expect(daysInMonth(2024, 0)).toBe(31)
    expect(daysInMonth(2024, 3)).toBe(30)
    expect(daysInMonth(2024, 11)).toBe(31)
  })

  it('daysInMonth rolls overflowing months and rejects non-finite input', () => {
    expect(daysInMonth(2023, 13)).toBe(29) // Feb 2024
    expect(daysInMonth(2024, -1)).toBe(31) // Dec 2023
    expect(daysInMonth(Number.NaN, 1)).toBeNaN()
    expect(daysInMonth(2024, Infinity)).toBeNaN()
  })
})

describe('addDays / addMonths / addYears', () => {
  it('addDays crosses month, year and leap day boundaries', () => {
    expect(formatISODate(addDays(d(2024, 2, 28), 1))).toBe('2024-02-29')
    expect(formatISODate(addDays(d(2024, 2, 29), 1))).toBe('2024-03-01')
    expect(formatISODate(addDays(d(2023, 2, 28), 1))).toBe('2023-03-01')
    expect(formatISODate(addDays(d(2024, 12, 31), 1))).toBe('2025-01-01')
    expect(formatISODate(addDays(d(2024, 1, 1), -1))).toBe('2023-12-31')
    expect(formatISODate(addDays(d(2024, 1, 1), 366))).toBe('2025-01-01')
  })

  it('addDays truncates fractions and returns invalid for NaN / Infinity', () => {
    expect(addDays(d(2024, 1, 1), 1.9).getDate()).toBe(2)
    expect(isValidDate(addDays(d(2024, 1, 1), Number.NaN))).toBe(false)
    expect(isValidDate(addDays(d(2024, 1, 1), Infinity))).toBe(false)
  })

  it('addMonths clamps the day to the target month', () => {
    expect(formatISODate(addMonths(d(2024, 1, 31), 1))).toBe('2024-02-29')
    expect(formatISODate(addMonths(d(2023, 1, 31), 1))).toBe('2023-02-28')
    expect(formatISODate(addMonths(d(2024, 3, 31), -1))).toBe('2024-02-29')
    expect(formatISODate(addMonths(d(2024, 12, 15), 1))).toBe('2025-01-15')
    expect(formatISODate(addMonths(d(2024, 1, 15), -1))).toBe('2023-12-15')
    expect(formatISODate(addMonths(d(2024, 1, 15), 0))).toBe('2024-01-15')
    expect(formatISODate(addMonths(d(2024, 5, 31), 25))).toBe('2026-06-30')
  })

  it('addYears maps Feb 29 to Feb 28 off leap years', () => {
    expect(formatISODate(addYears(d(2024, 2, 29), 1))).toBe('2025-02-28')
    expect(formatISODate(addYears(d(2024, 2, 29), 4))).toBe('2028-02-29')
    expect(formatISODate(addYears(d(2024, 2, 29), -1))).toBe('2023-02-28')
  })

  it('returns invalid for invalid input', () => {
    expect(isValidDate(addMonths(new Date('x'), 1))).toBe(false)
    expect(isValidDate(addMonths(d(2024, 1, 1), Number.NaN))).toBe(false)
  })

  it('does not mutate its input', () => {
    const src = d(2024, 1, 31)
    addDays(src, 5)
    addMonths(src, 1)
    expect(formatISODate(src)).toBe('2024-01-31')
  })
})

describe('month and week boundaries', () => {
  it('startOfMonth / endOfMonth, including leap Feb and December', () => {
    expect(formatISODate(startOfMonth(d(2024, 2, 17)))).toBe('2024-02-01')
    expect(formatISODate(endOfMonth(d(2024, 2, 17)))).toBe('2024-02-29')
    expect(formatISODate(endOfMonth(d(2023, 2, 17)))).toBe('2023-02-28')
    expect(formatISODate(endOfMonth(d(2024, 12, 5)))).toBe('2024-12-31')
  })

  it('startOfWeek / endOfWeek honour weekStart', () => {
    const wed = d(2024, 5, 15) // Wednesday
    expect(formatISODate(startOfWeek(wed, 0))).toBe('2024-05-12')
    expect(formatISODate(startOfWeek(wed, 1))).toBe('2024-05-13')
    expect(formatISODate(startOfWeek(wed, 6))).toBe('2024-05-11')
    expect(formatISODate(startOfWeek(wed))).toBe('2024-05-12')
    expect(formatISODate(endOfWeek(wed, 1))).toBe('2024-05-19')
    expect(formatISODate(endOfWeek(wed))).toBe('2024-05-18')
    expect(formatISODate(startOfWeek(d(2024, 5, 12), 0))).toBe('2024-05-12') // already first day
    expect(formatISODate(startOfWeek(d(2024, 1, 1), 0))).toBe('2023-12-31') // crosses year
  })

  it('normalizeWeekStart accepts 0-6 integers only', () => {
    expect(normalizeWeekStart(3)).toBe(3)
    expect(normalizeWeekStart(0, 5)).toBe(0)
    for (const bad of [7, -1, 1.5, Number.NaN, '1', null, undefined]) expect(normalizeWeekStart(bad, 2)).toBe(2)
    expect(normalizeWeekStart(undefined)).toBe(0)
  })

  it('localeWeekStart reads Intl.Locale week info and falls back to Sunday', () => {
    expect(localeWeekStart('en-GB')).toBe(1)
    expect(localeWeekStart('en-US')).toBe(0) // firstDay 7 -> Sunday
    expect(localeWeekStart('not a locale!!')).toBe(0)
    expect(typeof localeWeekStart()).toBe('number')
  })

  it('localeWeekStart supports getWeekInfo() and runtimes without week info', () => {
    const real = Intl.Locale
    class WithMethod {
      getWeekInfo() {
        return { firstDay: 2 }
      }
    }
    class Without {}
    vi.stubGlobal('Intl', { ...Intl, Locale: WithMethod, DateTimeFormat: Intl.DateTimeFormat })
    expect(localeWeekStart('xx')).toBe(2)
    vi.stubGlobal('Intl', { ...Intl, Locale: Without, DateTimeFormat: Intl.DateTimeFormat })
    expect(localeWeekStart('xx')).toBe(0)
    vi.unstubAllGlobals()
    expect(Intl.Locale).toBe(real)
  })
})

describe('getMonthGrid', () => {
  const flat = (w: (Date | null)[][]) => w.flat().filter(Boolean).length

  it('lays out Feb 2024 (leap) with Sunday start: 5 rows, Thursday first', () => {
    const g = getMonthGrid(2024, 1, 0)
    expect(g).toHaveLength(5)
    expect(g.every((w) => w.length === 7)).toBe(true)
    expect(g[0].findIndex(Boolean)).toBe(4)
    expect(flat(g)).toBe(29)
  })

  it('Feb 2026 with Sunday start fits in exactly 4 rows (starts Sunday, 28 days)', () => {
    const g = getMonthGrid(2026, 1, 0)
    expect(g).toHaveLength(4)
    expect(flat(g)).toBe(28)
  })

  it('needs 6 rows when a 31-day month starts late in the week', () => {
    const g = getMonthGrid(2024, 11, 0) // Dec 2024 starts Sunday: 5 rows; use Mar 2025 (starts Sat) instead
    expect(g).toHaveLength(5)
    expect(getMonthGrid(2025, 2, 0)).toHaveLength(6)
  })

  it('weekStart shifts the lead blanks', () => {
    const sun = getMonthGrid(2024, 4, 0)[0].findIndex(Boolean)
    const mon = getMonthGrid(2024, 4, 1)[0].findIndex(Boolean)
    expect(sun).toBe(3) // 1 May 2024 is Wednesday
    expect(mon).toBe(2)
    expect(getMonthGrid(2024, 4, 3)[0].findIndex(Boolean)).toBe(0)
  })

  it('cells are consecutive days of that month at local midnight', () => {
    const days = getMonthGrid(2024, 0, 1).flat().filter((x): x is Date => !!x)
    expect(days.map((x) => x.getDate())).toEqual(Array.from({ length: 31 }, (_, i) => i + 1))
    expect(days.every((x) => x.getHours() === 0)).toBe(true)
  })

  it('works for years < 100', () => {
    const days = getMonthGrid(99, 1, 0).flat().filter((x): x is Date => !!x)
    expect(days).toHaveLength(28) // year 99 is not leap
    expect(days[0].getFullYear()).toBe(99)
  })
})

describe('formatISODate', () => {
  it('pads and handles small / negative years and invalid dates', () => {
    expect(formatISODate(d(2024, 1, 5))).toBe('2024-01-05')
    expect(formatISODate(createDate(5, 0, 1))).toBe('0005-01-01')
    expect(formatISODate(createDate(-5, 0, 1))).toBe('-000005-01-01')
    expect(formatISODate(new Date('x'))).toBe('')
  })
})

describe('bounds, clamping, disabled', () => {
  it('resolveBounds strips time, ignores invalid and swaps reversed values', () => {
    const r = resolveBounds(new Date(2024, 5, 20, 15), new Date(2024, 5, 1, 9))
    expect(formatISODate(r.min!)).toBe('2024-06-01')
    expect(formatISODate(r.max!)).toBe('2024-06-20')
    expect(resolveBounds(new Date('x'), 'nope')).toEqual({ min: null, max: null })
    expect(resolveBounds(undefined, d(2024, 1, 1)).min).toBeNull()
    expect(resolveBounds()).toEqual({ min: null, max: null })
  })

  it('clampDate clamps below, above, within, and with reversed bounds', () => {
    const lo = d(2024, 3, 10)
    const hi = d(2024, 3, 20)
    expect(formatISODate(clampDate(d(2024, 3, 1), lo, hi))).toBe('2024-03-10')
    expect(formatISODate(clampDate(d(2024, 3, 30), lo, hi))).toBe('2024-03-20')
    expect(formatISODate(clampDate(d(2024, 3, 15), lo, hi))).toBe('2024-03-15')
    expect(formatISODate(clampDate(d(2024, 3, 1), hi, lo))).toBe('2024-03-10') // reversed
    expect(formatISODate(clampDate(d(2024, 3, 1)))).toBe('2024-03-01')
    expect(formatISODate(clampDate(new Date(2024, 2, 25, 18), undefined, hi))).toBe('2024-03-20')
  })

  it('isDateDisabled honours min, max (inclusive), predicate and invalid dates', () => {
    const b = { min: d(2024, 3, 10), max: d(2024, 3, 20) }
    expect(isDateDisabled(d(2024, 3, 9), b)).toBe(true)
    expect(isDateDisabled(d(2024, 3, 10), b)).toBe(false)
    expect(isDateDisabled(d(2024, 3, 20), b)).toBe(false)
    expect(isDateDisabled(d(2024, 3, 21), b)).toBe(true)
    expect(isDateDisabled(d(2024, 3, 15))).toBe(false)
    expect(isDateDisabled(d(2024, 3, 15), { isDisabled: (x) => x.getDay() === 5 })).toBe(true) // Friday
    expect(isDateDisabled(d(2024, 3, 16), { isDisabled: (x) => x.getDay() === 5 })).toBe(false)
    expect(isDateDisabled(d(2024, 3, 16), { isDisabled: null })).toBe(false)
    expect(isDateDisabled(new Date('x'))).toBe(true)
    expect(isDateDisabled(d(2024, 3, 12), { min: b.max, max: b.min })).toBe(false) // reversed bounds
  })

  it('predicate receives a copy at local midnight and cannot mutate the input', () => {
    const src = new Date(2024, 2, 15, 13, 30)
    isDateDisabled(src, {
      isDisabled: (x) => {
        expect(x.getHours()).toBe(0)
        x.setFullYear(1999)
        return false
      },
    })
    expect(src.getFullYear()).toBe(2024)
  })
})

describe('ranges and lists', () => {
  it('normalizeRange orders reversed input and strips time', () => {
    const r = normalizeRange(new Date(2024, 5, 20, 8), d(2024, 6, 1))!
    expect(formatISODate(r.start)).toBe('2024-06-01')
    expect(formatISODate(r.end)).toBe('2024-06-20')
    const same = normalizeRange(d(2024, 6, 1), d(2024, 6, 1))!
    expect(isSameDay(same.start, same.end)).toBe(true)
  })

  it('normalizeRange returns null for invalid input', () => {
    expect(normalizeRange(null, d(2024, 1, 1))).toBeNull()
    expect(normalizeRange(d(2024, 1, 1), new Date('x'))).toBeNull()
    expect(normalizeRange('2024-01-01', '2024-01-02')).toBeNull()
  })

  it('toRange accepts {start,end}-like objects only', () => {
    expect(formatISODate(toRange({ start: d(2024, 2, 5), end: d(2024, 2, 1) })!.start)).toBe('2024-02-01')
    for (const bad of [null, undefined, 5, 'x', {}, { start: d(2024, 1, 1) }, { start: 'a', end: 'b' }, [d(2024, 1, 1)]]) expect(toRange(bad)).toBeNull()
  })

  it('toSingle', () => {
    expect(formatISODate(toSingle(new Date(2024, 0, 1, 12))!)).toBe('2024-01-01')
    expect(toSingle(new Date('x'))).toBeNull()
    expect(toSingle('2024-01-01')).toBeNull()
    expect(toSingle(null)).toBeNull()
  })

  it('toDateList sorts, de-dupes by day, drops invalid entries, tolerates non-arrays', () => {
    const list = toDateList([d(2024, 3, 3), new Date('x'), 'nope', new Date(2024, 2, 1, 20), d(2024, 3, 1), null, d(2024, 3, 2)])
    expect(list.map(formatISODate)).toEqual(['2024-03-01', '2024-03-02', '2024-03-03'])
    expect(toDateList(null)).toEqual([])
    expect(toDateList('x')).toEqual([])
    expect(toDateList([])).toEqual([])
  })

  it('toDateList copes with 10 000 entries', () => {
    const many = Array.from({ length: 10_000 }, (_, i) => addDays(d(2000, 1, 1), i % 5000))
    const out = toDateList(many)
    expect(out).toHaveLength(5000)
    expect(compareDays(out[0], out[4999])).toBeLessThan(0)
  })

  it('toggleDay adds, removes and keeps order', () => {
    const base = [d(2024, 1, 5)]
    const added = toggleDay(base, d(2024, 1, 1))
    expect(added.map(formatISODate)).toEqual(['2024-01-01', '2024-01-05'])
    expect(toggleDay(added, new Date(2024, 0, 5, 10)).map(formatISODate)).toEqual(['2024-01-01'])
    expect(toggleDay([], d(2024, 1, 1))).toHaveLength(1)
    expect(base).toHaveLength(1) // not mutated
  })

  it('isDayInRange is inclusive, normalises reversed ranges and rejects invalid input', () => {
    const range = { start: d(2024, 3, 10), end: d(2024, 3, 20) }
    expect(isDayInRange(d(2024, 3, 10), range)).toBe(true)
    expect(isDayInRange(d(2024, 3, 20), range)).toBe(true)
    expect(isDayInRange(d(2024, 3, 15), range)).toBe(true)
    expect(isDayInRange(d(2024, 3, 9), range)).toBe(false)
    expect(isDayInRange(d(2024, 3, 21), range)).toBe(false)
    expect(isDayInRange(d(2024, 3, 15), { start: range.end, end: range.start })).toBe(true) // reversed
    expect(isDayInRange(d(2024, 3, 15), null)).toBe(false)
    expect(isDayInRange(d(2024, 3, 15), undefined)).toBe(false)
    expect(isDayInRange(new Date('x'), range)).toBe(false)
    expect(isDayInRange(d(2024, 3, 15), { start: new Date('x'), end: range.end })).toBe(false)
  })
})

describe('Intl formatting', () => {
  it('createCalendarFormatters: en-US names', () => {
    const f = createCalendarFormatters('en-US')
    expect(f.monthYear(d(2024, 2, 29))).toBe('February 2024')
    expect(f.fullDate(d(2024, 2, 29))).toBe('Thursday, February 29, 2024')
    expect(f.dayNumber(7)).toBe('7')
    const days = f.weekdays(0)
    expect(days).toHaveLength(7)
    expect(days[0]).toEqual({ short: 'Sun', long: 'Sunday' })
    expect(f.weekdays(1)[0].long).toBe('Monday')
    expect(f.weekdays(6)[1].long).toBe('Sunday')
  })

  it('localises (de, ja, ar numerals)', () => {
    expect(createCalendarFormatters('de-DE').monthYear(d(2024, 3, 1))).toBe('März 2024')
    expect(createCalendarFormatters('de-DE').weekdays(1)[0].long).toBe('Montag')
    expect(createCalendarFormatters('ja-JP').monthYear(d(2024, 3, 1))).toContain('2024')
    expect(createCalendarFormatters('ar-EG').dayNumber(5)).toBe('٥')
  })

  it('invalid dates format to empty strings', () => {
    const f = createCalendarFormatters('en-US')
    expect(f.monthYear(new Date('x'))).toBe('')
    expect(f.fullDate(new Date('x'))).toBe('')
  })

  it('falls back to the runtime default for an invalid locale', () => {
    const f = createCalendarFormatters('definitely not a locale')
    expect(f.monthYear(d(2024, 2, 1))).toContain('2024')
    expect(f.dayNumber(12)).toBe('12')
    expect(createCalendarFormatters('').dayNumber(1)).toBe('1')
    expect(createCalendarFormatters(undefined).weekdays(0)).toHaveLength(7)
  })

  it('safeDateTimeFormat degrades through bad locale then bad options, and rethrows when impossible', () => {
    expect(safeDateTimeFormat('bad locale!', { year: 'numeric' }).format(d(2024, 1, 1))).toBe('2024')
    expect(safeDateTimeFormat('en-US', { dateStyle: 'short', year: 'numeric' }).format(d(2024, 1, 1))).toBeTruthy()
    const boom = new Error('boom')
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function () {
      throw boom
    } as unknown as typeof Intl.DateTimeFormat)
    expect(() => safeDateTimeFormat('en')).toThrow(boom)
  })

  it('formatDateIntl formats, defaults to medium style and rejects invalid dates', () => {
    expect(formatDateIntl(d(2024, 2, 29), 'en-US')).toBe('Feb 29, 2024')
    expect(formatDateIntl(d(2024, 2, 29), 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })).toBe('02/29/2024')
    expect(formatDateIntl(new Date('x'), 'en-US')).toBe('')
  })

  it('number formatter falls back when the locale makes NumberFormat throw', () => {
    const real = Intl.NumberFormat
    let calls = 0
    vi.spyOn(Intl, 'NumberFormat').mockImplementation(function (...args: ConstructorParameters<typeof Intl.NumberFormat>) {
      calls++
      if (calls === 1) throw new RangeError('bad')
      return new real(...args)
    } as unknown as typeof Intl.NumberFormat)
    expect(createCalendarFormatters('en-US').dayNumber(3)).toBe('3')
    expect(calls).toBe(2)
  })
})

describe('DST safety', () => {
  it('addDays across US spring-forward and fall-back never skips or repeats a day', () => {
    process.env.TZ = 'America/New_York'
    expect(new Date(2024, 2, 10, 2, 30).getHours()).toBe(3) // proves the zone is active
    let day = d(2024, 3, 8)
    const seen: string[] = []
    for (let i = 0; i < 5; i++) {
      seen.push(formatISODate(day))
      day = addDays(day, 1)
    }
    expect(seen).toEqual(['2024-03-08', '2024-03-09', '2024-03-10', '2024-03-11', '2024-03-12'])
    expect(formatISODate(addDays(d(2024, 11, 2), 2))).toBe('2024-11-04')
    expect(compareDays(d(2024, 11, 4), d(2024, 11, 3))).toBe(1)
    expect(dayNumber(d(2024, 3, 11)) - dayNumber(d(2024, 3, 10))).toBe(1)
  })

  it('midnight that does not exist (Sao Paulo 2018-11-04) still lands on the right day', () => {
    process.env.TZ = 'America/Sao_Paulo'
    const day = d(2018, 11, 4)
    expect(formatISODate(day)).toBe('2018-11-04')
    expect(formatISODate(addDays(day, 1))).toBe('2018-11-05')
    expect(formatISODate(addDays(day, -1))).toBe('2018-11-03')
    expect(formatISODate(startOfDay(day))).toBe('2018-11-04')
  })

  it('month grid is correct in a zone ahead of UTC (Pacific/Auckland) and behind (Pacific/Honolulu)', () => {
    for (const tz of ['Pacific/Auckland', 'Pacific/Honolulu', 'UTC']) {
      process.env.TZ = tz
      const days = getMonthGrid(2024, 8, 1).flat().filter((x): x is Date => !!x) // Sep 2024 (NZ DST starts 29 Sep)
      expect(days).toHaveLength(30)
      expect(days.map((x) => x.getDate())).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
    }
  })
})
