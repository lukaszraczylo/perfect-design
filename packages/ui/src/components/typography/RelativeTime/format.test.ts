import { describe, expect, it } from 'vitest'
import { formatAbsolute, formatRelative, parseDateTime, resolveLocale, toMillis } from './format'

const NOW = Date.parse('2025-06-15T12:00:00Z')
const ws = (s: string) => s.replace(/\s/g, ' ')

describe('parseDateTime', () => {
  it.each([
    ['2025-06-15', Date.UTC(2025, 5, 15)],
    ['2025-06-15T09:30:00Z', Date.UTC(2025, 5, 15, 9, 30)],
    ['2025-06-15T09:30Z', Date.UTC(2025, 5, 15, 9, 30)],
    ['2025-06-15T09:30:00.123Z', Date.UTC(2025, 5, 15, 9, 30, 0, 123)],
    ['2025-06-15T09:30:00,5Z', Date.UTC(2025, 5, 15, 9, 30, 0, 500)],
    ['2025-06-15T11:30:00+02:00', Date.UTC(2025, 5, 15, 9, 30)],
    ['2025-06-15T11:30:00+0200', Date.UTC(2025, 5, 15, 9, 30)],
    ['2025-06-15 09:30:00Z', Date.UTC(2025, 5, 15, 9, 30)],
    ['  2025-06-15T09:30:00Z  ', Date.UTC(2025, 5, 15, 9, 30)],
    ['+275760-09-13T00:00:00.000Z', 8.64e15],
  ])('string %s', (input, ms) => expect(parseDateTime(input)?.getTime()).toBe(ms))

  it('accepts a Date (copy), epoch ms and zero', () => {
    const d = new Date(1000)
    expect(parseDateTime(d)).not.toBe(d)
    expect(parseDateTime(d)?.getTime()).toBe(1000)
    expect(parseDateTime(1000)?.getTime()).toBe(1000)
    expect(parseDateTime(0)?.getTime()).toBe(0)
    expect(parseDateTime(-1000)?.getTime()).toBe(-1000)
  })

  it.each([
    NaN, Infinity, -Infinity, 1e20, -1e20, 8.64e15 + 1, Number.MAX_VALUE,
    new Date(NaN), new Date(8.64e15 + 1),
    '', '   ', 'not a date', 'foo 1', '2025', '2025-06', '12/31/2025', 'Tue, 01 Jan 2030 00:00:00 GMT', '2025-13-45', '2025-06-15T25:99:00Z', '1749988800000',
    '<script>alert(1)</script>', '2025-06-15T09:30:00Z<script>', 'x'.repeat(10_000),
    null, undefined, true, {}, [], [1], 5n, Symbol('x'), () => 1,
  ])('%s is invalid', (input) => expect(parseDateTime(input)).toBeNull())

  it('toMillis mirrors it', () => {
    expect(toMillis('2025-06-15T00:00:00Z')).toBe(Date.UTC(2025, 5, 15))
    expect(toMillis('nope')).toBeNull()
  })
})

describe('resolveLocale', () => {
  it('canonicalises', () => expect(resolveLocale('en-us')).toBe('en-US'))
  it.each([undefined, null, 1, '', ' ', 'bad_tag', '???'])('%s is en', (l) => expect(resolveLocale(l)).toBe('en'))
})

