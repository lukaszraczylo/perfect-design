import { describe, expect, it } from 'vitest'
import {
  dayToDate,
  draftToInstant,
  instantToDraft,
  isValidTimeZone,
  MAX_INSTANT,
  MIN_INSTANT,
  normalizeTimeZone,
  parseRange,
  resolvePreset,
  startOfZonedDay,
  toInstant,
  toIso,
  validateRange,
  wallParts,
  zoneFormat,
  zonedToInstant,
} from './timeRange'

const utc = (y: number, m: number, d: number, h = 0, mi = 0, s = 0, ms = 0) => Date.UTC(y, m - 1, d, h, mi, s, ms)
const HOUR = 3_600_000

describe('toInstant', () => {
  it.each([
    ['2024-05-01T10:00:00Z', utc(2024, 5, 1, 10)],
    ['2024-05-01T10:00:00.000Z', utc(2024, 5, 1, 10)],
    ['2024-05-01t10:00z', utc(2024, 5, 1, 10)],
    ['2024-05-01 10:00', utc(2024, 5, 1, 10)],
    ['2024-05-01T10:00', utc(2024, 5, 1, 10)],
    ['2024-05-01', utc(2024, 5, 1)],
    ['  2024-05-01T10:00:00Z  ', utc(2024, 5, 1, 10)],
    ['2024-05-01T10:00:00+02:00', utc(2024, 5, 1, 8)],
    ['2024-05-01T10:00:00-0530', utc(2024, 5, 1, 15, 30)],
    ['2024-05-01T10:00:00+02', utc(2024, 5, 1, 8)],
    ['2024-05-01T10:00:00.5Z', utc(2024, 5, 1, 10, 0, 0, 500)],
    ['2024-05-01T10:00:00,25Z', utc(2024, 5, 1, 10, 0, 0, 250)],
    ['2024-05-01T10:00:00.123456789Z', utc(2024, 5, 1, 10, 0, 0, 123)],
    ['2024-02-29', utc(2024, 2, 29)],
    ['2000-02-29', utc(2000, 2, 29)],
    ['2024-12-31T23:59:59.999Z', utc(2024, 12, 31, 23, 59, 59, 999)],
  ])('reads %s', (input, expected) => expect(toInstant(input)).toBe(expected))

  it.each([
    '',
    '   ',
    'not a date',
    '2024-5-1',
    '2024-13-01',
    '2024-00-10',
    '2024-04-31',
    '2023-02-29',
    '1900-02-29',
    '2024-02-30',
    '2024-05-01T24:00',
    '2024-05-01T10:60',
    '2024-05-01T23:59:60',
    '2024-05-01T10:00:00+24:00',
    '2024-05-01T10:00:00+02:60',
    '2024-05-01T10:00:00 UTC',
    '2024-05-01T10:00:00Zjunk',
    '0999-12-31',
    '0001-01-01',
    '+012024-05-01',
    '10000-01-01',
    'Wed, 01 May 2024 10:00:00 GMT',
    '2024-05-01T10:00:00Z\n<script>',
    "2024-05-01'; DROP TABLE x;--",
  ])('rejects %j', (input) => expect(toInstant(input)).toBeNull())

  it('rejects hostile strings without scanning them: 1 MB of digits and of spaces', () => {
    const t0 = performance.now()
    expect(toInstant('9'.repeat(1_000_000))).toBeNull()
    expect(toInstant(' '.repeat(1_000_000) + '2024-05-01')).toBeNull()
    expect(toInstant('2024-05-01' + ' '.repeat(65))).toBeNull()
    expect(performance.now() - t0).toBeLessThan(500)
  })

  it('accepts a 64 character string and rejects 65', () => {
    expect(toInstant('2024-05-01T10:00:00.123456789Z' + ' '.repeat(34))).toBe(utc(2024, 5, 1, 10, 0, 0, 123))
    expect(toInstant('2024-05-01T10:00:00.123456789Z' + ' '.repeat(35))).toBeNull()
  })

  it('reads Date objects and millisecond numbers inside the supported years', () => {
    expect(toInstant(new Date(utc(2024, 5, 1)))).toBe(utc(2024, 5, 1))
    expect(toInstant(utc(2024, 5, 1))).toBe(utc(2024, 5, 1))
    expect(toInstant(MIN_INSTANT)).toBe(MIN_INSTANT)
    expect(toInstant(MAX_INSTANT)).toBe(MAX_INSTANT)
    expect(toInstant(MIN_INSTANT - 1)).toBeNull()
    expect(toInstant(MAX_INSTANT + 1)).toBeNull()
  })

  it.each([new Date('nope'), new Date(8.64e15), NaN, Infinity, -Infinity, 1e300, null, undefined, {}, [], true, Symbol('x'), () => 1, 10n])('rejects %s', (v) => expect(toInstant(v)).toBeNull())

  it('rejects an instant that leaves the supported years after the offset is applied', () => {
    expect(toInstant('9999-12-31T23:59:59+00:00')).toBe(utc(9999, 12, 31, 23, 59, 59))
    expect(toInstant('9999-12-31T23:59:59-01:00')).toBeNull()
    expect(toInstant('1000-01-01T00:00:00+01:00')).toBeNull()
  })

  it('toIso is the canonical UTC form', () => expect(toIso(utc(2024, 5, 1, 10, 0, 0, 7))).toBe('2024-05-01T10:00:00.007Z'))
})

