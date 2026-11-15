import { describe, expect, it } from 'vitest'
import { buildRecords, formatTime, normaliseLevel, splitMatches } from './logs'

const E = '\u001b'

describe('normaliseLevel', () => {
  it('accepts aliases in any case and rejects unknown values', () => {
    expect(['TRACE', 'Debug', 'notice', 'Warning', 'ERR', 'fatal', 'info'].map(normaliseLevel)).toEqual(['debug', 'debug', 'info', 'warn', 'error', 'error', 'info'])
    expect(normaliseLevel('loud')).toBeUndefined()
    expect(normaliseLevel(3)).toBeUndefined()
  })
})

describe('formatTime', () => {
  it('shows strings as given and flags ISO values', () => {
    expect(formatTime(' 10:00:01 ')).toEqual({ text: '10:00:01', datetime: undefined })
    expect(formatTime('2026-03-04T10:00:01Z').datetime).toBe('2026-03-04T10:00:01Z')
    expect(formatTime('2026-99-99T99:00:00Z').datetime).toBeUndefined()
  })
  it('formats dates and numbers with Intl in the given zone', () => {
    const t = formatTime(Date.UTC(2026, 2, 4, 10, 0, 1, 123), { locale: 'en', timeZone: 'UTC' })
    expect(t.text).toBe('10:00:01.123')
    expect(t.datetime).toBe('2026-03-04T10:00:01.123Z')
    expect(formatTime(new Date(0), { locale: 'en', timeZone: 'UTC' }).text).toBe('00:00:00.000')
  })
  it('survives invalid input and bad zones', () => {
    expect(formatTime(Number.NaN)).toEqual({ text: '' })
    expect(formatTime(null)).toEqual({ text: '' })
    expect(formatTime(0, { timeZone: 'Not/AZone' }).text).toBe('1970-01-01T00:00:00.000Z')
  })
})

describe('buildRecords', () => {
  it('pulls a leading level out of string lines and keeps the original for copying', () => {
    const { records } = buildRecords(['ERROR: disk full', '[warn] slow', `${E}[31mINFO${E}[0m started`, 'plain', 'information ok', 'ERRORS everywhere'])
    expect(records.map((r) => r.level)).toEqual(['error', 'warn', 'info', undefined, undefined, undefined])
    expect(records[0].text).toBe('disk full')
    expect(records[0].copy).toBe('ERROR: disk full')
    expect(records[2].text).toBe('started')
    expect(records[2].copy).toBe('INFO started')
    expect(records[4].text).toBe('information ok')
    expect(records[5].level).toBeUndefined()
  })
  it('normalises objects, drops blank sources and tolerates junk', () => {
    const { records } = buildRecords([{ message: `${E}[1mhi${E}[0m`, level: 'WARNING', time: '10:00', source: ' api ' }, { message: 'x', source: ' ' }, null as never, 5 as never, { message: undefined as never }], undefined, {})
    expect(records[0]).toMatchObject({ level: 'warn', time: '10:00', source: 'api', text: 'hi', ansi: true, copy: '10:00 WARN api hi' })
    expect(records[1].source).toBeUndefined()
    expect(records[2].text).toBe('')
    expect(records[3].text).toBe('5')
    expect(records[4].text).toBe('')
  })
  it('keeps only the newest maxLines and reports what was dropped', () => {
    const { records, dropped } = buildRecords(['a', 'b', 'c', 'd'], 2)
    expect(dropped).toBe(2)
    expect(records.map((r) => r.text)).toEqual(['c', 'd'])
    expect(records.map((r) => r.index)).toEqual([0, 1])
    expect(buildRecords(['a'], 0).dropped).toBe(0)
    expect(buildRecords(['a'], Number.NaN).records).toHaveLength(1)
    expect(buildRecords(undefined).records).toEqual([])
  })
  it('handles 50k lines within a generous bound', () => {
    const lines = Array.from({ length: 50000 }, (_, i) => (i % 3 ? `INFO line ${i} ok` : { level: 'error', message: `line ${i}`, time: '10:00:00' }))
    const t = performance.now()
    const { records } = buildRecords(lines)
    expect(records).toHaveLength(50000)
    expect(performance.now() - t).toBeLessThan(2000)
  })
})

describe('splitMatches', () => {
  it('marks every case-insensitive occurrence', () => {
    expect(splitMatches('Error and error', 'ERR')).toEqual([{ text: 'Err', match: true }, { text: 'or and ', match: false }, { text: 'err', match: true }, { text: 'or', match: false }])
  })
  it('returns the text whole without a query, a hit, or when lowercasing changes the length', () => {
    expect(splitMatches('abc', '')).toEqual([{ text: 'abc', match: false }])
    expect(splitMatches('abc', 'z')).toEqual([{ text: 'abc', match: false }])
    expect(splitMatches('', 'z')).toEqual([{ text: '', match: false }])
    expect(splitMatches('İx', 'x')).toEqual([{ text: 'İx', match: false }])
  })
})