describe('formatRelative', () => {
  const at = (iso: string, opts = {}) => formatRelative(iso, NOW, opts)

  it.each([
    ['2025-06-15T11:57:00Z', '3 minutes ago'],
    ['2025-06-15T12:03:00Z', 'in 3 minutes'],
    ['2025-06-15T09:00:00Z', '3 hours ago'],
    ['2025-06-14T12:00:00Z', 'yesterday'],
    ['2025-06-16T12:00:00Z', 'tomorrow'],
    ['2025-06-12T12:00:00Z', '3 days ago'],
    ['2025-06-01T12:00:00Z', '2 weeks ago'],
    ['2025-03-15T12:00:00Z', '3 months ago'],
    ['2023-06-15T12:00:00Z', '2 years ago'],
    ['2025-06-15T12:00:00Z', 'now'],
    ['2025-06-15T12:00:30Z', 'in 30 seconds'],
  ])('%s is %s', (iso, text) => expect(at(iso)).toBe(text))

  it('numeric always', () => {
    expect(at('2025-06-14T12:00:00Z', { numeric: 'always' })).toBe('1 day ago')
    expect(at('2025-06-15T12:00:00Z', { numeric: 'always' })).toBe('in 0 seconds')
  })
  it.each([
    ['long', '3 minutes ago'],
    ['short', '3 min. ago'],
    ['narrow', '3m ago'],
  ])('unitStyle %s', (unitStyle, text) => expect(at('2025-06-15T11:57:00Z', { unitStyle })).toBe(text))
  it('minUnit and maxUnit', () => {
    expect(at('2025-06-15T11:59:40Z', { minUnit: 'minute' })).toBe('this minute')
    expect(at('2025-01-01T12:00:00Z', { maxUnit: 'day' })).toBe('165 days ago')
  })
  it('German and Arabic', () => {
    expect(at('2025-06-15T11:57:00Z', { locale: 'de' })).toBe('vor 3 Minuten')
    expect(at('2025-06-15T11:57:00Z', { locale: 'ar' })).toMatch(/[؀-ۿ]/)
  })
  it('a bad locale falls back to English', () => expect(at('2025-06-15T11:57:00Z', { locale: 'bad_tag' })).toBe('3 minutes ago'))
  it('unknown numeric and unitStyle fall back to the defaults', () => expect(at('2025-06-14T12:00:00Z', { numeric: 'x' as never, unitStyle: 'x' as never })).toBe('yesterday'))
  it('accepts mixed inputs for datetime and now', () => {
    expect(formatRelative(new Date(NOW - 3 * 60_000), new Date(NOW))).toBe('3 minutes ago')
    expect(formatRelative(NOW - 3 * 3_600_000, '2025-06-15T12:00:00Z')).toBe('3 hours ago')
  })
  it('returns null for an invalid datetime or now', () => {
    expect(formatRelative('nope', NOW)).toBeNull()
    expect(formatRelative(NOW, 'nope')).toBeNull()
    expect(formatRelative(NOW, undefined)).toBeNull()
  })
  it('handles the extremes of the Date range', () => {
    expect(formatRelative(-8.64e15, 8.64e15)).toMatch(/years ago$/)
    expect(formatRelative(8.64e15, -8.64e15)).toMatch(/^in .* years$/)
  })
  it('reuses the formatter for repeated calls', () => expect(at('2025-06-15T11:57:00Z')).toBe(at('2025-06-15T11:57:00Z')))
})

describe('formatAbsolute', () => {
  const D = '2025-06-14T09:30:00Z'
  it('default medium date, short time', () => expect(ws(formatAbsolute(D, { timeZone: 'UTC' }))).toBe('Jun 14, 2025, 9:30 AM'))
  it('full date, long time', () => expect(ws(formatAbsolute(D, { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'long' }))).toBe('Saturday, June 14, 2025 at 9:30:00 AM UTC'))
  it('short date without time', () => expect(formatAbsolute(D, { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'none' })).toBe('6/14/25'))
  it('honours the zone', () => expect(ws(formatAbsolute(D, { timeZone: 'Asia/Tokyo' }))).toBe('Jun 14, 2025, 6:30 PM'))
  it('locale', () => expect(ws(formatAbsolute(D, { locale: 'de', timeZone: 'UTC' }))).toBe('14.06.2025, 09:30'))
  it('unknown zone is ignored, not thrown', () => expect(formatAbsolute(D, { timeZone: 'Mars/Base' })).toMatch(/2025/))
  it('unknown styles use the defaults', () => expect(ws(formatAbsolute(D, { timeZone: 'UTC', dateStyle: 'x' as never, timeStyle: 'y' as never }))).toBe('Jun 14, 2025, 9:30 AM'))
  it('bad locale falls back to en', () => expect(ws(formatAbsolute(D, { timeZone: 'UTC', locale: 'bad_tag' }))).toBe('Jun 14, 2025, 9:30 AM'))
  it('invalid input is an empty string', () => {
    expect(formatAbsolute('nope')).toBe('')
    expect(formatAbsolute(1e20)).toBe('')
  })
  it('formats the extremes of the Date range', () => {
    expect(formatAbsolute(8.64e15, { timeZone: 'UTC' })).toMatch(/275760/)
    expect(formatAbsolute(-8.64e15, { timeZone: 'UTC' })).toBeTruthy()
  })
})