describe('parseRange', () => {
  it('parses both ends and keeps a reversed range as it is', () => {
    expect(parseRange({ from: '2024-05-01T10:00:00Z', to: '2024-05-01T11:00:00Z' })).toEqual({ from: utc(2024, 5, 1, 10), to: utc(2024, 5, 1, 11) })
    expect(parseRange({ from: '2024-05-02', to: '2024-05-01' })).toEqual({ from: utc(2024, 5, 2), to: utc(2024, 5, 1) })
  })
  it.each([null, undefined, 'x', 5, [], {}, { from: '2024-05-01' }, { to: '2024-05-01' }, { from: 'x', to: '2024-05-01' }, { from: {}, to: [] }, { from: '2024-05-01', to: 'nope' }])('is null for %j', (v) => expect(parseRange(v)).toBeNull())
})

describe('time zones', () => {
  it('validates names with Intl and never throws', () => {
    for (const ok of ['UTC', 'utc', 'Europe/Warsaw', 'america/new_york', 'Asia/Kathmandu', 'Etc/GMT+5']) expect(isValidTimeZone(ok), ok).toBe(true)
    for (const bad of ['', '  ', 'Mars/Base', 'Europe/', 'x'.repeat(200), 'UTC\u0000', '../../etc', null, undefined, 5, {}, []]) expect(isValidTimeZone(bad), String(bad)).toBe(false)
  })
  it('normalises to the resolved name, or UTC', () => {
    expect(normalizeTimeZone('europe/warsaw')).toBe('Europe/Warsaw')
    expect(normalizeTimeZone('utc')).toBe('UTC')
    expect(normalizeTimeZone('Mars/Base')).toBe('UTC')
    expect(normalizeTimeZone(undefined)).toBe('UTC')
  })
  it('reads wall-clock parts, midnight as 00 not 24', () => {
    expect(wallParts(utc(2024, 5, 1, 22, 30, 15), 'Europe/Warsaw')).toEqual({ year: 2024, month: 5, day: 2, hour: 0, minute: 30, second: 15 })
    expect(wallParts(utc(2024, 5, 1, 0, 0, 0), 'UTC').hour).toBe(0)
  })

  describe('wall time to instant', () => {
    it('is a plain offset away from DST changes', () => {
      expect(zonedToInstant(2024, 5, 1, 12, 0, 'UTC')).toBe(utc(2024, 5, 1, 12))
      expect(zonedToInstant(2024, 5, 1, 12, 0, 'Europe/Warsaw')).toBe(utc(2024, 5, 1, 10))
      expect(zonedToInstant(2024, 1, 1, 12, 0, 'Europe/Warsaw')).toBe(utc(2024, 1, 1, 11))
      expect(zonedToInstant(2024, 5, 1, 12, 0, 'Asia/Kolkata')).toBe(utc(2024, 5, 1, 6, 30))
      expect(zonedToInstant(2024, 5, 1, 12, 0, 'Asia/Kathmandu')).toBe(utc(2024, 5, 1, 6, 15))
      expect(zonedToInstant(2024, 5, 1, 12, 0, 'Pacific/Kiritimati')).toBe(utc(2024, 4, 30, 22))
    })
    it('spring forward: a time that does not exist moves forward (New York 2024-03-10 02:30 is 03:30 EDT)', () => {
      expect(zonedToInstant(2024, 3, 10, 2, 30, 'America/New_York')).toBe(utc(2024, 3, 10, 7, 30))
      expect(zonedToInstant(2024, 3, 10, 1, 59, 'America/New_York')).toBe(utc(2024, 3, 10, 6, 59))
      expect(zonedToInstant(2024, 3, 10, 3, 0, 'America/New_York')).toBe(utc(2024, 3, 10, 7, 0))
    })
    it('spring forward in Europe (London 2024-03-31 01:30 is 02:30 BST)', () => {
      expect(zonedToInstant(2024, 3, 31, 1, 30, 'Europe/London')).toBe(utc(2024, 3, 31, 1, 30))
      expect(instantToDraft(zonedToInstant(2024, 3, 31, 1, 30, 'Europe/London'), 'Europe/London')).toEqual({ date: '2024-03-31', time: '02:30' })
    })
    it('fall back: a time that happens twice is the first occurrence (New York 2024-11-03 01:30 is EDT)', () => {
      expect(zonedToInstant(2024, 11, 3, 1, 30, 'America/New_York')).toBe(utc(2024, 11, 3, 5, 30))
      expect(zonedToInstant(2024, 11, 3, 0, 59, 'America/New_York')).toBe(utc(2024, 11, 3, 4, 59))
      expect(zonedToInstant(2024, 11, 3, 2, 0, 'America/New_York')).toBe(utc(2024, 11, 3, 7, 0))
    })
    it('fall back in Europe (Warsaw 2024-10-27 02:30 is CEST, the first occurrence)', () => {
      expect(zonedToInstant(2024, 10, 27, 2, 30, 'Europe/Warsaw')).toBe(utc(2024, 10, 27, 0, 30))
    })
    it('a 30 minute DST change (Lord Howe)', () => {
      expect(zonedToInstant(2024, 10, 6, 2, 15, 'Australia/Lord_Howe')).toBe(utc(2024, 10, 5, 15, 45))
      expect(zonedToInstant(2024, 4, 7, 1, 45, 'Australia/Lord_Howe')).toBe(utc(2024, 4, 6, 14, 45))
    })
    it('a skipped calendar day (Samoa lost 2011-12-30) resolves to the next day', () => {
      const t = zonedToInstant(2011, 12, 30, 10, 0, 'Pacific/Apia')
      expect(instantToDraft(t, 'Pacific/Apia')).toEqual({ date: '2011-12-31', time: '10:00' })
    })
    it('round-trips every minute of a DST day that exists', () => {
      for (const zone of ['America/New_York', 'Europe/London', 'Australia/Lord_Howe']) {
        for (const day of [[2024, 3, 10], [2024, 11, 3], [2024, 3, 31], [2024, 10, 27], [2024, 4, 7], [2024, 10, 6]]) {
          for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
            const t = zonedToInstant(day[0], day[1], day[2], Math.floor(minutes / 60), minutes % 60, zone)
            const back = wallParts(t, zone)
            // Every result is a real wall time; times that exist come back unchanged.
            expect(back.second).toBe(0)
            const again = zonedToInstant(back.year, back.month, back.day, back.hour, back.minute, zone)
            expect(again, `${zone} ${day} ${minutes}`).toBe(t)
          }
        }
      }
    })
  })

  describe('drafts', () => {
    it('splits an instant into date and time in the zone', () => {
      expect(instantToDraft(utc(2024, 5, 1, 22, 30), 'Europe/Warsaw')).toEqual({ date: '2024-05-02', time: '00:30' })
      expect(instantToDraft(utc(2024, 5, 1, 22, 30), 'UTC')).toEqual({ date: '2024-05-01', time: '22:30' })
      expect(instantToDraft(utc(1000, 1, 1), 'UTC')).toEqual({ date: '1000-01-01', time: '00:00' })
    })
    it('reads a date and time in the zone', () => {
      expect(draftToInstant('2024-05-01', '12:00', 'Europe/Warsaw')).toBe(utc(2024, 5, 1, 10))
      expect(draftToInstant('2024-05-01', '9:05', 'UTC')).toBe(utc(2024, 5, 1, 9, 5))
    })
    it.each([
      ['', '12:00'],
      ['2024-05-01', ''],
      ['2024-02-30', '12:00'],
      ['2024-13-01', '12:00'],
      ['2024-05-01', '24:00'],
      ['2024-05-01', '12:60'],
      ['0999-05-01', '12:00'],
      ['24-05-01', '12:00'],
      ['2024-05-01T10:00', '12:00'],
      [null, '12:00'],
      ['2024-05-01', null],
      [{}, []],
      ['9'.repeat(10_000), '12:00'],
    ])('rejects %j %j', (date, time) => expect(draftToInstant(date, time, 'UTC')).toBeNull())
    it('rejects an instant outside the supported years', () => {
      expect(draftToInstant('9999-12-31', '23:59', 'Pacific/Pago_Pago')).toBeNull()
      expect(draftToInstant('1000-01-01', '00:00', 'America/Los_Angeles')).not.toBeNull()
    })
    it('dayToDate carries the calendar day', () => {
      const d = dayToDate('2024-02-29')!
      expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2024, 1, 29])
      for (const bad of ['', '2024-02-30', '2024-2-3', '0999-01-01', '2024-13-01', '2024-00-01', null, 5, {}]) expect(dayToDate(bad), String(bad)).toBeNull()
    })
  })
})

