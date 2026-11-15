import { describe, expect, it } from 'vitest'
import { formatRelativeTime, toTimestamp } from './formatRelativeTime'

const NOW = Date.UTC(2026, 5, 15, 12, 0, 0)
const S = 1000
const M = 60 * S
const H = 60 * M
const D = 24 * H

describe('formatRelativeTime', () => {
  it.each([
    [0, 'just now'],
    [4_999, 'just now'],
    [5 * S, '5 seconds ago'],
    [59_999, '59 seconds ago'],
    [60 * S, '1 minute ago'],
    [90 * S, '1 minute ago'],
    [59 * M + 59 * S, '59 minutes ago'],
    [H, '1 hour ago'],
    [23 * H + 59 * M, '23 hours ago'],
    [D, 'yesterday'],
    [2 * D, '2 days ago'],
    [29 * D, '29 days ago'],
    [30 * D, 'last month'],
    [364 * D, '12 months ago'],
    [365 * D, 'last year'],
    [3 * 365 * D, '3 years ago'],
  ])('past: %i ms ago -> %s', (ago, expected) => {
    expect(formatRelativeTime(NOW - ago, NOW)).toBe(expected)
  })

  it.each([
    [4_999, 'just now'],
    [30 * S, 'in 30 seconds'],
    [5 * M, 'in 5 minutes'],
    [2 * H, 'in 2 hours'],
    [D, 'tomorrow'],
    [3 * D, 'in 3 days'],
    [400 * D, 'next year'],
  ])('future: %i ms ahead -> %s', (ahead, expected) => {
    expect(formatRelativeTime(NOW + ahead, NOW)).toBe(expected)
  })

  it('accepts Date, number and ISO string inputs', () => {
    const t = NOW - 5 * M
    expect(formatRelativeTime(new Date(t), NOW)).toBe('5 minutes ago')
    expect(formatRelativeTime(t, new Date(NOW))).toBe('5 minutes ago')
    expect(formatRelativeTime(new Date(t).toISOString(), NOW)).toBe('5 minutes ago')
  })

  it('defaults `now` to the current time', () => {
    expect(formatRelativeTime(Date.now() - 10 * M)).toBe('10 minutes ago')
  })

  it.each([undefined, null, '', '   ', 'not a date', Number.NaN, Infinity, new Date('x'), {} as never])('invalid input %s returns an empty string', (v) => {
    expect(formatRelativeTime(v, NOW)).toBe('')
  })

  it('invalid `now` returns an empty string', () => {
    expect(formatRelativeTime(NOW, 'garbage')).toBe('')
  })

  it('supports other locales and falls back to en for invalid locale tags', () => {
    expect(formatRelativeTime(NOW - 5 * M, NOW, 'pl')).toBe('5 minut temu')
    expect(formatRelativeTime(NOW - 5 * M, NOW, 'not a locale!!')).toBe('5 minutes ago')
    expect(formatRelativeTime(NOW - 5 * M, NOW, 'not a locale!!')).toBe('5 minutes ago')
  })
})

describe('toTimestamp', () => {
  it('converts valid inputs and returns NaN for invalid ones', () => {
    expect(toTimestamp(5)).toBe(5)
    expect(toTimestamp(new Date(7))).toBe(7)
    expect(toTimestamp('1970-01-01T00:00:00.009Z')).toBe(9)
    expect(Number.isNaN(toTimestamp(undefined))).toBe(true)
    expect(Number.isNaN(toTimestamp(null))).toBe(true)
    expect(Number.isNaN(toTimestamp(Number.NaN))).toBe(true)
  })
})
