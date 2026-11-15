import { describe, expect, it } from 'vitest'
import { buildNumberFormatOptions, formatNumber, resolveNumberLocale, toFormattable } from './format'

const ws = (s: string) => s.replace(/\s/g, ' ')

describe('toFormattable', () => {
  it.each([
    [5, 5],
    [-1.5, -1.5],
    [0, 0],
    [10n, 10n],
    ['12.5', '12.5'],
    ['  42  ', '42'],
    ['-.5', '-.5'],
    ['1e3', '1e3'],
    ['+7', '+7'],
  ])('%s is formattable', (input, expected) => expect(toFormattable(input)).toBe(expected))

  it('turns -0 into 0', () => expect(Object.is(toFormattable(-0), 0)).toBe(true))

  it.each([NaN, Infinity, -Infinity, '', '   ', 'abc', '12px', '1,234', '0x10', '1e999', 'Infinity', 'NaN', '1.2.3', null, undefined, true, {}, [], [1], () => 1, Symbol('x')])(
    '%s is not formattable',
    (input) => expect(toFormattable(input)).toBeNull(),
  )

  it('rejects a numeric string that overflows a double', () => expect(toFormattable('9'.repeat(400))).toBeNull())
})

describe('formatNumber: good path', () => {
  it('decimal', () => expect(formatNumber(1234567.891)).toBe('1,234,567.891'))
  it('percent', () => expect(formatNumber(0.256, { style: 'percent', maximumFractionDigits: 1 })).toBe('25.6%'))
  it('currency', () => expect(formatNumber(1499.5, { style: 'currency', currency: 'EUR' })).toBe('€1,499.50'))
  it('currency code is case-insensitive and trimmed', () => expect(formatNumber(1, { style: 'currency', currency: ' eur ' })).toBe('€1.00'))
  it('unit', () => expect(formatNumber(5, { style: 'unit', unit: 'kilometer' })).toMatch(/^5 km$/))
  it('compact style maps to compact notation', () => expect(formatNumber(1234567, { style: 'compact' })).toBe('1.2M'))
  it('explicit notation wins over style compact', () => expect(formatNumber(1234, { style: 'compact', notation: 'standard' })).toBe('1,234'))
  it.each([
    ['compact', '123M'],
    ['scientific', '1.235E8'],
    ['engineering', '123.457E6'],
    ['standard', '123,456,789'],
  ] as const)('notation %s', (notation, out) => expect(formatNumber(123456789, { notation })).toBe(out))
  it.each([
    ['auto', '5'],
    ['always', '+5'],
    ['never', '5'],
    ['exceptZero', '+5'],
    ['negative', '5'],
  ] as const)('signDisplay %s for 5', (signDisplay, out) => expect(formatNumber(5, { signDisplay })).toBe(out))
  it('signDisplay negative drops the sign of a value that rounds to zero', () => expect(formatNumber(-0.001, { signDisplay: 'negative', maximumFractionDigits: 0 })).toBe('0'))
  it('signDisplay auto keeps the sign of a value that rounds to zero', () => expect(formatNumber(-0.001, { maximumFractionDigits: 0 })).toBe('-0'))
  it('fraction digits', () => {
    expect(formatNumber(3, { minimumFractionDigits: 2 })).toBe('3.00')
    expect(formatNumber(3.14159, { maximumFractionDigits: 0 })).toBe('3')
  })
  it('German locale', () => expect(ws(formatNumber(1234567.891, { locale: 'de-DE', style: 'currency', currency: 'EUR' }))).toBe('1.234.567,89 €'))
  it('Arabic-Indic digits for ar-EG', () => expect(formatNumber(123, { locale: 'ar-EG' })).toBe('١٢٣'))
  it('-0 renders as 0', () => expect(formatNumber(-0)).toBe('0'))
})

describe('formatNumber: bigint and strings', () => {
  it('formats a bigint exactly', () => expect(formatNumber(12345678901234567890n)).toBe('12,345,678,901,234,567,890'))
  it('formats a bigint compactly', () => expect(formatNumber(123456789n, { style: 'compact' })).toBe('123M'))
  it('formats a negative bigint as percent', () => expect(formatNumber(-3n, { style: 'percent' })).toBe('-300%'))
  it('keeps the precision of a numeric string', () => expect(formatNumber('12345678901234567890.123')).toBe('12,345,678,901,234,567,890.123'))
  it('parses exponent strings', () => expect(formatNumber('1e6')).toBe('1,000,000'))
})