describe('resolvePreset', () => {
  const now = utc(2024, 5, 15, 12, 30, 45, 123)
  it.each([
    ['last-15-minutes', 15 * 60_000],
    ['last-30-minutes', 30 * 60_000],
    ['last-1-hour', HOUR],
    ['last-6-hours', 6 * HOUR],
    ['last-24-hours', 24 * HOUR],
    ['last-7-days', 7 * 24 * HOUR],
    ['last-30-days', 30 * 24 * HOUR],
  ])('%s ends now and is an exact elapsed length', (id, span) => {
    expect(resolvePreset(id, now, 'UTC')).toEqual({ from: now - span, to: now })
    expect(resolvePreset(id, now, 'America/New_York')).toEqual({ from: now - span, to: now })
  })
  it('today runs from the start of the zone day to now', () => {
    expect(resolvePreset('today', now, 'UTC')).toEqual({ from: utc(2024, 5, 15), to: now })
    expect(resolvePreset('today', now, 'Asia/Tokyo')).toEqual({ from: utc(2024, 5, 14, 15), to: now })
    expect(resolvePreset('today', now, 'Pacific/Honolulu')).toEqual({ from: utc(2024, 5, 15, 10), to: now })
  })
  it('the zone decides which day it is: 23:30 UTC is already tomorrow in Warsaw', () => {
    const late = utc(2024, 5, 15, 23, 30)
    expect(resolvePreset('today', late, 'UTC')!.from).toBe(utc(2024, 5, 15))
    expect(resolvePreset('today', late, 'Europe/Warsaw')!.from).toBe(utc(2024, 5, 15, 22))
    expect(resolvePreset('yesterday', late, 'Europe/Warsaw')).toEqual({ from: utc(2024, 5, 14, 22), to: utc(2024, 5, 15, 22) - 1 })
  })
  it('yesterday is the whole previous zone day', () => {
    expect(resolvePreset('yesterday', now, 'UTC')).toEqual({ from: utc(2024, 5, 14), to: utc(2024, 5, 15) - 1 })
  })
  it('yesterday is 23 hours long after spring forward and 25 hours after fall back (New York)', () => {
    const spring = resolvePreset('yesterday', utc(2024, 3, 11, 12), 'America/New_York')!
    expect(spring).toEqual({ from: utc(2024, 3, 10, 5), to: utc(2024, 3, 11, 4) - 1 })
    expect(spring.to + 1 - spring.from).toBe(23 * HOUR)
    const fall = resolvePreset('yesterday', utc(2024, 11, 4, 12), 'America/New_York')!
    expect(fall).toEqual({ from: utc(2024, 11, 3, 4), to: utc(2024, 11, 4, 5) - 1 })
    expect(fall.to + 1 - fall.from).toBe(25 * HOUR)
  })
  it('today on a DST day starts at local midnight', () => {
    expect(resolvePreset('today', utc(2024, 3, 10, 12), 'America/New_York')!.from).toBe(utc(2024, 3, 10, 5))
    expect(startOfZonedDay(utc(2024, 11, 3, 12), 'America/New_York')).toBe(utc(2024, 11, 3, 4))
  })
  it('yesterday across a month and a year boundary', () => {
    expect(resolvePreset('yesterday', utc(2024, 3, 1, 12), 'UTC')!.from).toBe(utc(2024, 2, 29))
    expect(resolvePreset('yesterday', utc(2025, 1, 1, 0, 30), 'UTC')!.from).toBe(utc(2024, 12, 31))
  })
  it('a relative range that would leave the supported years is null', () => {
    expect(resolvePreset('last-30-days', MIN_INSTANT + HOUR, 'UTC')).toBeNull()
    expect(resolvePreset('yesterday', MIN_INSTANT + HOUR, 'UTC')).toBeNull()
  })
  it.each(['custom', 'nope', '', 5, null, undefined, {}])('%j has no range', (id) => expect(resolvePreset(id, now, 'UTC')).toBeNull())
  it.each([NaN, Infinity, 1e300, MIN_INSTANT - 1, MAX_INSTANT + 1])('a bad now (%s) has no range', (bad) => expect(resolvePreset('today', bad, 'UTC')).toBeNull())
})

describe('validateRange', () => {
  const a = utc(2024, 5, 1)
  const b = utc(2024, 5, 2)
  it('is null for a valid range, including a zero-length one', () => {
    expect(validateRange(a, b, null, null)).toBeNull()
    expect(validateRange(a, a, null, null)).toBeNull()
    expect(validateRange(a, b, a, b)).toBeNull()
  })
  it('names the first problem', () => {
    expect(validateRange(null, b, null, null)).toBe('incomplete')
    expect(validateRange(a, null, null, null)).toBe('incomplete')
    expect(validateRange(b, a, null, null)).toBe('order')
    expect(validateRange(a, b, a + 1, null)).toBe('min')
    expect(validateRange(a, b, null, b - 1)).toBe('max')
    expect(validateRange(b, a, b + 5, null)).toBe('order')
  })
})

describe('zoneFormat', () => {
  const t = utc(2024, 6, 1, 23, 0)
  it('formats in the zone', () => {
    expect(zoneFormat('en-US', 'Asia/Tokyo').format(t)).toBe('Jun 2, 2024, 08:00 AM')
    expect(zoneFormat('en-US', 'UTC').format(t)).toBe('Jun 1, 2024, 11:00 PM')
    expect(zoneFormat('en-US', 'UTC', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(t)).toBe('11:00 PM UTC')
  })
  it('a bad locale falls back and keeps the zone', () => {
    expect(zoneFormat('not a locale!!', 'Asia/Tokyo').format(t)).toMatch(/2024/)
    expect(zoneFormat('not a locale!!', 'Asia/Tokyo', { hour: '2-digit', hourCycle: 'h23' }).format(t)).toBe('08')
  })
  it('bad options fall back to the default format and keep the zone', () => {
    const f = zoneFormat('en-US', 'Asia/Tokyo', { dateStyle: 'nope' } as unknown as Intl.DateTimeFormatOptions)
    expect(f.format(t)).toBe('Jun 2, 2024, 08:00 AM')
    const g = zoneFormat('de-DE', 'Asia/Tokyo', { dateStyle: 'full', year: 'numeric' })
    expect(g.resolvedOptions().timeZone).toBe('Asia/Tokyo')
  })
})