describe('formatNumber: invalid values', () => {
  it.each([NaN, Infinity, -Infinity, '', ' ', 'abc', null, undefined, {}, [], true])('%s renders the default fallback', (v) => expect(formatNumber(v)).toBe('n/a'))
  it('custom fallback', () => expect(formatNumber(NaN, { fallback: 'No data' })).toBe('No data'))
  it('empty fallback', () => expect(formatNumber(NaN, { fallback: '' })).toBe(''))
  it('the default fallback has no dash', () => expect(formatNumber(NaN)).not.toMatch(/[-–—]/))
  it('a hostile string stays text, never markup', () => expect(formatNumber('<img src=x onerror=alert(1)>')).toBe('n/a'))
  it('a huge double formats without throwing', () => expect(formatNumber(Number.MAX_VALUE)).toMatch(/^179,769,313/))
  it('a tiny double formats', () => expect(formatNumber(Number.MIN_VALUE)).toBe('0'))
})

describe('formatNumber: safe fallbacks for bad options', () => {
  it('currency style without currency is decimal', () => expect(formatNumber(5, { style: 'currency' })).toBe('5'))
  it('currency style with a blank currency is decimal', () => expect(formatNumber(5, { style: 'currency', currency: '  ' })).toBe('5'))
  it.each(['EURO', 'E1', '12', 'eu', '', 'e-r'])('malformed currency %j is decimal', (currency) => expect(formatNumber(5, { style: 'currency', currency })).toBe('5'))
  it('unit style without unit is decimal', () => expect(formatNumber(5, { style: 'unit' })).toBe('5'))
  it('unknown unit renders the number then the unit text', () => expect(formatNumber(7, { style: 'unit', unit: 'parsec' })).toBe('7 parsec'))
  it('unknown unit with unsafe text renders plain decimal only', () => expect(formatNumber(7, { style: 'unit', unit: '<b>x</b>' })).toBe('7'))
  it('unknown unit keeps fraction digits and notation', () => expect(formatNumber(1500, { style: 'unit', unit: 'parsec', notation: 'compact', maximumFractionDigits: 1 })).toBe('1.5K parsec'))
  it('unknown style is decimal', () => expect(formatNumber(5, { style: 'bogus' as never })).toBe('5'))
  it('unknown notation is ignored', () => expect(formatNumber(1234, { notation: 'bogus' as never })).toBe('1,234'))
  it('unknown signDisplay is ignored', () => expect(formatNumber(5, { signDisplay: 'bogus' as never })).toBe('5'))
  it.each(['xx_bad', '!!', '1234', 'en-', ' ', '', 'a'.repeat(100)])('bad locale %j falls back to en', (locale) => expect(formatNumber(1234.5, { locale })).toBe('1,234.5'))
  it('unknown but well formed locale still formats', () => expect(formatNumber(1234.5, { locale: 'xx' })).toMatch(/1.?234/))
  it('clamps fraction digits above 20', () => expect(formatNumber(1, { minimumFractionDigits: 500 })).toBe('1.' + '0'.repeat(20)))
  it('clamps negative fraction digits to 0', () => expect(formatNumber(1.6, { maximumFractionDigits: -5 })).toBe('2'))
  it('raises max to min when max is smaller', () => expect(formatNumber(1, { minimumFractionDigits: 5, maximumFractionDigits: 2 })).toBe('1.00000'))
  it.each([NaN, Infinity, 'x', null, {}])('ignores non-numeric digits %s', (d) => expect(formatNumber(1.5, { minimumFractionDigits: d as never, maximumFractionDigits: d as never })).toBe('1.5'))
  it('accepts numeric string digits', () => expect(formatNumber(1, { minimumFractionDigits: '2' as never })).toBe('1.00'))
  it('truncates fractional digit counts', () => expect(formatNumber(1, { minimumFractionDigits: 2.9 })).toBe('1.00'))
  it('currency options are ignored for other styles', () => expect(formatNumber(5, { currency: 'EUR', unit: 'meter' })).toBe('5'))
})

describe('buildNumberFormatOptions', () => {
  it('returns only the options that apply', () => expect(buildNumberFormatOptions({ style: 'decimal', currency: 'EUR' })).toEqual({ style: 'decimal' }))
  it('maps compact', () => expect(buildNumberFormatOptions({ style: 'compact' })).toEqual({ style: 'decimal', notation: 'compact' }))
  it('defaults with no argument', () => expect(buildNumberFormatOptions()).toEqual({ style: 'decimal' }))
  it('normalises currency', () => expect(buildNumberFormatOptions({ style: 'currency', currency: 'usd' })).toEqual({ style: 'currency', currency: 'USD' }))
})

describe('resolveNumberLocale', () => {
  it('canonicalises', () => expect(resolveNumberLocale('en-us')).toBe('en-US'))
  it.each([undefined, null, 5, '', '  ', 'bad_tag'])('%s resolves to en', (l) => expect(resolveNumberLocale(l)).toBe('en'))
})
